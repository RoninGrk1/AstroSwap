/**
 * Railgun 0zk wallet create / import / unlock.
 * Mnemonics are not persisted in plaintext.
 */

import {
  NETWORK_CONFIG,
  NetworkName,
  type RailgunWalletInfo,
} from "@railgun-community/shared-models";
import {
  deriveKeysFromPassword,
  loadSessionMeta,
  saveSessionMeta,
  verifyPassword,
  clearSessionMeta,
} from "./security";
import { ensureRailgunEngine, isEngineStarted } from "./engine";

export type CreateWalletResult = {
  info: RailgunWalletInfo;
  /** Shown once — user must back this up. Not stored by AstroSwap. */
  mnemonic: string;
  encryptionKey: string;
};

export type UnlockWalletResult = {
  info: RailgunWalletInfo;
  encryptionKey: string;
};

function creationBlockMap(): Record<string, number> {
  // Start scans near deployment to reduce catch-up for brand-new wallets.
  // Existing historical notes still require progressive sync.
  const { deploymentBlock } = NETWORK_CONFIG[NetworkName.Ethereum];
  return { [NetworkName.Ethereum]: deploymentBlock };
}

export async function generateMnemonic(): Promise<string> {
  const { Mnemonic, randomBytes } = await import("ethers");
  return Mnemonic.fromEntropy(randomBytes(16)).phrase.trim();
}

export async function createRailgunWalletWithPassword(
  password: string,
): Promise<CreateWalletResult> {
  await ensureRailgunEngine();
  const mnemonic = await generateMnemonic();
  const keys = await deriveKeysFromPassword(password);
  const wallet = await import("@railgun-community/wallet");
  const info = await wallet.createRailgunWallet(
    keys.encryptionKey,
    mnemonic,
    creationBlockMap(),
  );
  saveSessionMeta({
    walletId: info.id,
    railgunAddress: info.railgunAddress,
    saltHex: keys.saltHex,
    passwordHashHex: keys.passwordHashHex,
    createdAt: Date.now(),
  });
  return { info, mnemonic, encryptionKey: keys.encryptionKey };
}

export async function importRailgunWalletWithPassword(
  password: string,
  mnemonic: string,
): Promise<UnlockWalletResult> {
  await ensureRailgunEngine();
  const trimmed = mnemonic.trim().replace(/\s+/g, " ");
  const words = trimmed.split(" ");
  if (words.length !== 12 && words.length !== 24) {
    throw new Error("Mnemonic must be 12 or 24 words");
  }
  const keys = await deriveKeysFromPassword(password);
  const wallet = await import("@railgun-community/wallet");
  const info = await wallet.createRailgunWallet(
    keys.encryptionKey,
    trimmed,
    creationBlockMap(),
  );
  saveSessionMeta({
    walletId: info.id,
    railgunAddress: info.railgunAddress,
    saltHex: keys.saltHex,
    passwordHashHex: keys.passwordHashHex,
    createdAt: Date.now(),
  });
  return { info, encryptionKey: keys.encryptionKey };
}

export async function unlockRailgunWallet(
  password: string,
): Promise<UnlockWalletResult> {
  await ensureRailgunEngine();
  const meta = loadSessionMeta();
  if (!meta) throw new Error("No Railgun wallet saved on this device");
  const keys = await verifyPassword(password);
  const wallet = await import("@railgun-community/wallet");
  const info = await wallet.loadWalletByID(
    keys.encryptionKey,
    meta.walletId,
    false,
  );
  return { info, encryptionKey: keys.encryptionKey };
}

export function hasStoredRailgunWallet(): boolean {
  return loadSessionMeta() !== null;
}

export function getStoredRailgunAddress(): string | null {
  return loadSessionMeta()?.railgunAddress ?? null;
}

export function forgetLocalRailgunWallet(): void {
  clearSessionMeta();
}

export function assertEngineReady(): void {
  if (!isEngineStarted()) {
    throw new Error("Railgun engine is not started");
  }
}
