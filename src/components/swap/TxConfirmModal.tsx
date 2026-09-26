"use client";

import { useEffect, useId } from "react";
import type { SwapPhase } from "@/hooks/useSwapExecution";
import { Button } from "@/components/ui/Button";
import { shortenHash } from "@/lib/format";

export function TxConfirmModal({
  open,
  phase,
  error,
  txHash,
  explorerUrl,
  onClose,
  onRetry,
}: {
  open: boolean;
  phase: SwapPhase;
  error: string | null;
  txHash?: string;
  explorerUrl?: string;
  onClose: () => void;
  onRetry?: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        (phase === "success" || phase === "error" || phase === "idle")
      ) {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, phase, onClose]);

  if (!open) return null;

  const title =
    phase === "approving" || phase === "approval_confirming"
      ? "Approving token"
      : phase === "swapping" || phase === "confirming"
        ? "Confirming swap"
        : phase === "success"
          ? "Swap successful"
          : phase === "error"
            ? "Transaction failed"
            : "Transaction";

  const body =
    phase === "approving"
      ? "Confirm the token approval in your wallet…"
      : phase === "approval_confirming"
        ? "Waiting for approval confirmation…"
        : phase === "swapping"
          ? "Confirm the swap in your wallet…"
          : phase === "confirming"
            ? "Waiting for on-chain confirmation…"
            : phase === "success"
              ? "Your public Uniswap V3 swap is confirmed."
              : (error ?? "Something went wrong.");

  const busy =
    phase === "approving" ||
    phase === "approval_confirming" ||
    phase === "swapping" ||
    phase === "confirming";

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        className="glass-modal w-full max-w-sm rounded-t-3xl border-b-0 p-5 sm:rounded-3xl sm:border pb-[max(1.25rem,calc(var(--safe-bottom)+0.75rem))]"
      >
        <div className="mb-1 flex justify-center sm:hidden" aria-hidden>
          <span className="mb-3 h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="mb-3 flex items-center gap-3">
          {busy && (
            <span
              className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-violet-400 border-t-transparent"
              aria-hidden
            />
          )}
          {phase === "success" && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-lg text-emerald-400"
              aria-hidden
            >
              ✓
            </span>
          )}
          {phase === "error" && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-lg text-rose-400"
              aria-hidden
            >
              !
            </span>
          )}
          <h2 id={titleId} className="text-base font-semibold text-white">
            {title}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-white/75" aria-live="polite">
          {body}
        </p>
        {txHash && (
          <p className="mt-3 break-anywhere font-mono text-xs text-white/50">
            {shortenHash(txHash, 8)}
          </p>
        )}
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-[44px] items-center text-sm text-violet-300 hover:text-violet-200"
          >
            View on explorer ↗
          </a>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {phase === "error" && onRetry && (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Button
            type="button"
            variant={
              phase === "success" || phase === "error" ? "primary" : "secondary"
            }
            onClick={onClose}
            disabled={busy}
            className="min-w-[7rem]"
          >
            {busy ? "Please wait…" : phase === "error" ? "Dismiss" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
