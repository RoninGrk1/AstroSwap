import {
  type Address,
  type PublicClient,
  encodeFunctionData,
  decodeFunctionResult,
} from "viem";
import { UNISWAP_V3, FEE_TIERS, type FeeTier } from "@/config/contracts";
import { QUOTER_V2_ABI } from "./abi";

export type QuoteResult = {
  amountOut: bigint;
  fee: FeeTier;
  gasEstimate: bigint;
  sqrtPriceX96After: bigint;
};

/**
 * QuoteExactInputSingle via QuoterV2.
 * QuoterV2 reverts with the quote result embedded — call via eth_call and decode.
 * We try common fee tiers and pick the best amountOut.
 */
export async function quoteExactInputBest(
  client: PublicClient,
  chainId: number,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
): Promise<QuoteResult | null> {
  if (amountIn <= BigInt(0)) return null;
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) return null;

  const contracts = UNISWAP_V3[chainId];
  if (!contracts) return null;

  const results = await Promise.all(
    FEE_TIERS.map(async (fee) => {
      try {
        const data = encodeFunctionData({
          abi: QUOTER_V2_ABI,
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn,
              tokenOut,
              amountIn,
              fee,
              sqrtPriceLimitX96: BigInt(0),
            },
          ],
        });

        const raw = await client.call({
          to: contracts.quoterV2,
          data,
        });

        if (!raw.data) return null;

        const decoded = decodeFunctionResult({
          abi: QUOTER_V2_ABI,
          functionName: "quoteExactInputSingle",
          data: raw.data,
        });

        const [amountOut, sqrtPriceX96After, , gasEstimate] = decoded;
        if (amountOut <= BigInt(0)) return null;

        return {
          amountOut,
          fee,
          gasEstimate,
          sqrtPriceX96After,
        } satisfies QuoteResult;
      } catch {
        return null;
      }
    }),
  );

  let best: QuoteResult | null = null;
  for (const r of results) {
    if (!r) continue;
    if (!best || r.amountOut > best.amountOut) best = r;
  }
  return best;
}

export function applySlippage(amountOut: bigint, slippageBps: number): bigint {
  if (slippageBps < 0) return amountOut;
  return (amountOut * BigInt(10_000 - slippageBps)) / BigInt(10_000);
}

/** Rough price impact vs mid when we only have a single-hop quote (optional display). */
export function estimatePriceImpactBps(
  amountIn: bigint,
  amountOut: bigint,
  inDecimals: number,
  outDecimals: number,
  /** Optional external mid price: tokenOut per tokenIn */
  midOutPerIn?: number,
): number | undefined {
  if (!midOutPerIn || midOutPerIn <= 0 || amountIn <= BigInt(0) || amountOut <= BigInt(0)) {
    return undefined;
  }
  const inNum = Number(amountIn) / 10 ** inDecimals;
  const outNum = Number(amountOut) / 10 ** outDecimals;
  if (inNum <= 0) return undefined;
  const exec = outNum / inNum;
  const impact = ((midOutPerIn - exec) / midOutPerIn) * 10_000;
  if (!Number.isFinite(impact)) return undefined;
  return Math.max(0, Math.round(impact));
}
