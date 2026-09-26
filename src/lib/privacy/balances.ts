/**
 * Private balance reads — only real amounts from Railgun scans.
 * Until a scan reports values, UI must show syncing / empty — never placeholders.
 */

import {
  ChainType,
  NetworkName,
  TXIDVersion,
  type RailgunBalancesEvent,
  type RailgunERC20Amount,
} from "@railgun-community/shared-models";
import { ensureRailgunEngine } from "./engine";
import type { ShieldedBalanceRow } from "./types";

export type BalanceListener = (rows: ShieldedBalanceRow[]) => void;

const symbolHints: Record<string, { symbol: string; decimals: number }> = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
    symbol: "WETH",
    decimals: 18,
  },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
    symbol: "USDC",
    decimals: 6,
  },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": {
    symbol: "USDT",
    decimals: 6,
  },
  "0x6b175474e89094c44da98b954eedeac495271d0f": {
    symbol: "DAI",
    decimals: 18,
  },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
    symbol: "WBTC",
    decimals: 8,
  },
};

function mapAmounts(
  amounts: RailgunERC20Amount[],
  bucket?: string,
): ShieldedBalanceRow[] {
  return amounts
    .filter((a) => a.amount > BigInt(0))
    .map((a) => {
      const key = a.tokenAddress.toLowerCase();
      const hint = symbolHints[key];
      return {
        tokenAddress: a.tokenAddress,
        symbol: hint?.symbol ?? `${a.tokenAddress.slice(0, 6)}…`,
        decimals: hint?.decimals ?? 18,
        amount: a.amount,
        bucket,
      };
    });
}

export async function watchPrivateBalances(args: {
  walletId: string;
  onUpdate: BalanceListener;
  knownTokens?: { address: string; symbol: string; decimals: number }[];
}): Promise<() => void> {
  await ensureRailgunEngine();
  const wallet = await import("@railgun-community/wallet");

  if (args.knownTokens) {
    for (const t of args.knownTokens) {
      symbolHints[t.address.toLowerCase()] = {
        symbol: t.symbol,
        decimals: t.decimals,
      };
    }
  }

  // Accumulate by token across bucket events; only positive real amounts.
  const byToken = new Map<string, ShieldedBalanceRow>();

  const handler = (evt: RailgunBalancesEvent) => {
    if (evt.railgunWalletID !== args.walletId) return;
    const rows = mapAmounts(evt.erc20Amounts, evt.balanceBucket);
    for (const row of rows) {
      byToken.set(`${row.tokenAddress.toLowerCase()}:${row.bucket ?? ""}`, row);
    }
    // Merge same token across buckets for display (sum)
    const merged = new Map<string, ShieldedBalanceRow>();
    for (const row of byToken.values()) {
      const k = row.tokenAddress.toLowerCase();
      const prev = merged.get(k);
      if (!prev) merged.set(k, { ...row });
      else merged.set(k, { ...prev, amount: prev.amount + row.amount });
    }
    args.onUpdate([...merged.values()]);
  };

  wallet.setOnBalanceUpdateCallback(handler);

  const chain = { type: ChainType.EVM, id: 1 };
  await wallet.refreshBalances(chain, [args.walletId]);

  return () => {
    wallet.setOnBalanceUpdateCallback(undefined);
  };
}

export async function readTokenPrivateBalance(args: {
  walletId: string;
  tokenAddress: string;
  onlySpendable?: boolean;
}): Promise<bigint> {
  await ensureRailgunEngine();
  const walletSdk = await import("@railgun-community/wallet");
  const w = walletSdk.fullWalletForID(args.walletId);
  return walletSdk.balanceForERC20Token(
    TXIDVersion.V2_PoseidonMerkle,
    w,
    NetworkName.Ethereum,
    args.tokenAddress,
    args.onlySpendable ?? true,
  );
}
