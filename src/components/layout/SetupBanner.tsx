"use client";

import { useState } from "react";
import { useSetupStatus } from "@/hooks/useSetupStatus";

export function SetupBanner() {
  const status = useSetupStatus();
  const [dismissed, setDismissed] = useState(false);

  if (status.ready || status.messages.length === 0 || dismissed) return null;

  return (
    <div
      role="status"
      className="relative border-b border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-center text-sm text-amber-50 sm:px-4"
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1.5 inline-flex min-h-[40px] min-w-[44px] items-center justify-center rounded-lg px-2 text-xs text-amber-100/70 hover:bg-amber-400/10 hover:text-amber-50 sm:right-4"
        aria-label="Dismiss setup notice"
      >
        Dismiss
      </button>
      <p className="pr-16 font-medium sm:pr-20">
        Setup recommended for full wallet / RPC reliability
      </p>
      <ul className="mx-auto mt-1 max-w-3xl list-disc space-y-0.5 pl-5 text-left text-amber-100/85 sm:list-none sm:pl-0 sm:text-center">
        {status.messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-amber-100/65">
        Copy <code className="rounded bg-black/30 px-1">.env.example</code> to{" "}
        <code className="rounded bg-black/30 px-1">.env.local</code> and restart{" "}
        <code className="rounded bg-black/30 px-1">npm run dev</code>. Public
        swaps still work without keys (public RPCs may rate-limit).
      </p>
    </div>
  );
}
