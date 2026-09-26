"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TokenSelector } from "@/components/swap/TokenSelector";
import { TokenModal } from "@/components/swap/TokenModal";
import { RailgunWalletCard } from "@/components/privacy/RailgunWalletCard";
import { getTokensForChain, type TokenInfo } from "@/config/tokens";
import { parseTokenInput, formatTokenAmount } from "@/lib/format";
import { isRailgunSupportedChain } from "@/lib/privacy/chains";
import { useRailgun } from "@/hooks/useRailgun";
import { usePrivateShield } from "@/hooks/usePrivateShield";
import { useTokenBalance } from "@/hooks/useTokenBalance";

/**
 * Honest private path: Railgun shield on Ethereum only.
 * Never shows fabricated balances or tx hashes.
 */
export function PrivateShieldPanel({ compact = false }: { compact?: boolean }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const railgun = useRailgun(chainId);
  const {
    shield,
    phase,
    error,
    txHash,
    explorerUrl,
    reset,
  } = usePrivateShield();

  const tokens = useMemo(() => getTokensForChain(mainnet.id), []);
  const [token, setToken] = useState<TokenInfo | undefined>(tokens[0]);
  const [amountStr, setAmountStr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const amount = useMemo(
    () => (token ? parseTokenInput(amountStr, token.decimals) : null),
    [amountStr, token],
  );
  const { balance, isLoading: balLoading } = useTokenBalance(
    isRailgunSupportedChain(chainId) ? token : undefined,
  );

  const supported = isRailgunSupportedChain(chainId);

  const canShield =
    railgun.privateActionReady &&
    Boolean(amount && amount > BigInt(0)) &&
    Boolean(token) &&
    (balance === undefined || (amount !== null && amount <= balance)) &&
    (phase === "idle" || phase === "error" || phase === "success");

  const buttonLabel = (() => {
    if (!isConnected) return "Connect Wallet";
    if (!supported) return "Switch to Ethereum";
    if (isSwitching) return "Switching…";
    if (railgun.enginePhase === "idle") return "Initialise Railgun";
    if (railgun.enginePhase === "initialising") return "Initialising engine…";
    if (railgun.enginePhase === "error") return "Engine error — retry";
    if (railgun.walletPhase !== "unlocked") return "Unlock / create 0zk wallet";
    if (!amountStr || amount === null || amount <= BigInt(0)) return "Enter amount";
    if (balance !== undefined && amount > balance) return "Insufficient balance";
    if (phase === "awaiting_signature") return "Sign shield message…";
    if (phase === "approving" || phase === "approval_confirming")
      return "Approving…";
    if (phase === "preparing" || phase === "submitting") return "Preparing shield…";
    if (phase === "confirming") return "Confirming shield…";
    if (phase === "success") return "Shielded — shield more?";
    return `Shield ${token?.symbol ?? ""}`;
  })();

  const buttonDisabled = (() => {
    if (!isConnected) return false;
    if (!supported) return false;
    if (railgun.enginePhase === "initialising") return true;
    if (railgun.enginePhase === "ready" && railgun.walletPhase !== "unlocked")
      return true;
    if (
      railgun.enginePhase === "ready" &&
      railgun.walletPhase === "unlocked" &&
      !canShield &&
      phase !== "success"
    )
      return true;
    if (
      phase === "awaiting_signature" ||
      phase === "approving" ||
      phase === "approval_confirming" ||
      phase === "preparing" ||
      phase === "submitting" ||
      phase === "confirming"
    )
      return true;
    return false;
  })();

  const onPrimary = async () => {
    if (!isConnected) return;
    if (!supported) {
      switchChain?.({ chainId: mainnet.id });
      return;
    }
    if (railgun.enginePhase !== "ready") {
      await railgun.initEngine();
      return;
    }
    if (railgun.walletPhase !== "unlocked") {
      // Wallet card handles create/unlock — nudge scroll/focus by no-op
      return;
    }
    if (phase === "success") {
      reset();
      setAmountStr("");
      return;
    }
    if (!token || !amount || !railgun.railgunAddress) return;
    await shield({
      token,
      amount,
      railgunAddress: railgun.railgunAddress,
    });
  };

  return (
    <div className="space-y-4">
      {!supported && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-50">
          <p className="font-semibold">Railgun is not on Base</p>
          <p className="mt-1 text-amber-100/80">
            {railgun.capability.reason}
          </p>
        </div>
      )}

      {supported && railgun.enginePhase !== "ready" && (
        <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-sm text-violet-50">
          <p className="font-semibold">Railgun engine</p>
          <p className="mt-1 text-violet-100/80">
            Initialises WASM artifacts, LevelDB (IndexedDB), and the Ethereum
            provider. First run may take a moment. This does not submit any
            transaction.
          </p>
          {railgun.engineError && (
            <div className="mt-2">
              <ErrorAlert onRetry={() => void railgun.initEngine()}>
                {railgun.engineError}
              </ErrorAlert>
            </div>
          )}
        </div>
      )}

      {supported && railgun.enginePhase === "ready" && (
        <RailgunWalletCard railgun={railgun} />
      )}

      {supported && railgun.walletPhase === "unlocked" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-white/45">
              <span>Shield into Railgun</span>
              <span className="min-w-0 truncate text-right">
                Bal{" "}
                {balLoading
                  ? "…"
                  : formatTokenAmount(balance, token?.decimals ?? 18)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={amountStr}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) setAmountStr(v);
                }}
                className="amount-input"
                aria-label="Amount to shield"
              />
              <TokenSelector
                token={token}
                onClick={() => setModalOpen(true)}
                label="Select token to shield"
              />
            </div>
          </div>

          {!compact && (
            <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-xs text-white/50">
              <p className="font-semibold text-white/70">Private balances</p>
              {railgun.balances.length === 0 ? (
                <p className="mt-1">
                  No shielded balances reported yet. After a confirmed shield,
                  balances appear once the merkletree scan includes your notes —
                  we never invent amounts.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {railgun.balances.map((b) => (
                    <li key={b.tokenAddress} className="flex justify-between">
                      <span>{b.symbol}</span>
                      <span className="font-mono">
                        {formatTokenAmount(b.amount, b.decimals)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <ErrorAlert
          onRetry={
            phase === "error" || phase === "idle"
              ? () => {
                  reset();
                }
              : undefined
          }
          retryLabel="Dismiss"
        >
          {error}
        </ErrorAlert>
      )}
      {phase === "success" && txHash && (
        <p className="break-anywhere text-sm text-emerald-300" role="status">
          Shield submitted.{" "}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-200"
            >
              View on explorer ↗
            </a>
          )}
        </p>
      )}

      <div>
        {!isConnected ? (
          <div className="flex justify-center [&_button]:w-full">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button className="w-full" onClick={openConnectModal}>
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={buttonDisabled}
            onClick={onPrimary}
          >
            {buttonLabel}
          </Button>
        )}
      </div>

      <TokenModal
        open={modalOpen}
        tokens={tokens}
        onClose={() => setModalOpen(false)}
        onSelect={(t) => setToken(t)}
      />
    </div>
  );
}
