"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { TokenInfo } from "@/config/tokens";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

export function TokenModal({
  open,
  tokens,
  onSelect,
  onClose,
  exclude,
}: {
  open: boolean;
  tokens: TokenInfo[];
  onSelect: (token: TokenInfo) => void;
  onClose: () => void;
  exclude?: TokenInfo;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tokens.filter((t) => {
      if (exclude && t.address.toLowerCase() === exclude.address.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    });
  }, [tokens, query, exclude]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-modal flex max-h-[min(85dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-b-0 sm:rounded-3xl sm:border pb-[max(0.75rem,var(--safe-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile sheet cue */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="shrink-0 border-b border-white/10 px-4 pb-3 pt-2 sm:pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id={titleId} className="text-base font-semibold text-white">
              Select a token
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="touch-target inline-flex items-center justify-center rounded-xl text-white/60 hover:bg-white/5 hover:text-white"
              aria-label="Close token picker"
            >
              ✕
            </button>
          </div>
          <label className="sr-only" htmlFor="token-search">
            Search tokens
          </label>
          <input
            id="token-search"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or address"
            autoComplete="off"
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400/50"
          />
        </div>
        <ul
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
          role="listbox"
          aria-label="Tokens"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-white/45">
              No tokens match.
            </li>
          )}
          {filtered.map((token) => (
            <li
              key={`${token.chainId}-${token.address}`}
              role="option"
              aria-selected={false}
            >
              <button
                type="button"
                className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5 focus-visible:bg-white/5 active:bg-white/8"
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
              >
                <TokenAvatar token={token} size="lg" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">
                    {token.symbol}
                  </span>
                  <span className="block truncate text-xs text-white/45">
                    {token.name}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
