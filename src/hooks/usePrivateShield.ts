"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { keccak256, toBytes, type Hash, maxUint256 } from "viem";
import type { TokenInfo } from "@/config/tokens";
import { getExplorerTxUrl } from "@/config/chains";
import { humanizeError } from "@/lib/errors";
import { formatTokenAmount } from "@/lib/format";
import {
  getShieldSignatureMessage,
  populateErc20Shield,
  populateNativeEthShield,
} from "@/lib/privacy/shield";
import type { PrivateActionPhase } from "@/lib/privacy/types";
import { useActivity } from "./useActivity";

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

export function usePrivateShield() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { add, update } = useActivity();

  const [phase, setPhase] = useState<PrivateActionPhase>("idle");
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

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setTxHash(undefined);
    setActivityId(null);
  }, []);

  const shield = useCallback(
    async (args: {
      token: TokenInfo;
      amount: bigint;
      railgunAddress: string;
    }) => {
      if (!address || !chainId) {
        throw new Error("Connect a wallet on Ethereum first");
      }
      setError(null);
      setPhase("preparing");

      const act = add({
        chainId,
        status: "pending",
        tokenInSymbol: args.token.symbol,
        tokenOutSymbol: "0zk",
        amountIn: formatTokenAmount(args.amount, args.token.decimals),
        privacyMode: "private",
      });
      setActivityId(act.id);

      try {
        setPhase("awaiting_signature");
        const message = await getShieldSignatureMessage();
        const signature = await signMessageAsync({ message });
        const shieldPrivateKey = keccak256(toBytes(signature));

        let populated;
        if (args.token.isNative) {
          populated = await populateNativeEthShield({
            chainId,
            railgunAddress: args.railgunAddress,
            fromAddress: address,
            amount: args.amount,
            shieldPrivateKey,
          });
        } else {
          populated = await populateErc20Shield({
            chainId,
            railgunAddress: args.railgunAddress,
            fromAddress: address,
            tokenAddress: args.token.address,
            amount: args.amount,
            shieldPrivateKey,
          });

          let current = BigInt(0);
          if (publicClient) {
            current = (await publicClient.readContract({
              address: args.token.address,
              abi: ERC20_ABI,
              functionName: "allowance",
              args: [address, populated.proxyContract],
            })) as bigint;
          }
          if (current < args.amount) {
            setPhase("approving");
            const approveHash = await writeContractAsync({
              address: args.token.address,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [populated.proxyContract, maxUint256],
            });
            setPhase("approval_confirming");
            if (publicClient) {
              await publicClient.waitForTransactionReceipt({
                hash: approveHash,
              });
            }
          }
        }

        setPhase("submitting");
        const hash = await sendTransactionAsync({
          to: populated.to,
          data: populated.data,
          value: populated.value,
        });
        setTxHash(hash);
        setPhase("confirming");
        update(act.id, {
          status: "confirming",
          hash,
          explorerUrl: getExplorerTxUrl(chainId, hash),
        });
      } catch (err) {
        const msg = humanizeError(err);
        setPhase("error");
        setError(msg);
        update(act.id, { status: "failed", error: msg });
      }
    },
    [
      address,
      chainId,
      add,
      update,
      signMessageAsync,
      sendTransactionAsync,
      writeContractAsync,
      publicClient,
    ],
  );

  return {
    shield,
    phase,
    error,
    txHash,
    explorerUrl:
      txHash && chainId ? getExplorerTxUrl(chainId, txHash) : undefined,
    reset,
  };
}
