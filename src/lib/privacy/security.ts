/**
 * Railgun wallet security helpers.
 *
 * Security model (honest):
 * - Mnemonic is NEVER written to localStorage / sessionStorage in plaintext.
 * - On create, the mnemonic is returned once for the user to back up; we do not persist it.
 * - Encryption key = PBKDF2(password, salt, 100_000) and lives only in memory for the session.
 * - localStorage holds: walletId, railgunAddress, salt, high-iteration password verifier hash.
 * - Clearing site data / losing the password = wallet cannot be unlocked locally
 *   (recoverable only with the mnemonic via "import").
 */

import type { RailgunSessionMeta } from "./types";

const META_KEY = "astroswap.railgun.meta.v1";
const ENC_ITERATIONS = 100_000;
const VERIFY_ITERATIONS = 1_000_000;

export type DerivedKeys = {
  encryptionKey: string;
  passwordHashHex: string;
  saltHex: string;
};

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("Railgun crypto is browser-only");
  }
}

async function loadWalletSdk() {
  return import("@railgun-community/wallet");
}

export async function deriveKeysFromPassword(
  password: string,
  saltHex?: string,
): Promise<DerivedKeys> {
  assertBrowser();
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const { pbkdf2, getRandomBytes } = await loadWalletSdk();
  const salt = saltHex ?? getRandomBytes(16);
  const [encryptionKey, passwordHashHex] = await Promise.all([
    pbkdf2(password, salt, ENC_ITERATIONS),
    pbkdf2(password, salt, VERIFY_ITERATIONS),
  ]);
  return { encryptionKey, passwordHashHex, saltHex: salt };
}

export function loadSessionMeta(): RailgunSessionMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RailgunSessionMeta;
    if (!parsed.walletId || !parsed.saltHex || !parsed.passwordHashHex) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSessionMeta(meta: RailgunSessionMeta): void {
  assertBrowser();
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function clearSessionMeta(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(META_KEY);
}

export async function verifyPassword(password: string): Promise<DerivedKeys> {
  const meta = loadSessionMeta();
  if (!meta) throw new Error("No Railgun wallet on this device");
  const keys = await deriveKeysFromPassword(password, meta.saltHex);
  if (keys.passwordHashHex !== meta.passwordHashHex) {
    throw new Error("Incorrect password");
  }
  return keys;
}
