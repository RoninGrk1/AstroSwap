import { NetworkName, NETWORK_CONFIG } from "@railgun-community/shared-models";
import type { RailgunChainSupport } from "./types";

/** AstroSwap-configured chains vs actual Railgun deployments */
export const RAILGUN_CHAIN_NOTES: RailgunChainSupport[] = [
  {
    chainId: 1,
    name: "Ethereum",
    supported: true,
    notes:
      "Railgun is live on Ethereum mainnet. Private mode enables real shield into the Railgun anonymity set (and balance view after sync).",
  },
  {
    chainId: 8453,
    name: "Base",
    supported: false,
    notes:
      "Railgun is not deployed on Base. Public Uniswap swaps remain available. Private mode stays disabled on this chain. (DAO PSR #27 proposed Base deployment as of Aug 2026 — not live.)",
  },
];

export const RAILGUN_SUPPORTED_CHAIN_IDS = new Set(
  RAILGUN_CHAIN_NOTES.filter((c) => c.supported).map((c) => c.chainId),
);

export function isRailgunSupportedChain(chainId: number | undefined): boolean {
  return chainId !== undefined && RAILGUN_SUPPORTED_CHAIN_IDS.has(chainId);
}

export function chainIdToNetworkName(
  chainId: number,
): NetworkName | undefined {
  if (chainId === 1) return NetworkName.Ethereum;
  return undefined;
}

export function getRailgunNetworkConfig(chainId: number) {
  const name = chainIdToNetworkName(chainId);
  if (!name) return undefined;
  return NETWORK_CONFIG[name];
}

/** Official Railgun Ethereum contracts from @railgun-community/shared-models */
export const RAILGUN_ETHEREUM = NETWORK_CONFIG[NetworkName.Ethereum];

export const RAILGUN_PROXY_ETH =
  RAILGUN_ETHEREUM.proxyContract.toLowerCase() as `0x${string}`;
export const RAILGUN_RELAY_ADAPT_ETH =
  RAILGUN_ETHEREUM.relayAdaptContract.toLowerCase() as `0x${string}`;
