"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { maxUint256, type Hash } from "viem";
import type { TokenInfo } from "@/config/tokens";
import { getExplorerTxUrl } from "@/config/chains";
import { buildExactInputSingle } from "@/lib/uniswap/swap";
import { ERC20_ABI } from "@/lib/uniswap/abi";
import type { QuoteResult } from "@/lib/uniswap/quoter";
import { humanizeError } from "@/lib/errors";
import { formatTokenAmount } from "@/lib/format";
import { useActivity } from "./useActivity";

export type SwapPhase =
  | "idle"
  | "approving"
  | "approval_confirming"
  | "swapping"
  | "confirming"
  | "success"
  | "error";

export function useSwapExecution() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { add, update } = useActivity();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [phase, setPhase] = useState<SwapPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [activityId, setActivityId] = useState<string | null>(null);

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  useEffect(() => {
    if (!txHash || !activityId) return;
    if (receipt.isSuccess && phase === "confirming") {
      setPhase("success");
      update(activityId, { status: "success" });
    }
    if (receipt.isError && phase === "confirming") {
      const msg = humanizeError(receipt.error);
      setPhase("error");
      setError(msg);
      update(activityId, { status: "failed", error: msg });
    }
  }, [
    txHash,
    activityId,
    receipt.isSuccess,
    receipt.isError,
    receipt.error,
    phase,
    update,
  ]);

  const execute = useCallback(
    async (args: {
      tokenIn: TokenInfo;
      tokenOut: TokenInfo;
      amountIn: bigint;
      quote: QuoteResult;
      slippageBps: number;
      allowance: bigint;
    }) => {
      const { tokenIn, tokenOut, amountIn, quote, slippageBps, allowance } =
        args;
      setError(null);

      if (!address || !chainId) {
        setError("Connect your wallet first.");
        setPhase("error");
        return;
      }

      let currentActivityId: string | null = null;

      try {
        const built = buildExactInputSingle({
          chainId,
          tokenIn,
          tokenOut,
          amountIn,
          quote,
          slippageBps,
          recipient: address,
        });

        const activity = add({
          chainId,
          status: "pending",
          tokenInSymbol: tokenIn.symbol,
          tokenOutSymbol: tokenOut.symbol,
          amountIn: formatTokenAmount(amountIn, tokenIn.decimals),
          amountOut: formatTokenAmount(quote.amountOut, tokenOut.decimals),
          feeTier: quote.fee,
          slippageBps,
          privacyMode: "public",
        });
        currentActivityId = activity.id;
        setActivityId(activity.id);

        if (built.needsApproval && built.approvalToken) {
          if (allowance < amountIn) {
            setPhase("approving");
            const approveHash = await writeContractAsync({
              address: built.approvalToken,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [built.approvalSpender, maxUint256],
            });
            setPhase("approval_confirming");
            if (publicClient) {
              await publicClient.waitForTransactionReceipt({
                hash: approveHash,
              });
            }
          }
        }

        setPhase("swapping");
        const hash = await sendTransactionAsync({
          to: built.to,
          data: built.data,
          value: built.value,
        });

        setTxHash(hash);
        setPhase("confirming");
        update(activity.id, {
          status: "confirming",
          hash,
          explorerUrl: getExplorerTxUrl(chainId, hash),
        });
      } catch (e) {
        const msg = humanizeError(e);
        setError(msg);
        setPhase("error");
        if (currentActivityId) {
          update(currentActivityId, {
            status: msg.toLowerCase().includes("rejected")
              ? "rejected"
              : "failed",
            error: msg,
          });
        }
      }
    },
    [
      address,
      chainId,
      add,
      update,
      writeContractAsync,
      sendTransactionAsync,
      publicClient,
    ],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setTxHash(undefined);
    setActivityId(null);
  }, []);

  return {
    execute,
    phase,
    error,
    txHash,
    receipt,
    reset,
    explorerUrl:
      txHash && chainId ? getExplorerTxUrl(chainId, txHash) : undefined,
  };
}
