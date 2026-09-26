"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import type { TokenInfo } from "@/config/tokens";
import { ERC20_ABI } from "@/lib/uniswap/abi";

export function useTokenBalance(token: TokenInfo | undefined) {
  const { address, chainId } = useAccount();
  const enabled =
    Boolean(address) &&
    Boolean(token) &&
    token?.chainId === chainId;

  const native = useBalance({
    address,
    query: { enabled: Boolean(enabled && token?.isNative) },
  });

  const erc20 = useReadContract({
    address: token && !token.isNative ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(enabled && token && !token.isNative) },
  });

  if (!token) {
    return { balance: undefined as bigint | undefined, isLoading: false, refetch: async () => {} };
  }

  if (token.isNative) {
    return {
      balance: native.data?.value,
      isLoading: native.isLoading,
      refetch: native.refetch,
    };
  }

  return {
    balance: erc20.data as bigint | undefined,
    isLoading: erc20.isLoading,
    refetch: erc20.refetch,
  };
}
