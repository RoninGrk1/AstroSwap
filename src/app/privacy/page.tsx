import { PrivacyPanel } from "@/components/privacy/PrivacyPanel";
import { Card } from "@/components/ui/Card";
import { PHASE2_PRIVACY } from "@/lib/privacy/capability";
import {
  RAILGUN_PROXY_ETH,
  RAILGUN_RELAY_ADAPT_ETH,
} from "@/lib/privacy/chains";

export const metadata = {
  title: "Privacy · AstroSwap",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4 sm:space-y-6">
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-300/70">
          Trade Privately
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Privacy
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Honest status of AstroSwap&apos;s Railgun private path (phase 2).
        </p>
      </div>

      <PrivacyPanel />

      <Card className="space-y-3 overflow-hidden p-3.5 sm:p-5">
        <h2 className="text-base font-semibold text-white">
          How to try private shield
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/70">
          <li>
            Connect a wallet and switch to <strong>Ethereum mainnet</strong>.
          </li>
          <li>
            On Swap, select <strong>Private</strong>.
          </li>
          <li>Initialise the Railgun engine (IndexedDB + WASM artifacts).</li>
          <li>
            Create or unlock a 0zk wallet with a password (backup the mnemonic).
          </li>
          <li>
            Choose a token + amount and press <strong>Shield</strong> — you will
            sign a real on-chain transaction to the Railgun proxy.
          </li>
          <li>
            Private balances appear only after merkletree sync reports them.
          </li>
        </ol>
      </Card>

      <Card className="space-y-3 overflow-hidden p-3.5 sm:p-5">
        <h2 className="text-base font-semibold text-white">Security model</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
          <li>
            Encryption key = PBKDF2(password, salt, 100k). Kept in memory only
            while unlocked.
          </li>
          <li>
            localStorage stores wallet id, 0zk address, salt, and a high-iteration
            password verifier — <em>not</em> the mnemonic or encryption key.
          </li>
          <li>
            Mnemonic is shown once on create for backup. AstroSwap does not
            persist it.
          </li>
        </ul>
      </Card>

      <Card className="space-y-3 overflow-hidden p-3.5 sm:p-5">
        <h2 className="text-base font-semibold text-white">Still blocked</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/70">
          {PHASE2_PRIVACY.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
          <li>
            Full private AMM swaps need{" "}
            <code className="break-anywhere rounded bg-white/5 px-1">
              @railgun-community/cookbook
            </code>{" "}
            aligned with wallet major (cookbook 3.x wants shared-models 8.x;
            stable wallet docs pin 10.4.0 / shared-models 7.x) plus a 0x (or
            similar) quote path and preferably a Waku broadcaster.
          </li>
          <li>
            Unshield is wired in{" "}
            <code className="break-anywhere rounded bg-white/5 px-1">
              src/lib/privacy/unshield.ts
            </code>{" "}
            but requires spendable notes + first-time proving artifact download;
            UI focuses on shield first.
          </li>
        </ol>
        <p className="break-anywhere text-xs text-white/45">
          Proxy {RAILGUN_PROXY_ETH}
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          Relay Adapt {RAILGUN_RELAY_ADAPT_ETH}
        </p>
      </Card>
    </div>
  );
}
