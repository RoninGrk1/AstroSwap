import { base, mainnet } from "wagmi/chains";
import type { Address } from "viem";

export type TokenInfo = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  /** Native gas token (ETH) — use WETH under the hood for Uniswap */
  isNative?: boolean;
  logoURI?: string;
};

export const NATIVE_ETH_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address;

/** Canonical WETH addresses used when swapping native ETH */
export const WETH_ADDRESS: Record<number, Address> = {
  [base.id]: "0x4200000000000000000000000000000000000006",
  [mainnet.id]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
};

export const BASE_TOKENS: TokenInfo[] = [
  {
    address: NATIVE_ETH_ADDRESS,
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    chainId: base.id,
    isNative: true,
  },
  {
    address: WETH_ADDRESS[base.id],
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    chainId: base.id,
  },
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: base.id,
  },
  {
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chainId: base.id,
  },
  {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    chainId: base.id,
  },
  {
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    symbol: "cbETH",
    name: "Coinbase Wrapped Staked ETH",
    decimals: 18,
    chainId: base.id,
  },
  {
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    symbol: "USDbC",
    name: "USD Base Coin",
    decimals: 6,
    chainId: base.id,
  },
];

export const ETHEREUM_TOKENS: TokenInfo[] = [
  {
    address: NATIVE_ETH_ADDRESS,
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    chainId: mainnet.id,
    isNative: true,
  },
  {
    address: WETH_ADDRESS[mainnet.id],
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    chainId: mainnet.id,
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: mainnet.id,
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chainId: mainnet.id,
  },
  {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    chainId: mainnet.id,
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    symbol: "WBTC",
    name: "Wrapped BTC",
    decimals: 8,
    chainId: mainnet.id,
  },
];

export const TOKENS_BY_CHAIN: Record<number, TokenInfo[]> = {
  [base.id]: BASE_TOKENS,
  [mainnet.id]: ETHEREUM_TOKENS,
};

export function getTokensForChain(chainId: number): TokenInfo[] {
  return TOKENS_BY_CHAIN[chainId] ?? BASE_TOKENS;
}

export function getTokenByAddress(
  chainId: number,
  address: string,
): TokenInfo | undefined {
  const lower = address.toLowerCase();
  return getTokensForChain(chainId).find(
    (t) => t.address.toLowerCase() === lower,
  );
}

/** Address Uniswap expects (WETH for native ETH) */
export function getSwapTokenAddress(token: TokenInfo): Address {
  if (token.isNative) {
    return WETH_ADDRESS[token.chainId] ?? WETH_ADDRESS[base.id];
  }
  return token.address;
}
