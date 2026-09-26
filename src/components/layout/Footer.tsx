import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 px-4 py-6 pb-[max(1.5rem,calc(var(--safe-bottom)+1rem))] text-center text-xs text-white/45">
      <p className="mx-auto max-w-lg leading-relaxed">
        AstroSwap — public Uniswap V3 on Base &amp; Ethereum; Railgun shield on
        Ethereum. We never fake privacy.
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <Link
          href="/privacy"
          className="inline-flex min-h-[40px] items-center text-violet-300/80 hover:text-violet-200"
        >
          Privacy status
        </Link>
        <span className="text-white/25" aria-hidden>
          ·
        </span>
        <span>Explore Beyond.</span>
      </p>
    </footer>
  );
}
