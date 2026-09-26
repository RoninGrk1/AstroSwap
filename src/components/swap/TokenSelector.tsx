"use client";

import type { TokenInfo } from "@/config/tokens";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

export function TokenSelector({
  token,
  onClick,
  label,
}: {
  token: TokenInfo | undefined;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Select token"}
      className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1.5 pr-2.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
    >
      {token ? (
        <>
          <TokenAvatar token={token} />
          <span className="max-w-[5.5rem] truncate sm:max-w-none">
            {token.symbol}
          </span>
        </>
      ) : (
        <span className="pl-2 text-white/60">Select</span>
      )}
      <svg
        className="h-3.5 w-3.5 shrink-0 text-white/40"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden
      >
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
