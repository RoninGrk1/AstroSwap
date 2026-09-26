"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";

export function ErrorAlert({
  children,
  onRetry,
  retryLabel = "Retry",
  className = "",
}: {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-start justify-between gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100 ${className}`}
    >
      <p className="min-w-0 flex-1 leading-snug">{children}</p>
      {onRetry && (
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-1.5 shrink-0 text-xs"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
