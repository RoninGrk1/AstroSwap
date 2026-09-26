/**
 * Real Railgun shield (public → private). Submits via the user's connected wallet.
 */

import {
  EVMGasType,
  NETWORK_CONFIG,
  NetworkName,
  TXIDVersion,
  type RailgunERC20AmountRecipient,
  type TransactionGasDetails,
} from "@railgun-community/shared-models";
import type { Address, Hex } from "viem";
import { ensureRailgunEngine } from "./engine";
import { chainIdToNetworkName } from "./chains";

export type PopulatedShieldTx = {
  to: Address;
  data: Hex;
  value: bigint;
  /** Railgun proxy that must be approved for ERC-20 shields */
  proxyContract: Address;
  networkName: NetworkName;
};

const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export { ERC20_APPROVE_ABI };

export async function populateErc20Shield(args: {
  chainId: number;
  railgunAddress: string;
  fromAddress: Address;
  tokenAddress: Address;
  amount: bigint;
  shieldPrivateKey: string;
}): Promise<PopulatedShieldTx> {
  await ensureRailgunEngine();
  const networkName = chainIdToNetworkName(args.chainId);
  if (!networkName) {
    throw new Error("Railgun shield is only available on Ethereum mainnet");
  }
  if (args.amount <= BigInt(0)) {
    throw new Error("Shield amount must be greater than zero");
  }

  const wallet = await import("@railgun-community/wallet");
  const recipients: RailgunERC20AmountRecipient[] = [
    {
      tokenAddress: args.tokenAddress,
      amount: args.amount,
      recipientAddress: args.railgunAddress,
    },
  ];

  const { gasEstimate } = await wallet.gasEstimateForShield(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.shieldPrivateKey,
    recipients,
    [],
    args.fromAddress,
  );

  const gasDetails: TransactionGasDetails = {
    evmGasType: EVMGasType.Type2,
    gasEstimate,
    maxFeePerGas: BigInt(50_000_000_000),
    maxPriorityFeePerGas: BigInt(1_500_000_000),
  };

  const { transaction } = await wallet.populateShield(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.shieldPrivateKey,
    recipients,
    [],
    gasDetails,
  );

  if (!transaction.to || !transaction.data) {
    throw new Error("Railgun populateShield returned an incomplete transaction");
  }

  return {
    to: transaction.to as Address,
    data: transaction.data as Hex,
    value: BigInt(transaction.value ?? 0),
    proxyContract: NETWORK_CONFIG[networkName].proxyContract as Address,
    networkName,
  };
}

export async function populateNativeEthShield(args: {
  chainId: number;
  railgunAddress: string;
  fromAddress: Address;
  amount: bigint;
  shieldPrivateKey: string;
}): Promise<PopulatedShieldTx> {
  await ensureRailgunEngine();
  const networkName = chainIdToNetworkName(args.chainId);
  if (!networkName) {
    throw new Error("Railgun shield is only available on Ethereum mainnet");
  }
  if (args.amount <= BigInt(0)) {
    throw new Error("Shield amount must be greater than zero");
  }

  const wallet = await import("@railgun-community/wallet");
  const wrapped = NETWORK_CONFIG[networkName].baseToken.wrappedAddress;
  const wrappedAmount = {
    tokenAddress: wrapped,
    amount: args.amount,
  };

  const { gasEstimate } = await wallet.gasEstimateForShieldBaseToken(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.railgunAddress,
    args.shieldPrivateKey,
    wrappedAmount,
    args.fromAddress,
  );

  const gasDetails: TransactionGasDetails = {
    evmGasType: EVMGasType.Type2,
    gasEstimate,
    maxFeePerGas: BigInt(50_000_000_000),
    maxPriorityFeePerGas: BigInt(1_500_000_000),
  };

  const { transaction } = await wallet.populateShieldBaseToken(
    TXIDVersion.V2_PoseidonMerkle,
    networkName,
    args.railgunAddress,
    args.shieldPrivateKey,
    wrappedAmount,
    gasDetails,
  );

  if (!transaction.to || !transaction.data) {
    throw new Error(
      "Railgun populateShieldBaseToken returned an incomplete transaction",
    );
  }

  return {
    to: transaction.to as Address,
    data: transaction.data as Hex,
    value: BigInt(transaction.value ?? args.amount),
    proxyContract: NETWORK_CONFIG[networkName].proxyContract as Address,
    networkName,
  };
}

export async function getShieldSignatureMessage(): Promise<string> {
  const wallet = await import("@railgun-community/wallet");
  return wallet.getShieldPrivateKeySignatureMessage();
}
