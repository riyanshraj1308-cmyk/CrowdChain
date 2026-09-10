import { Campaign, Contribution, Milestone, Reputation } from "../models/index.js";

/**
 * Reputation is derived purely from indexed on-chain outcomes (campaigns
 * completed, milestones approved vs. rejected, contributor participation).
 * There is no API surface that lets a creator set or increment their own
 * score - it is always recomputed server-side from underlying facts.
 */

/** Pure function so the formula can be unit-tested and swapped out independently. */
export function computeReputationScore(inputs) {
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

export async function recalculateReputation(userId) {
  const campaigns = await Campaign.find({ creatorId: userId }).lean();

  const campaignIds = campaigns.map((c) => c._id);
  const [allMilestones, confirmedContributions] = await Promise.all([
    Milestone.find({ campaignId: { $in: campaignIds } }).lean(),
    Contribution.find({ campaignId: { $in: campaignIds }, confirmed: true })
      .select("userId")
      .lean(),
  ]);

  const totalCampaigns = campaigns.length;
  const successfulCampaigns = campaigns.filter((c) => c.status === "COMPLETED").length;

  const totalMilestones = allMilestones.length;
  const releasedMilestones = allMilestones.filter((m) => m.status === "RELEASED").length;
  const rejectedMilestones = allMilestones.filter((m) => m.status === "REJECTED").length;

  const uniqueContributors = new Set(confirmedContributions.map((contribution) => contribution.userId));

  const { score, milestoneCompletionPct } = computeReputationScore({
    totalCampaigns,
    successfulCampaigns,
    totalMilestones,
    releasedMilestones,
    rejectedMilestones,
    totalContributors: uniqueContributors.size,
  });

  const updates = {
    totalCampaigns,
    successfulCampaigns,
    milestoneCompletionPct,
    totalContributors: uniqueContributors.size,
    rejectedMilestones,
    score,
  };

  return Reputation.findOneAndUpdate({ userId }, { $set: updates }, { new: true, upsert: true });
}

export async function getReputation(userId) {
  return Reputation.findOne({ userId }).lean();
}
