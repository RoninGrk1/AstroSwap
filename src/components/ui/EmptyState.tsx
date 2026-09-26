import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** @deprecated decorative emoji removed for cleaner product family look */
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center sm:py-12">
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-300/60"
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
          <ellipse
            cx="9"
            cy="9"
            rx="6.5"
            ry="3"
            stroke="currentColor"
            strokeWidth="1.25"
            transform="rotate(-20 9 9)"
          />
        </svg>
      </div>
      <p className="text-sm text-white/60">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-white/40">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
