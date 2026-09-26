"use client";

import { useState } from "react";
import type { QuoteResult } from "@/lib/uniswap/quoter";
import type { TokenInfo } from "@/config/tokens";
import { formatTokenAmount, bpsToPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { applySlippage } from "@/lib/uniswap/quoter";

export function SwapDetails({
  tokenIn,
  tokenOut,
  amountIn,
  quote,
  slippageBps,
  isLoading,
}: {
  tokenIn?: TokenInfo;
  tokenOut?: TokenInfo;
  amountIn: bigint | null;
  quote: QuoteResult | null;
  slippageBps: number;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!tokenIn || !tokenOut || !amountIn || amountIn <= BigInt(0)) return null;

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl border border-white/5 bg-black/25 p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!quote) return null;

  const rate =
    Number(quote.amountOut) /
    10 ** tokenOut.decimals /
    (Number(amountIn) / 10 ** tokenIn.decimals);
  const minOut = applySlippage(quote.amountOut, slippageBps);
  const feePct = quote.fee / 10_000;
  const rateLabel = `1 ${tokenIn.symbol} ≈ ${rate.toPrecision(6)} ${tokenOut.symbol}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/25">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        aria-expanded={open}
        aria-controls="swap-details-panel"
      >
        <span className="min-w-0 truncate text-sm text-white/70">{rateLabel}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/45">
          {bpsToPercent(slippageBps)} slip
          <svg
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M2.5 4.5L6 8l3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <dl
          id="swap-details-panel"
          className="space-y-2.5 border-t border-white/5 px-3 py-3 text-sm"
        >
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/45">Rate</dt>
            <dd className="min-w-0 break-anywhere text-right text-white/90">
              {rateLabel}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/45">Min received</dt>
            <dd className="min-w-0 break-anywhere text-right text-white/90">
              {formatTokenAmount(minOut, tokenOut.decimals)} {tokenOut.symbol}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/45">Pool fee</dt>
            <dd className="text-right text-white/90">{feePct}%</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/45">Slippage</dt>
            <dd className="text-right text-white/90">{bpsToPercent(slippageBps)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/45">Price impact</dt>
            <dd
              className="text-right text-white/45"
              title="We do not fabricate mid-market impact without an oracle"
            >
              Not estimated
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/45">Est. gas</dt>
            <dd className="text-right text-white/90">
              ~{quote.gasEstimate.toString()} units
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
