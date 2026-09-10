import { Campaign, Milestone, Transaction, User, Vote } from "../models/index.js";
import { ApiError } from "../utils/apiResponse.js";
import { verifyTransactionEvent } from "../blockchain/blockchainService.js";
import { env } from "../config/env.js";
import { recalculateReputation } from "./reputation.service.js";

async function getMilestoneOrThrow(campaignId, contractMilestoneId) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new ApiError(404, "Campaign not found");

  const milestone = await Milestone.findOne({ campaignId, contractMilestoneId });
  if (!milestone) throw new ApiError(404, "Milestone not found");

  return { campaign, milestone };
}

export async function listMilestones(campaignId) {
  return Milestone.find({ campaignId }).sort({ contractMilestoneId: 1 }).lean();
}

export async function getMilestone(campaignId, contractMilestoneId) {
  const { milestone } = await getMilestoneOrThrow(campaignId, contractMilestoneId);
  return milestone;
}

/**
 * The backend records the *fact* that a milestone was submitted only once the
 * MilestoneSubmitted event is confirmed on-chain. The smart contract remains
 * the final authority on whether the submission was actually valid (ordering,
 * creator-only, funding goal reached, etc.) - we merely mirror its outcome.
 */
export async function submitMilestone(
  campaignId,
  contractMilestoneId,
  description,
  proofUrl,
  txHash
) {
  const { campaign, milestone } = await getMilestoneOrThrow(campaignId, contractMilestoneId);

  const verified = await verifyTransactionEvent(
    txHash,
    "MilestoneSubmitted",
    env.INDEXER_CONFIRMATIONS
  );

  if (Number(verified.args.campaignId) !== campaign.contractCampaignId) {
    throw new ApiError(400, "Transaction does not correspond to this campaign");
  }
  if (Number(verified.args.milestoneId) !== contractMilestoneId) {
    throw new ApiError(400, "Transaction does not correspond to this milestone");
  }

  const votingDeadline = new Date(Number(verified.args.votingDeadline) * 1000);

  const session = await Campaign.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      updated = await Milestone.findOneAndUpdate(
        { _id: milestone.id },
        {
          $set: {
            status: "SUBMITTED",
            description,
            proofUrl: proofUrl ?? null,
            submittedAt: new Date(verified.timestamp * 1000),
            votingDeadline,
          },
        },
        { new: true, session }
      );
      await Transaction.create(
        [
          {
            campaignId,
            type: "MILESTONE_SUBMITTED",
            txHash,
            blockNumber: verified.blockNumber,
            logIndex: verified.logIndex,
            timestamp: new Date(verified.timestamp * 1000),
            payload: { milestoneId: contractMilestoneId, proofUri: String(verified.args.proofURI ?? "") },
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return updated;
}

export async function voteOnMilestone(
  campaignId,
  contractMilestoneId,
  walletAddress,
  support,
  txHash
) {
  const { campaign, milestone } = await getMilestoneOrThrow(campaignId, contractMilestoneId);

  const verified = await verifyTransactionEvent(txHash, "VoteCast", env.INDEXER_CONFIRMATIONS);

  if (Number(verified.args.campaignId) !== campaign.contractCampaignId) {
    throw new ApiError(400, "Transaction does not correspond to this campaign");
  }
  if (Number(verified.args.milestoneId) !== contractMilestoneId) {
    throw new ApiError(400, "Transaction does not correspond to this milestone");
  }
  if (String(verified.args.voter).toLowerCase() !== walletAddress.toLowerCase()) {
    throw new ApiError(400, "Transaction sender does not match authenticated wallet");
  }

  const weight = verified.args.weight;
  const voteSupport = verified.args.support;

  const user = await User.findOneAndUpdate(
    { walletAddress: walletAddress.toLowerCase() },
    { $setOnInsert: { walletAddress: walletAddress.toLowerCase() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const existingVote = await Vote.findOne({ milestoneId: milestone.id, userId: user._id });
  if (existingVote) {
    throw new ApiError(409, "Vote already recorded for this wallet");
  }

  const session = await Campaign.startSession();
  let vote;
  try {
    await session.withTransaction(async () => {
      [vote] = await Vote.create(
        [
          {
            milestoneId: milestone.id,
            userId: user._id,
            support: voteSupport,
            weight: weight.toString(),
            txHash,
          },
        ],
        { session }
      );
      await Milestone.updateOne(
        { _id: milestone.id },
        voteSupport
          ? { $inc: { votesFor: weight.toString() } }
          : { $inc: { votesAgainst: weight.toString() } },
        { session }
      );
      await Transaction.create(
        [
          {
            campaignId,
            type: "VOTE_CAST",
            txHash,
            blockNumber: verified.blockNumber,
            logIndex: verified.logIndex,
            timestamp: new Date(verified.timestamp * 1000),
            payload: { milestoneId: contractMilestoneId, support: voteSupport, weight: weight.toString() },
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return vote;
}

/**
 * Confirms an on-chain FundsReleased event and mirrors it: marks the milestone
 * released, bumps totalReleased, and marks the campaign completed if this was
 * the final milestone. Reputation is recalculated as a side effect.
 */
export async function releaseMilestone(campaignId, contractMilestoneId, txHash) {
  const { campaign, milestone } = await getMilestoneOrThrow(campaignId, contractMilestoneId);

  if (milestone.status === "RELEASED") {
    throw new ApiError(409, "Milestone already marked as released");
  }

  const verified = await verifyTransactionEvent(txHash, "FundsReleased", env.INDEXER_CONFIRMATIONS);

  if (Number(verified.args.campaignId) !== campaign.contractCampaignId) {
    throw new ApiError(400, "Transaction does not correspond to this campaign");
  }
  if (Number(verified.args.milestoneId) !== contractMilestoneId) {
    throw new ApiError(400, "Transaction does not correspond to this milestone");
  }

  const amount = verified.args.amount;

  const totalMilestones = await Milestone.countDocuments({ campaignId });
  const lastMilestone = contractMilestoneId === totalMilestones - 1;

  const session = await Campaign.startSession();
  try {
    await session.withTransaction(async () => {
      await Milestone.updateOne(
        { _id: milestone.id },
        {
          $set: {
            status: "RELEASED",
            releasedAt: new Date(verified.timestamp * 1000),
            releaseTxHash: txHash,
          },
        },
        { session }
      );
      await Campaign.updateOne(
        { _id: campaignId },
        {
          $inc: { totalReleased: amount.toString() },
          ...(lastMilestone ? { $set: { status: "COMPLETED" } } : {}),
        },
        { session }
      );
      await Transaction.create(
        [
          {
            campaignId,
            type: lastMilestone ? "CAMPAIGN_COMPLETED" : "FUNDS_RELEASED",
            txHash,
            blockNumber: verified.blockNumber,
            logIndex: verified.logIndex,
            timestamp: new Date(verified.timestamp * 1000),
            payload: { milestoneId: contractMilestoneId, amount: amount.toString() },
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  if (lastMilestone) {
    await recalculateReputation(campaign.creatorId);
  }

  return Milestone.findById(milestone.id);
}
