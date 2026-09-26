"use client";

import { useState } from "react";
import type { TokenInfo } from "@/config/tokens";

const HUE: Record<string, string> = {
  ETH: "from-indigo-400 to-blue-500",
  WETH: "from-indigo-400 to-sky-500",
  USDC: "from-sky-400 to-blue-600",
  USDT: "from-emerald-400 to-teal-600",
  DAI: "from-amber-300 to-orange-500",
  cbETH: "from-blue-400 to-indigo-600",
  USDbC: "from-cyan-400 to-blue-500",
};

export function TokenAvatar({
  token,
  size = "md",
}: {
  token?: TokenInfo;
  size?: "sm" | "md" | "lg";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const dim =
    size === "lg" ? "h-9 w-9 text-xs" : size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[10px]";
  const grad = token ? HUE[token.symbol] ?? "from-violet-400 to-fuchsia-500" : "from-white/20 to-white/10";
  const letter = token ? token.symbol.slice(0, 2) : "?";

  if (token?.logoURI && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={token.logoURI}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]`}
      aria-hidden
    >
      {letter}
    </span>
  );
}
