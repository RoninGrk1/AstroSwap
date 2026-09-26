import { SwapCard } from "@/components/swap/SwapCard";
import { ActivityPanel } from "@/components/activity/ActivityPanel";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:gap-10">
      <div className="w-full max-w-xl px-0.5 text-center">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-violet-300/80 sm:text-xs">
          Explore Beyond
        </p>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          Swap Freely.{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            Trade Privately.
          </span>
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-white/50 sm:mt-3">
          Public Uniswap V3 on Base &amp; Ethereum. Railgun shield + private
          balances on Ethereum — we never fake privacy, balances, or txs.
        </p>
      </div>

      <SwapCard />

      <Card className="w-full max-w-md overflow-hidden p-3.5 sm:p-5">
        <ActivityPanel embed />
      </Card>
    </div>
  );
}
