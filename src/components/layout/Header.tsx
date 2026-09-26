"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogoMark } from "./Logo";

const NAV = [
  { href: "/", label: "Swap" },
  { href: "/activity", label: "Activity" },
  { href: "/privacy", label: "Privacy" },
];

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-full px-3 text-sm font-medium transition sm:flex-none sm:px-3.5 ${
        active
          ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={active}
          />
        );
      })}
    </>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05040f]/75 pt-[var(--safe-top)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Top row: brand + desktop nav + connect — never clips wallet */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-2"
            aria-label="AstroSwap home"
          >
            <span className="shrink-0 drop-shadow-[0_0_16px_rgba(139,92,246,0.45)] transition group-hover:drop-shadow-[0_0_20px_rgba(167,139,250,0.55)]">
              <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                AstroSwap
              </div>
              <div className="hidden text-[10px] text-violet-200/70 sm:block">
                Swap Freely. Trade Privately.
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            <NavLinks />
          </nav>

          <div className="flex shrink-0 items-center [&_button]:min-h-[44px] [&_button]:rounded-xl">
            <ConnectButton
              chainStatus="icon"
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>
        </div>

        {/* Mobile nav pills — full-width equal segments, ≥44px */}
        <nav
          className="flex w-full items-center gap-0.5 rounded-full border border-white/5 bg-black/30 p-0.5 sm:hidden"
          aria-label="Main"
        >
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
