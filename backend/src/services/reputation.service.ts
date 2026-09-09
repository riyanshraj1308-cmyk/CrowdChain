import { prisma } from "../config/database.js";

/**
 * Reputation is derived purely from indexed on-chain outcomes (campaigns
 * completed, milestones approved vs. rejected, contributor participation).
 * There is no API surface that lets a creator set or increment their own
 * score - it is always recomputed server-side from underlying facts.
 */

interface ReputationInputs {
  totalCampaigns: number;
  successfulCampaigns: number;
  totalMilestones: number;
  releasedMilestones: number;
  rejectedMilestones: number;
  totalContributors: number;
}

/** Pure function so the formula can be unit-tested and swapped out independently. */
export function computeReputationScore(inputs: ReputationInputs): {
  score: number;
  milestoneCompletionPct: number;
} {
  const milestoneCompletionPct =
    inputs.totalMilestones === 0 ? 0 : (inputs.releasedMilestones / inputs.totalMilestones) * 100;

  const campaignSuccessComponent = inputs.successfulCampaigns * 10;
  const completionComponent = milestoneCompletionPct * 0.5;
  const participationComponent = Math.min(inputs.totalContributors, 100) * 0.2;
  const disputePenalty = inputs.rejectedMilestones * 5;

  const rawScore =
    campaignSuccessComponent + completionComponent + participationComponent - disputePenalty;

  return {
    score: Math.max(0, Math.round(rawScore * 100) / 100),
    milestoneCompletionPct: Math.round(milestoneCompletionPct * 100) / 100,
  };
}

export async function recalculateReputation(userId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { creatorId: userId },
    include: { milestones: true, contributions: { where: { confirmed: true } } },
  });

  const totalCampaigns = campaigns.length;
  const successfulCampaigns = campaigns.filter((c) => c.status === "COMPLETED").length;

  const totalMilestones = campaigns.reduce((sum, c) => sum + c.milestones.length, 0);
  const releasedMilestones = campaigns.reduce(
    (sum, c) => sum + c.milestones.filter((m) => m.status === "RELEASED").length,
    0
  );
  const rejectedMilestones = campaigns.reduce(
    (sum, c) => sum + c.milestones.filter((m) => m.status === "REJECTED").length,
    0
  );

  const uniqueContributors = new Set(
    campaigns.flatMap((c) => c.contributions.map((contribution) => contribution.userId))
  );

  const { score, milestoneCompletionPct } = computeReputationScore({
    totalCampaigns,
    successfulCampaigns,
    totalMilestones,
    releasedMilestones,
    rejectedMilestones,
    totalContributors: uniqueContributors.size,
  });

  return prisma.reputation.upsert({
    where: { userId },
    update: {
      totalCampaigns,
      successfulCampaigns,
      milestoneCompletionPct,
      totalContributors: uniqueContributors.size,
      rejectedMilestones,
      score,
    },
    create: {
      userId,
      totalCampaigns,
      successfulCampaigns,
      milestoneCompletionPct,
      totalContributors: uniqueContributors.size,
      rejectedMilestones,
      score,
    },
  });
}

export async function getReputation(userId: string) {
  return prisma.reputation.findUnique({ where: { userId } });
}
