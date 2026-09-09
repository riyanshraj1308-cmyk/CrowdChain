import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiResponse.js";
import { verifyTransactionEvent } from "../blockchain/blockchainService.js";
import { env } from "../config/env.js";
import { recalculateReputation } from "./reputation.service.js";

async function getMilestoneOrThrow(campaignId: string, contractMilestoneId: number) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new ApiError(404, "Campaign not found");

  const milestone = await prisma.milestone.findUnique({
    where: { campaignId_contractMilestoneId: { campaignId, contractMilestoneId } },
  });
  if (!milestone) throw new ApiError(404, "Milestone not found");

  return { campaign, milestone };
}

export async function listMilestones(campaignId: string) {
  return prisma.milestone.findMany({
    where: { campaignId },
    orderBy: { contractMilestoneId: "asc" },
  });
}

export async function getMilestone(campaignId: string, contractMilestoneId: number) {
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
  campaignId: string,
  contractMilestoneId: number,
  description: string,
  proofUrl: string | undefined,
  txHash: string
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

  const [updated] = await prisma.$transaction([
    prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        status: "SUBMITTED",
        description,
        proofUrl,
        submittedAt: new Date(verified.timestamp * 1000),
        votingDeadline,
      },
    }),
    prisma.transaction.create({
      data: {
        campaignId,
        type: "MILESTONE_SUBMITTED",
        txHash,
        blockNumber: verified.blockNumber,
        logIndex: verified.logIndex,
        timestamp: new Date(verified.timestamp * 1000),
        payload: { milestoneId: contractMilestoneId, proofUri: String(verified.args.proofURI ?? "") },
      },
    }),
  ]);

  return updated;
}

export async function voteOnMilestone(
  campaignId: string,
  contractMilestoneId: number,
  walletAddress: string,
  support: boolean,
  txHash: string
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

  const weight = verified.args.weight as bigint;
  const voteSupport = verified.args.support as boolean;

  const user = await prisma.user.upsert({
    where: { walletAddress: walletAddress.toLowerCase() },
    update: {},
    create: { walletAddress: walletAddress.toLowerCase() },
  });

  const existingVote = await prisma.vote.findUnique({
    where: { milestoneId_userId: { milestoneId: milestone.id, userId: user.id } },
  });
  if (existingVote) {
    throw new ApiError(409, "Vote already recorded for this wallet");
  }

  const [vote] = await prisma.$transaction([
    prisma.vote.create({
      data: {
        milestoneId: milestone.id,
        userId: user.id,
        support: voteSupport,
        weight: weight.toString(),
        txHash,
      },
    }),
    prisma.milestone.update({
      where: { id: milestone.id },
      data: voteSupport
        ? { votesFor: { increment: weight.toString() } }
        : { votesAgainst: { increment: weight.toString() } },
    }),
    prisma.transaction.create({
      data: {
        campaignId,
        type: "VOTE_CAST",
        txHash,
        blockNumber: verified.blockNumber,
        logIndex: verified.logIndex,
        timestamp: new Date(verified.timestamp * 1000),
        payload: { milestoneId: contractMilestoneId, support: voteSupport, weight: weight.toString() },
      },
    }),
  ]);

  return vote;
}

/**
 * Confirms an on-chain FundsReleased event and mirrors it: marks the milestone
 * released, bumps totalReleased, and marks the campaign completed if this was
 * the final milestone. Reputation is recalculated as a side effect.
 */
export async function releaseMilestone(campaignId: string, contractMilestoneId: number, txHash: string) {
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

  const amount = verified.args.amount as bigint;

  const totalMilestones = await prisma.milestone.count({ where: { campaignId } });
  const lastMilestone = contractMilestoneId === totalMilestones - 1;

  await prisma.$transaction([
    prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(verified.timestamp * 1000),
        releaseTxHash: txHash,
      },
    }),
    prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalReleased: { increment: amount.toString() },
        ...(lastMilestone ? { status: "COMPLETED" } : {}),
      },
    }),
    prisma.transaction.create({
      data: {
        campaignId,
        type: lastMilestone ? "CAMPAIGN_COMPLETED" : "FUNDS_RELEASED",
        txHash,
        blockNumber: verified.blockNumber,
        logIndex: verified.logIndex,
        timestamp: new Date(verified.timestamp * 1000),
        payload: { milestoneId: contractMilestoneId, amount: amount.toString() },
      },
    }),
  ]);

  if (lastMilestone) {
    await recalculateReputation(campaign.creatorId);
  }

  return prisma.milestone.findUnique({ where: { id: milestone.id } });
}
