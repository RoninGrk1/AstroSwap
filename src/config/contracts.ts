import { base, mainnet } from "wagmi/chains";
import type { Address } from "viem";

/**
 * Uniswap V3 contract addresses
 * Base: https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
 * Ethereum: https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments
 */
export const UNISWAP_V3: Record<
  number,
  {
    quoterV2: Address;
    swapRouter02: Address;
    factory: Address;
  }
> = {
  [base.id]: {
    quoterV2: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    swapRouter02: "0x2626664c2603336E57B271c5C0b26F421741e481",
    factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  },
  [mainnet.id]: {
    quoterV2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    swapRouter02: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  },
};

/** Common Uniswap V3 fee tiers (hundredths of a bip, i.e. 500 = 0.05%) */
export const FEE_TIERS = [100, 500, 3000, 10000] as const;
export type FeeTier = (typeof FEE_TIERS)[number];

export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const MAX_SLIPPAGE_BPS = 5000; // 50%
