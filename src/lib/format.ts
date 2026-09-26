import { formatUnits, parseUnits } from "viem";

export function formatTokenAmount(
  value: bigint | undefined,
  decimals: number,
  maxFrac = 6,
): string {
  if (value === undefined) return "—";
  const raw = formatUnits(value, decimals);
  const [intPart, frac = ""] = raw.split(".");
  if (!frac) return intPart;
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "");
  return trimmed ? `${intPart}.${trimmed}` : intPart;
}

export function formatUsdish(value: number | undefined, digits = 4): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  if (value < 0.0001) return "<0.0001";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function parseTokenInput(
  input: string,
  decimals: number,
): bigint | null {
  const cleaned = input.trim();
  if (!cleaned || cleaned === ".") return null;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;
  try {
    const [intPart = "0", frac = ""] = cleaned.split(".");
    if (frac.length > decimals) return null;
    return parseUnits(cleaned, decimals);
  } catch {
    return null;
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function shortenHash(hash: string, chars = 6): string {
  if (hash.length < 14) return hash;
  return `${hash.slice(0, 2 + chars)}…${hash.slice(-chars)}`;
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 1 : 2)}%`;
}
