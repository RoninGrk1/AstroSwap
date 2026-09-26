"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, mainnet } from "wagmi/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "";

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY?.trim() || "";
const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY?.trim() || "";

function rpcUrl(chain: "base" | "eth"): string {
  if (alchemyKey) {
    return chain === "base"
      ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  }
  if (infuraKey) {
    return chain === "base"
      ? `https://base-mainnet.infura.io/v3/${infuraKey}`
      : `https://mainnet.infura.io/v3/${infuraKey}`;
  }
  // Public RPCs — work without keys but may rate-limit
  return chain === "base" ? "https://mainnet.base.org" : "https://eth.llamarpc.com";
}

/**
 * RainbowKit requires a non-empty WalletConnect project ID.
 * When missing we use a placeholder so the app still builds and boots;
 * WalletConnect / some mobile wallets will not work until a real ID is set.
 */
export const hasWalletConnectProjectId = Boolean(walletConnectProjectId);
export const hasCustomRpcKey = Boolean(alchemyKey || infuraKey);

export const wagmiConfig = getDefaultConfig({
  appName: "AstroSwap",
  projectId: walletConnectProjectId || "astroswap_missing_wc_project_id",
  chains: [base, mainnet],
  transports: {
    [base.id]: http(rpcUrl("base")),
    [mainnet.id]: http(rpcUrl("eth")),
  },
  ssr: true,
});
