import { base, mainnet } from "wagmi/chains";

export const SUPPORTED_CHAINS = [base, mainnet] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export const PRIMARY_CHAIN = base;
export const DEFAULT_CHAIN_ID = base.id;

export const CHAIN_EXPLORERS: Record<number, string> = {
  [base.id]: "https://basescan.org",
  [mainnet.id]: "https://etherscan.io",
};

export function getExplorerTxUrl(chainId: number, hash: string): string {
  const baseUrl = CHAIN_EXPLORERS[chainId] ?? "https://basescan.org";
  return `${baseUrl}/tx/${hash}`;
}

export function isSupportedChain(chainId: number | undefined): boolean {
  return chainId === base.id || chainId === mainnet.id;
}
