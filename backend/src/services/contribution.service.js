import { Campaign, Contribution, Transaction, User } from "../models/index.js";
import { ApiError } from "../utils/apiResponse.js";
import { verifyTransactionEvent } from "../blockchain/blockchainService.js";
import { env } from "../config/env.js";

/**
 * Records a contribution ONLY after independently verifying, on-chain, that
 * the given transaction hash actually emitted ContributionReceived for this
 * campaign from our contract. The backend never trusts a client-asserted amount.
 */
export async function recordContribution(campaignId, walletAddress, txHash) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  const already = await Contribution.findOne({ txHash });
  if (already) {
    throw new ApiError(409, "This transaction has already been recorded");
  }

  const verified = await verifyTransactionEvent(
    txHash,
    "ContributionReceived",
    env.INDEXER_CONFIRMATIONS
  );

  const eventCampaignId = Number(verified.args.campaignId);
  if (eventCampaignId !== campaign.contractCampaignId) {
    throw new ApiError(400, "Transaction does not correspond to this campaign");
  }

  const contributorAddress = String(verified.args.contributor).toLowerCase();
  if (contributorAddress !== walletAddress.toLowerCase()) {
    throw new ApiError(400, "Transaction sender does not match authenticated wallet");
  }

  const amount = verified.args.amount;

  const user = await User.findOneAndUpdate(
    { walletAddress: contributorAddress },
    { $setOnInsert: { walletAddress: contributorAddress } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const session = await Campaign.startSession();
  let contribution;
  try {
    await session.withTransaction(async () => {
      [contribution] = await Contribution.create(
        [
          {
            campaignId,
            userId: user._id,
            amount: amount.toString(),
            txHash,
            blockNumber: verified.blockNumber,
            confirmed: true,
          },
        ],
        { session }
      );
      await Campaign.updateOne(
        { _id: campaignId },
        { $inc: { totalRaised: amount.toString() } },
        { session }
      );
      await Transaction.create(
        [
          {
            campaignId,
            type: "CONTRIBUTION",
            txHash,
            blockNumber: verified.blockNumber,
            logIndex: verified.logIndex,
            timestamp: new Date(verified.timestamp * 1000),
            payload: { amount: amount.toString(), contributor: contributorAddress },
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return contribution;
}

export async function listContributors(campaignId) {
  return Contribution.find({ campaignId, confirmed: true })
    .populate("userId")
    .sort({ createdAt: 1 })
    .lean();
}

export async function listUserContributions(walletAddress) {
  const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() }).lean();
  if (!user) return [];

  return Contribution.find({ userId: user._id, confirmed: true })
    .populate("campaignId")
    .sort({ createdAt: -1 })
    .lean();
}
