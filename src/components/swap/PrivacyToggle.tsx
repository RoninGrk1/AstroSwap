"use client";

import type { PrivacyMode } from "@/lib/privacy/types";

export function PrivacyToggle({
  mode,
  onChange,
}: {
  mode: PrivacyMode;
  onChange: (mode: PrivacyMode) => void;
}) {
  const isPrivate = mode === "private";

  return (
    <div className="space-y-2">
      <div
        className="relative flex rounded-2xl border border-white/10 bg-black/30 p-1"
        role="group"
        aria-label="Privacy mode"
      >
        {/* Sliding thumb */}
        <span
          className="segment-thumb pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]"
          style={{
            transform: isPrivate ? "translateX(100%)" : "translateX(0)",
            background: isPrivate
              ? "linear-gradient(135deg, rgba(139,92,246,0.45), rgba(168,85,247,0.35))"
              : "rgba(255,255,255,0.1)",
          }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => onChange("public")}
          className={`relative z-10 flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
            !isPrivate ? "text-white" : "text-white/50 hover:text-white/80"
          }`}
          aria-pressed={!isPrivate}
        >
          <span aria-hidden className="text-base leading-none">
            ◇
          </span>
          Public
        </button>
        <button
          type="button"
          onClick={() => onChange("private")}
          className={`relative z-10 flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
            isPrivate ? "text-violet-50" : "text-white/50 hover:text-white/80"
          }`}
          aria-pressed={isPrivate}
        >
          <span aria-hidden className="text-base leading-none">
            ◎
          </span>
          Private
        </button>
      </div>
      <p
        className={`text-center text-[11px] sm:text-xs ${
          isPrivate ? "text-violet-300/80" : "text-white/40"
        }`}
        role="status"
        aria-live="polite"
      >
        {isPrivate
          ? "Private · Railgun shield path on Ethereum"
          : "Public · Uniswap V3 on Base & Ethereum"}
      </p>
    </div>
  );
}
