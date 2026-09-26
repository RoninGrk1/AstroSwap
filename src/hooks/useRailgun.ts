"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPrivacyCapability } from "@/lib/privacy/capability";
import {
  hasStoredRailgunWallet,
  getStoredRailgunAddress,
  createRailgunWalletWithPassword,
  importRailgunWalletWithPassword,
  unlockRailgunWallet,
  forgetLocalRailgunWallet,
} from "@/lib/privacy/wallet";
import { ensureRailgunEngine, isEngineStarted } from "@/lib/privacy/engine";
import { watchPrivateBalances } from "@/lib/privacy/balances";
import { isRailgunSupportedChain } from "@/lib/privacy/chains";
import type {
  MerkletreeProgress,
  PrivacyCapability,
  RailgunEnginePhase,
  RailgunScanPhase,
  RailgunWalletPhase,
  ShieldedBalanceRow,
} from "@/lib/privacy/types";
import { ETHEREUM_TOKENS } from "@/config/tokens";
import { humanizeError } from "@/lib/errors";

export function useRailgun(chainId: number | undefined) {
  const [enginePhase, setEnginePhase] = useState<RailgunEnginePhase>("idle");
  const [engineError, setEngineError] = useState<string | null>(null);
  const [walletPhase, setWalletPhase] = useState<RailgunWalletPhase>("none");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [railgunAddress, setRailgunAddress] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [mnemonicOnce, setMnemonicOnce] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<RailgunScanPhase>("idle");
  const [utxoScan, setUtxoScan] = useState<MerkletreeProgress | null>(null);
  const [txidScan, setTxidScan] = useState<MerkletreeProgress | null>(null);
  const [balances, setBalances] = useState<ShieldedBalanceRow[]>([]);
  const [hasStored, setHasStored] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setHasStored(hasStoredRailgunWallet());
    setRailgunAddress(getStoredRailgunAddress());
  }, []);

  const initEngine = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (isEngineStarted()) {
      setEnginePhase("ready");
      return;
    }
    setEnginePhase("initialising");
    setEngineError(null);
    setScanPhase("syncing");
    try {
      await ensureRailgunEngine({
        onUTXOScan: (p) => {
          setUtxoScan(p);
          if (p.status === "Complete" || p.progress >= 1) {
            setScanPhase("synced");
          }
        },
        onTXIDScan: (p) => setTxidScan(p),
      });
      setEnginePhase("ready");
    } catch (err) {
      setEnginePhase("error");
      setEngineError(humanizeError(err));
      setScanPhase("error");
    }
  }, []);

  const createWallet = useCallback(async (password: string) => {
    setWalletPhase("creating");
    setWalletError(null);
    try {
      if (!isEngineStarted()) await ensureRailgunEngine();
      const result = await createRailgunWalletWithPassword(password);
      setWalletId(result.info.id);
      setRailgunAddress(result.info.railgunAddress);
      setEncryptionKey(result.encryptionKey);
      setMnemonicOnce(result.mnemonic);
      setWalletPhase("unlocked");
      setHasStored(true);
      return result;
    } catch (err) {
      setWalletPhase("error");
      setWalletError(humanizeError(err));
      throw err;
    }
  }, []);

  const importWallet = useCallback(
    async (password: string, mnemonic: string) => {
      setWalletPhase("creating");
      setWalletError(null);
      try {
        if (!isEngineStarted()) await ensureRailgunEngine();
        const result = await importRailgunWalletWithPassword(password, mnemonic);
        setWalletId(result.info.id);
        setRailgunAddress(result.info.railgunAddress);
        setEncryptionKey(result.encryptionKey);
        setMnemonicOnce(null);
        setWalletPhase("unlocked");
        setHasStored(true);
        return result;
      } catch (err) {
        setWalletPhase("error");
        setWalletError(humanizeError(err));
        throw err;
      }
    },
    [],
  );

  const unlockWallet = useCallback(async (password: string) => {
    setWalletPhase("unlocking");
    setWalletError(null);
    try {
      if (!isEngineStarted()) await ensureRailgunEngine();
      const result = await unlockRailgunWallet(password);
      setWalletId(result.info.id);
      setRailgunAddress(result.info.railgunAddress);
      setEncryptionKey(result.encryptionKey);
      setWalletPhase("unlocked");
      return result;
    } catch (err) {
      setWalletPhase("error");
      setWalletError(humanizeError(err));
      throw err;
    }
  }, []);

  const lockWallet = useCallback(() => {
    setEncryptionKey(null);
    setWalletId(null);
    setMnemonicOnce(null);
    setBalances([]);
    setWalletPhase(hasStoredRailgunWallet() ? "none" : "none");
    unsubRef.current?.();
    unsubRef.current = null;
  }, []);

  const forgetWallet = useCallback(() => {
    forgetLocalRailgunWallet();
    lockWallet();
    setHasStored(false);
    setRailgunAddress(null);
  }, [lockWallet]);

  // Watch balances when unlocked
  useEffect(() => {
    if (walletPhase !== "unlocked" || !walletId) return;
    let cancelled = false;
    (async () => {
      try {
        const unsub = await watchPrivateBalances({
          walletId,
          knownTokens: ETHEREUM_TOKENS.filter((t) => !t.isNative).map((t) => ({
            address: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
          })),
          onUpdate: (rows) => {
            if (!cancelled) setBalances(rows);
          },
        });
        if (cancelled) unsub();
        else unsubRef.current = unsub;
      } catch {
        /* balance watch failures are non-fatal; UI stays empty */
      }
    })();
    return () => {
      cancelled = true;
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [walletPhase, walletId]);

  const clearMnemonicOnce = useCallback(() => setMnemonicOnce(null), []);

  const capability: PrivacyCapability = useMemo(
    () =>
      getPrivacyCapability({
        chainId,
        engineReady: enginePhase === "ready",
        walletUnlocked: walletPhase === "unlocked",
      }),
    [chainId, enginePhase, walletPhase],
  );

  const privateActionReady =
    isRailgunSupportedChain(chainId) &&
    enginePhase === "ready" &&
    walletPhase === "unlocked" &&
    Boolean(railgunAddress) &&
    Boolean(encryptionKey);

  return {
    enginePhase,
    engineError,
    walletPhase,
    walletError,
    walletId,
    railgunAddress,
    encryptionKey,
    mnemonicOnce,
    clearMnemonicOnce,
    scanPhase,
    utxoScan,
    txidScan,
    balances,
    hasStored,
    capability,
    privateActionReady,
    initEngine,
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    forgetWallet,
  };
}
