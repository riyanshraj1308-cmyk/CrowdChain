import { computeReputationScore } from "../../src/services/reputation.service.js";

describe("Reputation scoring", () => {
  it("returns zero score for a creator with no history", () => {
    const { score, milestoneCompletionPct } = computeReputationScore({
      totalCampaigns: 0,
      successfulCampaigns: 0,
      totalMilestones: 0,
      releasedMilestones: 0,
      rejectedMilestones: 0,
      totalContributors: 0,
    });
    expect(score).toBe(0);
    expect(milestoneCompletionPct).toBe(0);
  });

  it("rewards successful campaigns and completion rate", () => {
    const result = computeReputationScore({
      totalCampaigns: 2,
      successfulCampaigns: 2,
      totalMilestones: 4,
      releasedMilestones: 4,
      rejectedMilestones: 0,
      totalContributors: 10,
    });
    expect(result.milestoneCompletionPct).toBe(100);
    expect(result.score).toBeGreaterThan(20);
  });

  it("penalizes rejected milestones and never goes negative", () => {
    const result = computeReputationScore({
      totalCampaigns: 1,
      successfulCampaigns: 0,
      totalMilestones: 2,
      releasedMilestones: 0,
      rejectedMilestones: 10,
      totalContributors: 0,
    });
    expect(result.score).toBe(0);
  });
});
