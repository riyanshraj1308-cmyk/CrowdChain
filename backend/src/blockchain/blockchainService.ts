import { ethers } from "ethers";
import { getProvider, getReadOnlyContract, getDeployment } from "./provider.js";
import { ApiError } from "../utils/apiResponse.js";

/**
 * The backend NEVER records financial state on trust alone. Every "confirmed"
 * write to the database that concerns money or milestone approval must be
 * backed by a verified, mined transaction that emitted the expected event
 * from OUR contract address.
 */

export interface VerifiedLog {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  logIndex: number;
  args: Record<string, unknown>;
}

export async function verifyTransactionEvent(
  txHash: string,
  eventName: string,
  minConfirmations = 1
): Promise<VerifiedLog> {
  const provider = getProvider();
  const contract = getReadOnlyContract();
  const { address: contractAddress } = getDeployment();

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw new ApiError(400, "Transaction not found or not yet mined");
  }
  if (receipt.status !== 1) {
    throw new ApiError(400, "Transaction reverted on-chain");
  }
  if (receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
    throw new ApiError(400, "Transaction was not sent to the crowdfunding contract");
  }

  const latestBlock = await provider.getBlockNumber();
  const confirmations = latestBlock - receipt.blockNumber + 1;
  if (confirmations < minConfirmations) {
    throw new ApiError(400, "Transaction does not yet have enough confirmations");
  }

  const matchingEntry = receipt.logs
    .map((log) => {
      try {
        return { rawLog: log, parsed: contract.interface.parseLog(log) };
      } catch {
        return null;
      }
    })
    .find((entry) => entry?.parsed?.name === eventName);

  if (!matchingEntry || !matchingEntry.parsed) {
    throw new ApiError(400, `Transaction did not emit expected event: ${eventName}`);
  }

  const block = await provider.getBlock(receipt.blockNumber);

  return {
    txHash,
    blockNumber: receipt.blockNumber,
    timestamp: block?.timestamp ?? Math.floor(Date.now() / 1000),
    logIndex: matchingEntry.rawLog.index ?? 0,
    args: matchingEntry.parsed.args.toObject ? matchingEntry.parsed.args.toObject() : {},
  };
}

export async function getOnChainCampaign(contractCampaignId: number) {
  const contract = getReadOnlyContract();
  return contract.getCampaign(contractCampaignId);
}

export async function getOnChainMilestone(contractCampaignId: number, milestoneId: number) {
  const contract = getReadOnlyContract();
  return contract.getMilestone(contractCampaignId, milestoneId);
}

export function verifySignature(message: string, signature: string, expectedAddress: string): boolean {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}
