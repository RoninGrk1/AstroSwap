export function humanizeError(error: unknown): string {
  if (!error) return "Unknown error";

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" &&
            error !== null &&
            "shortMessage" in error &&
            typeof (error as { shortMessage: unknown }).shortMessage === "string"
          ? (error as { shortMessage: string }).shortMessage
          : "Something went wrong";

  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return "Transaction rejected in wallet.";
  }
  if (lower.includes("insufficient funds") || lower.includes("insufficient balance")) {
    return "Insufficient balance for this action (including gas).";
  }
  if (lower.includes("allowance") || lower.includes("transfer amount exceeds")) {
    return "Token allowance or balance is too low.";
  }
  if (
    lower.includes("slippage") ||
    lower.includes("too little received") ||
    lower.includes("stf")
  ) {
    return "Price moved beyond your slippage tolerance. Try again or increase slippage.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("rpc") ||
    lower.includes("http request failed") ||
    lower.includes("timeout") ||
    lower.includes("econnrefused") ||
    lower.includes("429")
  ) {
    return "Network or RPC error. Check your connection, try again, or set an Alchemy/Infura key.";
  }
  if (
    lower.includes("railgun") ||
    lower.includes("merkletree") ||
    lower.includes("artifact") ||
    lower.includes("snark") ||
    lower.includes("proving")
  ) {
    return `Railgun engine error: ${truncate(message, 140)}. Retry after checking RPC / network.`;
  }
  if (lower.includes("password") || lower.includes("decrypt") || lower.includes("encryption")) {
    return "Wallet password incorrect, or local wallet metadata is corrupt. Try again or re-import with your mnemonic.";
  }
  if (lower.includes("mnemonic") || lower.includes("bip39")) {
    return "Invalid mnemonic. Use a 12- or 24-word BIP39 phrase.";
  }
  return truncate(message, 180);
}

function truncate(message: string, max: number): string {
  if (message.length > max) return `${message.slice(0, max)}…`;
  return message;
}
