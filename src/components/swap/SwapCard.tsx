"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TokenSelector } from "./TokenSelector";
import { TokenModal } from "./TokenModal";
import { PrivacyToggle } from "./PrivacyToggle";
import { SwapDetails } from "./SwapDetails";
import { TxConfirmModal } from "./TxConfirmModal";
import { PrivacyPanel } from "@/components/privacy/PrivacyPanel";
import { getTokensForChain, type TokenInfo } from "@/config/tokens";
import { DEFAULT_SLIPPAGE_BPS, MAX_SLIPPAGE_BPS } from "@/config/contracts";
import { isSupportedChain } from "@/config/chains";
import { parseTokenInput, formatTokenAmount } from "@/lib/format";
import type { PrivacyMode } from "@/lib/privacy/types";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenAllowance } from "@/hooks/useTokenAllowance";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useSwapExecution } from "@/hooks/useSwapExecution";

const PrivateShieldPanel = dynamic(
  () =>
    import("@/components/privacy/PrivateShieldPanel").then(
      (m) => m.PrivateShieldPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl border border-white/10 bg-black/20 px-3 py-6 text-center text-xs text-white/50"
        role="status"
        aria-live="polite"
      >
        Loading private Railgun path…
      </div>
    ),
  },
);

export function SwapCard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const tokens = useMemo(
    () => getTokensForChain(isSupportedChain(chainId) ? chainId : base.id),
    [chainId],
  );

  const [tokenIn, setTokenIn] = useState<TokenInfo | undefined>(undefined);
  const [tokenOut, setTokenOut] = useState<TokenInfo | undefined>(undefined);
  const [amountInStr, setAmountInStr] = useState("");
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [showSlippage, setShowSlippage] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("public");
  const [modalSide, setModalSide] = useState<"in" | "out" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize default tokens when chain tokens load / change
  const effectiveIn = tokenIn && tokenIn.chainId === tokens[0]?.chainId
    ? tokenIn
    : tokens[0];
  const effectiveOut =
    tokenOut &&
    tokenOut.chainId === tokens[0]?.chainId &&
    tokenOut.address !== effectiveIn?.address
      ? tokenOut
      : tokens.find((t) => t.symbol === "USDC") ?? tokens[2];

  const amountIn = useMemo(
    () =>
      effectiveIn
        ? parseTokenInput(amountInStr, effectiveIn.decimals)
        : null,
    [amountInStr, effectiveIn],
  );

  const { balance: balanceIn, isLoading: balLoading, refetch: refetchBal } =
    useTokenBalance(effectiveIn);
  const { balance: balanceOut } = useTokenBalance(effectiveOut);
  const { allowance, refetch: refetchAllowance } =
    useTokenAllowance(effectiveIn);

  const { quote, isLoading: quoteLoading, error: quoteError } = useSwapQuote(
    privacyMode === "public" ? effectiveIn : undefined,
    privacyMode === "public" ? effectiveOut : undefined,
    privacyMode === "public" ? amountIn : null,
    refreshKey,
  );

  const {
    execute,
    phase,
    error: execError,
    txHash,
    explorerUrl,
    reset,
  } = useSwapExecution();

  const needsApproval =
    Boolean(effectiveIn && !effectiveIn.isNative && amountIn) &&
    allowance < (amountIn ?? BigInt(0));

  const wrongNetwork = isConnected && !isSupportedChain(chainId);

  const buttonLabel = useMemo(() => {
    if (!isConnected) return "Connect Wallet";
    if (wrongNetwork) return "Switch Network";
    if (isSwitching) return "Switching…";
    if (!amountInStr || amountIn === null) return "Enter Amount";
    if (amountIn <= BigInt(0)) return "Enter Amount";
    if (balanceIn !== undefined && amountIn > balanceIn) return "Insufficient Balance";
    if (quoteLoading) return "Fetching Quote…";
    if (!quote) return quoteError ? "No Route" : "Fetching Quote…";
    if (phase === "approving" || phase === "approval_confirming")
      return "Approving…";
    if (phase === "swapping" || phase === "confirming") return "Confirming…";
    if (needsApproval) return `Approve ${effectiveIn?.symbol ?? "Token"}`;
    return "Swap";
  }, [
    isConnected,
    wrongNetwork,
    isSwitching,
    amountInStr,
    amountIn,
    balanceIn,
    quoteLoading,
    quote,
    quoteError,
    phase,
    needsApproval,
    effectiveIn?.symbol,
  ]);

  const buttonDisabled = useMemo(() => {
    if (!isConnected) return false; // ConnectButton handles
    if (wrongNetwork) return false;
    if (
      phase === "approving" ||
      phase === "approval_confirming" ||
      phase === "swapping" ||
      phase === "confirming"
    )
      return true;
    if (!amountIn || amountIn <= BigInt(0)) return true;
    if (balanceIn !== undefined && amountIn > balanceIn) return true;
    if (!quote || quoteLoading) return true;
    return false;
  }, [
    isConnected,
    wrongNetwork,
    phase,
    amountIn,
    balanceIn,
    quote,
    quoteLoading,
  ]);

  const onSwitchDirection = useCallback(() => {
    if (!effectiveIn || !effectiveOut) return;
    setTokenIn(effectiveOut);
    setTokenOut(effectiveIn);
    if (quote) {
      setAmountInStr(
        formatTokenAmount(quote.amountOut, effectiveOut.decimals, 8),
      );
    } else {
      setAmountInStr("");
    }
  }, [effectiveIn, effectiveOut, quote]);

  const onMax = useCallback(() => {
    if (!effectiveIn || balanceIn === undefined) return;
    setAmountInStr(formatTokenAmount(balanceIn, effectiveIn.decimals, 8));
  }, [effectiveIn, balanceIn]);

  const onSubmit = useCallback(async () => {
    if (!isConnected) return;
    if (wrongNetwork) {
      switchChain?.({ chainId: base.id });
      return;
    }
    if (
      privacyMode === "private" ||
      !effectiveIn ||
      !effectiveOut ||
      !amountIn ||
      !quote
    )
      return;

    await execute({
      tokenIn: effectiveIn,
      tokenOut: effectiveOut,
      amountIn,
      quote,
      slippageBps,
      allowance,
    });
  }, [
    isConnected,
    wrongNetwork,
    switchChain,
    privacyMode,
    effectiveIn,
    effectiveOut,
    amountIn,
    quote,
    slippageBps,
    allowance,
    execute,
  ]);

  const handleModalClose = useCallback(() => {
    if (
      phase === "approving" ||
      phase === "approval_confirming" ||
      phase === "swapping" ||
      phase === "confirming"
    ) {
      return;
    }
    if (phase === "success") {
      setAmountInStr("");
      setRefreshKey((k) => k + 1);
      void refetchBal();
      void refetchAllowance();
    }
    reset();
  }, [phase, reset, refetchBal, refetchAllowance]);

  const amountOutDisplay =
    privacyMode === "public" && quote && effectiveOut
      ? formatTokenAmount(quote.amountOut, effectiveOut.decimals)
      : "";

  const swapReady =
    isConnected &&
    !buttonDisabled &&
    buttonLabel === "Swap";

  return (
    <>
      <Card className="w-full max-w-md overflow-hidden p-3.5 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Swap
            </h1>
            <p className="text-xs text-white/40">
              Uniswap V3 · Base &amp; Ethereum
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSlippage((s) => !s)}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 hover:bg-white/10"
            aria-expanded={showSlippage}
            aria-controls="slippage-panel"
            aria-label={`Slippage settings, currently ${(slippageBps / 100).toFixed(2)} percent`}
          >
            {(slippageBps / 100).toFixed(2)}%
          </button>
        </div>

        <div className="mb-4">
          <PrivacyToggle mode={privacyMode} onChange={setPrivacyMode} />
        </div>

        {showSlippage && (
          <div
            id="slippage-panel"
            className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-3"
          >
            <label
              className="mb-2 block text-xs text-white/50"
              htmlFor="slippage"
            >
              Max slippage
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 50, 100, 300].map((bps) => (
                <button
                  key={bps}
                  type="button"
                  onClick={() => setSlippageBps(bps)}
                  className={`min-h-[40px] rounded-xl px-3 text-xs font-medium ${
                    slippageBps === bps
                      ? "bg-violet-500/30 text-violet-100"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {(bps / 100).toFixed(1)}%
                </button>
              ))}
              <input
                id="slippage"
                type="number"
                min={1}
                max={MAX_SLIPPAGE_BPS}
                value={slippageBps}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setSlippageBps(
                    Math.min(MAX_SLIPPAGE_BPS, Math.max(1, Math.round(v))),
                  );
                }}
                className="min-h-[40px] w-20 rounded-xl border border-white/10 bg-white/5 px-2 text-xs text-white outline-none"
                aria-label="Custom slippage in basis points"
              />
            </div>
          </div>
        )}

        {privacyMode === "private" ? (
          <>
            <PrivacyPanel compact />
            <div className="mt-4">
              <PrivateShieldPanel compact />
            </div>
          </>
        ) : (
          <>
            {/* From */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/35 p-3.5 transition focus-within:border-violet-400/30">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-white/45">
                <span>You pay</span>
                <span className="min-w-0 truncate text-right">
                  Bal{" "}
                  {balLoading
                    ? "…"
                    : formatTokenAmount(balanceIn, effectiveIn?.decimals ?? 18)}
                  {isConnected && balanceIn !== undefined && (
                    <button
                      type="button"
                      onClick={onMax}
                      className="ml-2 inline-flex min-h-[28px] items-center font-semibold text-violet-300 hover:text-violet-200"
                      aria-label="Use maximum balance"
                    >
                      MAX
                    </button>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={amountInStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setAmountInStr(v);
                  }}
                  className="amount-input"
                  aria-label="Amount to sell"
                />
                <TokenSelector
                  token={effectiveIn}
                  onClick={() => setModalSide("in")}
                  label="Select input token"
                />
              </div>
            </div>

            {/* Direction switch — overlapping circular control */}
            <div className="relative z-10 -my-3.5 flex justify-center">
              <button
                type="button"
                onClick={onSwitchDirection}
                className="dir-switch flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[var(--card-elevated)] text-white/70 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5),0_0_0_4px_var(--background)]"
                aria-label="Switch swap direction"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M9 3v12M9 3l-3.5 3.5M9 15l3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* To */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/35 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-white/45">
                <span>You receive</span>
                <span className="min-w-0 truncate text-right">
                  Bal{" "}
                  {formatTokenAmount(balanceOut, effectiveOut?.decimals ?? 18)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  placeholder="0"
                  value={amountOutDisplay}
                  className="amount-input"
                  aria-label="Amount to receive"
                  tabIndex={-1}
                />
                <TokenSelector
                  token={effectiveOut}
                  onClick={() => setModalSide("out")}
                  label="Select output token"
                />
              </div>
            </div>

            <div className="mt-3">
              <SwapDetails
                tokenIn={effectiveIn}
                tokenOut={effectiveOut}
                amountIn={amountIn}
                quote={quote}
                slippageBps={slippageBps}
                isLoading={quoteLoading}
              />
            </div>

            {quoteError && amountIn && amountIn > BigInt(0) && (
              <div className="mt-2">
                <ErrorAlert onRetry={() => setRefreshKey((k) => k + 1)}>
                  {quoteError}
                </ErrorAlert>
              </div>
            )}
          </>
        )}

        {privacyMode === "public" && (
          <div className="mt-4">
            {!isConnected ? (
              <div className="flex justify-center [&_button]:w-full">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button className="w-full text-base" onClick={openConnectModal}>
                      Connect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : (
              <Button
                className={`w-full text-base ${swapReady ? "" : ""}`}
                disabled={buttonDisabled}
                onClick={onSubmit}
              >
                {buttonLabel}
              </Button>
            )}
          </div>
        )}

        {isConnected && address && (
          <p className="mt-3 break-anywhere text-center text-[11px] text-white/40">
            Connected · chain {chainId}
            {wrongNetwork && " (unsupported — switch to Base or Ethereum)"}
          </p>
        )}
      </Card>

      <TokenModal
        open={modalSide !== null}
        tokens={tokens}
        exclude={modalSide === "in" ? effectiveOut : effectiveIn}
        onClose={() => setModalSide(null)}
        onSelect={(t) => {
          if (modalSide === "in") setTokenIn(t);
          if (modalSide === "out") setTokenOut(t);
        }}
      />

      <TxConfirmModal
        open={phase !== "idle"}
        phase={phase}
        error={execError}
        txHash={txHash}
        explorerUrl={explorerUrl}
        onClose={handleModalClose}
        onRetry={() => {
          reset();
          void onSubmit();
        }}
      />
    </>
  );
}
