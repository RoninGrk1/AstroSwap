import {
  type Address,
  type Hex,
  encodeFunctionData,
  maxUint256,
} from "viem";
import { UNISWAP_V3 } from "@/config/contracts";
import type { TokenInfo } from "@/config/tokens";
import { getSwapTokenAddress } from "@/config/tokens";
import { ERC20_ABI, SWAP_ROUTER_02_ABI } from "./abi";
import { applySlippage, type QuoteResult } from "./quoter";

export type SwapBuildParams = {
  chainId: number;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: bigint;
  quote: QuoteResult;
  slippageBps: number;
  recipient: Address;
  deadlineSeconds?: number;
};

export type BuiltSwap = {
  to: Address;
  data: Hex;
  value: bigint;
  amountOutMinimum: bigint;
  router: Address;
  needsApproval: boolean;
  approvalToken: Address | null;
  approvalSpender: Address;
};

export function buildExactInputSingle(params: SwapBuildParams): BuiltSwap {
  const {
    chainId,
    tokenIn,
    tokenOut,
    amountIn,
    quote,
    slippageBps,
    recipient,
  } = params;

  const contracts = UNISWAP_V3[chainId];
  if (!contracts) {
    throw new Error(`Uniswap V3 not configured for chain ${chainId}`);
  }

  const tokenInAddr = getSwapTokenAddress(tokenIn);
  const tokenOutAddr = getSwapTokenAddress(tokenOut);
  const amountOutMinimum = applySlippage(quote.amountOut, slippageBps);
  const isNativeIn = Boolean(tokenIn.isNative);
  const isNativeOut = Boolean(tokenOut.isNative);

  const swapParams = {
    tokenIn: tokenInAddr,
    tokenOut: tokenOutAddr,
    fee: quote.fee,
    recipient: isNativeOut ? contracts.swapRouter02 : recipient,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: BigInt(0),
  };

  const swapCalldata = encodeFunctionData({
    abi: SWAP_ROUTER_02_ABI,
    functionName: "exactInputSingle",
    args: [swapParams],
  });

  let data: Hex = swapCalldata;
  let value = isNativeIn ? amountIn : BigInt(0);

  // If outputting native ETH, unwrap WETH via multicall
  if (isNativeOut) {
    const unwrap = encodeFunctionData({
      abi: SWAP_ROUTER_02_ABI,
      functionName: "unwrapWETH9",
      args: [amountOutMinimum, recipient],
    });
    const deadline = BigInt(Math.floor(Date.now() / 1000) + (params.deadlineSeconds ?? 1200));
    data = encodeFunctionData({
      abi: SWAP_ROUTER_02_ABI,
      functionName: "multicall",
      args: [deadline, [swapCalldata, unwrap]],
    });
  } else if (isNativeIn) {
    // Refund excess ETH if any
    const refund = encodeFunctionData({
      abi: SWAP_ROUTER_02_ABI,
      functionName: "refundETH",
    });
    const deadline = BigInt(Math.floor(Date.now() / 1000) + (params.deadlineSeconds ?? 1200));
    data = encodeFunctionData({
      abi: SWAP_ROUTER_02_ABI,
      functionName: "multicall",
      args: [deadline, [swapCalldata, refund]],
    });
  }

  return {
    to: contracts.swapRouter02,
    data,
    value,
    amountOutMinimum,
    router: contracts.swapRouter02,
    needsApproval: !isNativeIn,
    approvalToken: isNativeIn ? null : tokenIn.address,
    approvalSpender: contracts.swapRouter02,
  };
}

export function buildApproveCalldata(spender: Address, amount: bigint = maxUint256): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, amount],
  });
}
