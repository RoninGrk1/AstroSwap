import type { PrivacyCapability } from "./types";
import { isRailgunSupportedChain } from "./chains";

/**
 * Honest capability snapshot for phase 2.
 * Private AMM swaps (cookbook + 0x) are not shipped — shield + balance is.
 */
export function getPrivacyCapability(args: {
  chainId: number | undefined;
  engineReady: boolean;
  walletUnlocked: boolean;
}): PrivacyCapability {
  const { chainId, engineReady, walletUnlocked } = args;

  if (chainId !== undefined && !isRailgunSupportedChain(chainId)) {
    return {
      mode: "private",
      available: false,
      slice: "shield-balance-unshield",
      reason:
        "Railgun is not deployed on this chain. Switch to Ethereum mainnet for private shield / balance, or use Public mode for Uniswap swaps.",
      shielded: [
        "Sender/receiver linkability inside the Railgun set (on supported chains)",
        "Shielded balances after a successful shield + sync",
      ],
      notShielded: [
        "Gas payments on the public chain",
        "Shield / unshield boundary transactions (amounts + token visible)",
        "Any public Uniswap swap",
        "Base chain activity (no Railgun deployment)",
      ],
      nextSteps: [
        "Switch wallet network to Ethereum",
        "Initialise Railgun engine + unlock / create a 0zk wallet",
        "Shield ERC-20 / ETH — then wait for merkletree sync to view private balances",
      ],
    };
  }

  if (!engineReady || !walletUnlocked) {
    return {
      mode: "private",
      available: false,
      slice: "shield-balance-unshield",
      reason:
        "Private actions need the Railgun engine initialised and a 0zk wallet unlocked. No private transaction will be submitted until then.",
      shielded: [
        "0zk address and note ownership (once wallet exists)",
        "Amounts inside shielded notes after a real shield confirms",
      ],
      notShielded: [
        "Gas payer address and shield/unshield amounts on-chain",
        "Public Uniswap swaps",
      ],
      nextSteps: [
        "Open Private mode on Ethereum and complete Railgun setup",
        "Create or unlock your Railgun wallet with a password (mnemonic never stored in plaintext)",
      ],
    };
  }

  return {
    mode: "private",
    available: true,
    slice: "shield-balance-unshield",
    reason:
      "Shield into Railgun on Ethereum is available. Private Uniswap-style swaps (cookbook / 0x cross-contract) are not enabled in this release. Unshield requires the Groth16 prover + artifacts and may be slow on first use.",
    shielded: [
      "Link between your public address and later private spends (after shield)",
      "Internal private balances and private transfers within Railgun",
    ],
    notShielded: [
      "The shield transaction itself (token, amount, your public address → Railgun contract)",
      "Gas payments",
      "Unshield exits (token + amount become public again)",
      "Private AMM swaps — not shipped (needs @railgun-community/cookbook aligned with wallet major + 0x / broadcaster)",
    ],
    nextSteps: [
      "Shield supported ERC-20s or ETH on Ethereum",
      "Refresh private balances after sync",
      "Phase 2.1: wire unshield proofs + optional cookbook private swap",
    ],
  };
}

/** Static phase banner used on Privacy page */
export const PHASE2_PRIVACY: PrivacyCapability = {
  mode: "private",
  available: false,
  slice: "shield-balance-unshield",
  reason:
    "Phase 2 ships real Railgun shield + private balance scanning on Ethereum. Private mode does not fake balances or tx hashes. Base remains public-swap-only.",
  shielded: [
    "Note ownership and internal balances after shield + sync",
    "Sender/receiver unlinkability for later private transfers (when used)",
  ],
  notShielded: [
    "Shield / unshield boundary txs",
    "Gas payer",
    "Public Uniswap swaps",
    "Base (no Railgun deployment)",
  ],
  nextSteps: [
    "Use Private mode on Ethereum → set up Railgun wallet → Shield",
    "Private cookbook swaps deferred until SDK majors align (wallet 10.x vs cookbook 3.x / shared-models 8.x)",
  ],
};
