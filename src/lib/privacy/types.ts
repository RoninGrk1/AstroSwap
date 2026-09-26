/**
 * Typed interfaces for Railgun privacy integration (phase 2).
 * Never invent private balances, proofs, or transaction hashes.
 */

export type PrivacyMode = "public" | "private";

export type RailgunChainSupport = {
  chainId: number;
  name: string;
  supported: boolean;
  notes: string;
};

export type PrivacyCapability = {
  mode: PrivacyMode;
  /** True only when a real private on-chain action can execute */
  available: boolean;
  reason: string;
  shielded: string[];
  notShielded: string[];
  nextSteps: string[];
  /** Highest slice delivered this phase */
  slice:
    | "private-swap"
    | "shield-balance-unshield"
    | "interfaces-only";
};

export type RailgunEnginePhase =
  | "idle"
  | "initialising"
  | "ready"
  | "error";

export type RailgunWalletPhase =
  | "none"
  | "creating"
  | "unlocking"
  | "unlocked"
  | "error";

export type RailgunScanPhase =
  | "idle"
  | "syncing"
  | "synced"
  | "error";

export type PrivateActionPhase =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "approving"
  | "approval_confirming"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export type ShieldedBalanceRow = {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  /** Real spendable amount from Railgun balance scan — never fabricated */
  amount: bigint;
  bucket?: string;
};

export type RailgunSessionMeta = {
  walletId: string;
  railgunAddress: string;
  /** Hex salt for PBKDF2 — not secret alone */
  saltHex: string;
  /** Password verification hash (high iteration) — not the encryption key */
  passwordHashHex: string;
  createdAt: number;
};

export type MerkletreeProgress = {
  progress: number;
  status: string;
};
