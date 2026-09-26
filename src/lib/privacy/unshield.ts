/**
 * Unshield interfaces — real proofs required.
 *
 * Generating unshield proofs needs the Groth16 prover + downloaded artifacts
 * and a synced spendable balance. Throws clearly if those are unavailable.
 */

import {
  EVMGasType,
  NetworkName,
  TXIDVersion,
  type RailgunERC20AmountRecipient,
  type TransactionGasDetails,
} from "@railgun-community/shared-models";
import type { Address, Hex } from "viem";
import { ensureRailgunEngine } from "./engine";
import { chainIdToNetworkName } from "./chains";

export type PopulatedUnshieldTx = {
  to: Address;
  data: Hex;
  value: bigint;
};

export type UnshieldProgress = {
  progress: number;
  status: string;
};

export async function populateUnshieldToAddress(args: {
  chainId: number;
  railgunWalletId: string;
  encryptionKey: string;
  tokenAddress: Address;
  amount: bigint;
  recipientAddress: Address;
  onProgress?: (p: UnshieldProgress) => void;
}): Promise<PopulatedUnshieldTx> {
  await ensureRailgunEngine();
  const networkName = chainIdToNetworkName(args.chainId);
  if (!networkName || networkName !== NetworkName.Ethereum) {
    throw new Error("Unshield is only available on Ethereum mainnet");
  }
  if (args.amount <= BigInt(0)) {
    throw new Error("Unshield amount must be greater than zero");
  }

  const wallet = await import("@railgun-community/wallet");
  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: args.tokenAddress,
      amount: args.amount,
      recipientAddress: args.recipientAddress,
    },
  ];

  const originalGasDetails: TransactionGasDetails = {
    evmGasType: EVMGasType.Type2,
    gasEstimate: BigInt(3_000_000),
    maxFeePerGas: BigInt(50_000_000_000),
    maxPriorityFeePerGas: BigInt(1_500_000_000),
  };

  const { gasEstimate } = await wallet.gasEstimateForUnprovenUnshield(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.railgunWalletId,
    args.encryptionKey,
    erc20AmountRecipients,
    [],
    originalGasDetails,
    undefined,
    true,
  );

  await wallet.generateUnshieldProof(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.railgunWalletId,
    args.encryptionKey,
    erc20AmountRecipients,
    [],
    undefined,
    true,
    undefined,
    (progress, status) => {
      args.onProgress?.({ progress, status });
    },
  );

  const gasDetails: TransactionGasDetails = {
    evmGasType: EVMGasType.Type2,
    gasEstimate,
    maxFeePerGas: BigInt(50_000_000_000),
    maxPriorityFeePerGas: BigInt(1_500_000_000),
  };

  const { transaction } = await wallet.populateProvedUnshield(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.railgunWalletId,
    erc20AmountRecipients,
    [],
    undefined,
    true,
    undefined,
    gasDetails,
  );

  if (!transaction.to || !transaction.data) {
    throw new Error("Unshield populate returned an incomplete transaction");
  }

  return {
    to: transaction.to as Address,
    data: transaction.data as Hex,
    value: BigInt(transaction.value ?? 0),
  };
}

export function unshieldFeatureEnabled(): boolean {
  return true;
}
