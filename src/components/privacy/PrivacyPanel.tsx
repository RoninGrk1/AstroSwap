"use client";

import {
  PHASE2_PRIVACY,
  RAILGUN_CHAIN_NOTES,
} from "@/lib/privacy";
import {
  RAILGUN_PROXY_ETH,
  RAILGUN_RELAY_ADAPT_ETH,
} from "@/lib/privacy/chains";

export function PrivacyPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 via-violet-500/8 to-fuchsia-500/5 p-3.5 text-sm text-violet-50 sm:p-4 ${
        compact ? "" : "space-y-4"
      }`}
      aria-labelledby="privacy-panel-title"
    >
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-400/20 text-xs text-violet-200"
            aria-hidden
          >
            ◎
          </span>
          <h3
            id="privacy-panel-title"
            className="font-semibold text-violet-100"
          >
            Phase 2 — real Railgun shield
          </h3>
        </div>
        <p className="text-violet-100/80 leading-relaxed">{PHASE2_PRIVACY.reason}</p>
      </div>

      {!compact && (
        <>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
              What can be shielded
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-violet-100/80">
              {PHASE2_PRIVACY.shielded.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
              What remains visible
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-violet-100/80">
              {PHASE2_PRIVACY.notShielded.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
              Chain notes
            </h4>
            <ul className="space-y-2">
              {RAILGUN_CHAIN_NOTES.map((c) => (
                <li
                  key={c.chainId}
                  className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-xs text-white/50">
                    {c.supported ? "Supported" : "Not supported"}
                  </span>
                  <p className="mt-0.5 text-violet-100/70">{c.notes}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
              Official Ethereum contracts
            </h4>
            <ul className="space-y-1 font-mono text-[11px] text-violet-100/75">
              <li className="break-anywhere">Proxy: {RAILGUN_PROXY_ETH}</li>
              <li className="break-anywhere">Relay Adapt: {RAILGUN_RELAY_ADAPT_ETH}</li>
            </ul>
          </div>
        </>
      )}

      {compact && (
        <p className="mt-2 text-xs leading-relaxed text-violet-200/70">
          On Ethereum, Private mode can shield into Railgun after engine + 0zk
          wallet setup. On Base, private actions stay disabled. We never display
          fake private balances or tx hashes.
        </p>
      )}
    </section>
  );
}
