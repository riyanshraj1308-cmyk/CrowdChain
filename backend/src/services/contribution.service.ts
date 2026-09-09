import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiResponse.js";
import { verifyTransactionEvent } from "../blockchain/blockchainService.js";
import { env } from "../config/env.js";

/**
 * Records a contribution ONLY after independently verifying, on-chain, that
 * the given transaction hash actually emitted ContributionReceived for this
 * campaign from our contract. The backend never trusts a client-asserted amount.
 */
export async function recordContribution(campaignId: string, walletAddress: string, txHash: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  const already = await prisma.contribution.findUnique({ where: { txHash } });
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

  const amount = verified.args.amount as bigint;

  const user = await prisma.user.upsert({
    where: { walletAddress: contributorAddress },
    update: {},
    create: { walletAddress: contributorAddress },
  });

  const [contribution] = await prisma.$transaction([
    prisma.contribution.create({
      data: {
        campaignId,
        userId: user.id,
        amount: amount.toString(),
        txHash,
        blockNumber: verified.blockNumber,
        confirmed: true,
      },
    }),
    prisma.campaign.update({
      where: { id: campaignId },
      data: { totalRaised: { increment: amount.toString() } },
    }),
    prisma.transaction.create({
      data: {
        campaignId,
        type: "CONTRIBUTION",
        txHash,
        blockNumber: verified.blockNumber,
        logIndex: verified.logIndex,
        timestamp: new Date(verified.timestamp * 1000),
        payload: { amount: amount.toString(), contributor: contributorAddress },
      },
    }),
  ]);

  return contribution;
}

export async function listContributors(campaignId: string) {
  return prisma.contribution.findMany({
    where: { campaignId, confirmed: true },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listUserContributions(walletAddress: string) {
  return prisma.contribution.findMany({
    where: { user: { walletAddress: walletAddress.toLowerCase() }, confirmed: true },
    include: { campaign: true },
    orderBy: { createdAt: "desc" },
  });
}
