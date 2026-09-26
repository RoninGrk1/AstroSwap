"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useChainId } from "wagmi";
import type { TokenInfo } from "@/config/tokens";
import { getSwapTokenAddress } from "@/config/tokens";
import { quoteExactInputBest, type QuoteResult } from "@/lib/uniswap/quoter";
import { humanizeError } from "@/lib/errors";

export type SwapQuoteState = {
  quote: QuoteResult | null;
  isLoading: boolean;
  error: string | null;
};

export function useSwapQuote(
  tokenIn: TokenInfo | undefined,
  tokenOut: TokenInfo | undefined,
  amountIn: bigint | null,
  refreshKey = 0,
): SwapQuoteState {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!tokenIn || !tokenOut || !amountIn || amountIn <= BigInt(0) || !publicClient) {
        setQuote(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (tokenIn.chainId !== chainId || tokenOut.chainId !== chainId) {
        setQuote(null);
        setError("Switch to a supported network to get quotes.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await quoteExactInputBest(
          publicClient,
          chainId,
          getSwapTokenAddress(tokenIn),
          getSwapTokenAddress(tokenOut),
          amountIn,
        );
        if (cancelled) return;
        if (!result) {
          setQuote(null);
          setError("No Uniswap V3 liquidity found for this pair / fee tiers.");
        } else {
          setQuote(result);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        setQuote(null);
        setError(humanizeError(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tokenIn, tokenOut, amountIn, publicClient, chainId, refreshKey]);

  return { quote, isLoading, error };
}
