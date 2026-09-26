"use client";

import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import type { TokenInfo } from "@/config/tokens";
import { UNISWAP_V3 } from "@/config/contracts";
import { ERC20_ABI } from "@/lib/uniswap/abi";

export function useTokenAllowance(token: TokenInfo | undefined) {
  const { address, chainId } = useAccount();
  const router =
    chainId && UNISWAP_V3[chainId] ? UNISWAP_V3[chainId].swapRouter02 : undefined;

  const enabled =
    Boolean(address) &&
    Boolean(token) &&
    !token?.isNative &&
    Boolean(router) &&
    token?.chainId === chainId;

  const { data, isLoading, refetch } = useReadContract({
    address: token && !token.isNative ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && router
        ? [address, router as Address]
        : undefined,
    query: { enabled },
  });

  return {
    allowance: (data as bigint | undefined) ?? BigInt(0),
    spender: router,
    isLoading,
    refetch,
  };
}
