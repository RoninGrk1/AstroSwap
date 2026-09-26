"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { useRailgun } from "@/hooks/useRailgun";

type RailgunApi = ReturnType<typeof useRailgun>;

export function RailgunWalletCard({ railgun }: { railgun: RailgunApi }) {
  const [password, setPassword] = useState("");
  const [mnemonicImport, setMnemonicImport] = useState("");
  const [mode, setMode] = useState<"unlock" | "create" | "import">(
    railgun.hasStored ? "unlock" : "create",
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      if (mode === "create") await railgun.createWallet(password);
      else if (mode === "import")
        await railgun.importWallet(password, mnemonicImport);
      else await railgun.unlockWallet(password);
      setPassword("");
      setMnemonicImport("");
    } catch {
      /* surfaced via railgun.walletError */
    } finally {
      setBusy(false);
    }
  };

  if (railgun.walletPhase === "unlocked" && railgun.railgunAddress) {
    return (
      <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3.5 text-sm sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-emerald-100">0zk wallet unlocked</h3>
            <p className="mt-1 break-anywhere font-mono text-xs text-emerald-100/80">
              {railgun.railgunAddress}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 text-xs"
            onClick={() => railgun.lockWallet()}
            aria-label="Lock 0zk wallet"
          >
            Lock
          </Button>
        </div>
        {railgun.mnemonicOnce && (
          <div
            className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-amber-50"
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              Backup mnemonic (shown once)
            </p>
            <p className="mt-1 break-anywhere font-mono text-xs leading-relaxed">
              {railgun.mnemonicOnce}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                className="text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(railgun.mnemonicOnce!);
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => railgun.clearMnemonicOnce()}
              >
                I saved it — hide
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-amber-100/75">
              AstroSwap does not store this mnemonic. Losing it and your password
              means you cannot recover this 0zk wallet on a new device.
            </p>
          </div>
        )}
        {railgun.scanPhase === "syncing" && (
          <p className="text-xs text-white/55" role="status" aria-live="polite">
            Syncing Railgun merkletree…
            {railgun.utxoScan
              ? ` ${Math.round((railgun.utxoScan.progress || 0) * 100)}%`
              : ""}
          </p>
        )}
        {railgun.scanPhase === "error" && (
          <ErrorAlert onRetry={() => void railgun.initEngine()}>
            Merkletree sync failed. Check RPC connectivity and retry.
          </ErrorAlert>
        )}
      </div>
    );
  }

  const modes = (
    railgun.hasStored
      ? (["unlock", "create", "import"] as const)
      : (["create", "import"] as const)
  );

  return (
    <div className="space-y-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3.5 text-sm text-violet-50 sm:p-4">
      <h3 className="font-semibold text-violet-100">Railgun 0zk wallet</h3>
      <p className="text-xs text-violet-100/75">
        Password derives an encryption key via PBKDF2. The mnemonic is never
        written to localStorage in plaintext — only wallet id, salt, and a
        password verifier hash are stored locally.
      </p>
      <div
        className="flex flex-wrap gap-2 text-xs"
        role="tablist"
        aria-label="Wallet action"
      >
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-[40px] rounded-lg px-3 py-2 capitalize ${
              mode === m
                ? "bg-violet-500/40 text-white"
                : "bg-black/20 text-white/55 hover:text-white/85"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <label className="block text-xs text-violet-200/80" htmlFor="rg-password">
        Password (min 8 chars)
        <input
          id="rg-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && password.length >= 8 && !busy) {
              void onSubmit();
            }
          }}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
        />
      </label>
      {mode === "import" && (
        <label className="block text-xs text-violet-200/80" htmlFor="rg-mnemonic">
          Mnemonic (12 or 24 words)
          <textarea
            id="rg-mnemonic"
            value={mnemonicImport}
            onChange={(e) => setMnemonicImport(e.target.value)}
            rows={3}
            spellCheck={false}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white outline-none focus:border-violet-400/50"
          />
        </label>
      )}
      {railgun.walletError && (
        <ErrorAlert>{railgun.walletError}</ErrorAlert>
      )}
      <Button
        type="button"
        className="w-full"
        disabled={busy || password.length < 8 || (mode === "import" && !mnemonicImport.trim())}
        onClick={onSubmit}
        aria-busy={busy}
      >
        {busy
          ? "Working…"
          : mode === "create"
            ? "Create 0zk wallet"
            : mode === "import"
              ? "Import 0zk wallet"
              : "Unlock"}
      </Button>
      {railgun.hasStored && (
        <button
          type="button"
          className="text-[11px] text-white/45 underline hover:text-white/70"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm(
                "Remove local wallet metadata? You will need your mnemonic to import again.",
              )
            ) {
              railgun.forgetWallet();
            }
          }}
        >
          Forget local wallet metadata
        </button>
      )}
    </div>
  );
}
