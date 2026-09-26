"use client";

import Link from "next/link";
import { useActivity } from "@/hooks/useActivity";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { shortenHash } from "@/lib/format";
import type { ActivityStatus } from "@/lib/activity/store";

const STATUS_STYLE: Record<ActivityStatus, string> = {
  pending: "text-amber-200 bg-amber-500/15",
  confirming: "text-sky-200 bg-sky-500/15",
  success: "text-emerald-200 bg-emerald-500/15",
  failed: "text-rose-200 bg-rose-500/15",
  rejected: "text-white/60 bg-white/10",
};

export function ActivityPanel({ embed = false }: { embed?: boolean }) {
  const { items, clear } = useActivity();

  const content = (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Activity
          </h2>
          <p className="text-xs text-white/45">
            Session history. Only real submitted txs appear here.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            className="!min-h-[40px] !py-1.5 text-xs"
            onClick={clear}
            aria-label="Clear activity history"
          >
            Clear
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No swaps yet this session."
          description="Completed public swaps and shields show status, amounts, and explorer links."
          action={
            embed ? undefined : (
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-xl bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
              >
                Go to Swap
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-2" aria-label="Transaction activity">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-white/5 bg-black/25 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="break-anywhere text-sm font-medium text-white">
                    {item.amountIn} {item.tokenInSymbol} →{" "}
                    {item.amountOut ?? "…"} {item.tokenOutSymbol}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {new Date(item.createdAt).toLocaleString()} ·{" "}
                    {item.privacyMode}
                    {item.feeTier != null && ` · fee ${item.feeTier / 10000}%`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              {item.hash && (
                <p className="mt-2 font-mono text-xs text-white/45">
                  {item.explorerUrl ? (
                    <a
                      href={item.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[36px] items-center text-violet-300 hover:text-violet-200"
                    >
                      {shortenHash(item.hash)} ↗
                    </a>
                  ) : (
                    shortenHash(item.hash)
                  )}
                </p>
              )}
              {item.error && (
                <p
                  className="mt-1 break-anywhere text-xs text-rose-300/90"
                  role="status"
                >
                  {item.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (embed) return <div className="min-w-0">{content}</div>;
  return <Card className="overflow-hidden p-3.5 sm:p-5">{content}</Card>;
}
