"use client";

import { useMemo } from "react";
import {
  hasCustomRpcKey,
  hasWalletConnectProjectId,
} from "@/config/wagmi";

export type SetupStatus = {
  ready: boolean;
  missingWalletConnect: boolean;
  missingRpcKey: boolean;
  messages: string[];
};

export function useSetupStatus(): SetupStatus {
  return useMemo(() => {
    const missingWalletConnect = !hasWalletConnectProjectId;
    const missingRpcKey = !hasCustomRpcKey;
    const messages: string[] = [];

    if (missingWalletConnect) {
      messages.push(
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing — WalletConnect / some mobile wallets will not work. Injected browsers wallets (e.g. MetaMask) may still connect.",
      );
    }
    if (missingRpcKey) {
      messages.push(
        "No Alchemy/Infura key set — using public RPCs which can rate-limit. Quotes and swaps may be slower or fail under load.",
      );
    }

    return {
      ready: !missingWalletConnect && !missingRpcKey,
      missingWalletConnect,
      missingRpcKey,
      messages,
    };
  }, []);
}
