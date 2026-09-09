import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  prisma: {
    campaign: { findUnique: jest.fn() },
    milestone: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    vote: { findUnique: jest.fn(), create: jest.fn() },
    user: { upsert: jest.fn() },
    transaction: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/blockchain/blockchainService.js", () => ({
  verifyTransactionEvent: jest.fn(),
}));

const { prisma } = await import("../../src/config/database.js");
const { verifyTransactionEvent } = await import("../../src/blockchain/blockchainService.js");
const { voteOnMilestone } = await import("../../src/services/milestone.service.js");

describe("Milestone service - vote verification", () => {
  afterEach(() => jest.clearAllMocks());

  const campaign = { id: "c1", contractCampaignId: 0, creatorId: "creator-1" };
  const milestone = { id: "m1", campaignId: "c1", contractMilestoneId: 0 };

  it("rejects double voting for the same wallet", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(campaign);
    (prisma.milestone.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(milestone);
    (verifyTransactionEvent as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      args: { campaignId: 0, milestoneId: 0, voter: "0xabc", weight: BigInt(500), support: true },
      blockNumber: 1,
      timestamp: 1,
      logIndex: 0,
    });
    (prisma.user.upsert as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "user-1" });
    (prisma.vote.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "already-voted" });

    await expect(voteOnMilestone("c1", 0, "0xabc", true, `0x${"1".repeat(64)}`)).rejects.toThrow(
      "Vote already recorded"
    );
  });

  it("rejects a vote transaction whose sender does not match the caller", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(campaign);
    (prisma.milestone.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(milestone);
    (verifyTransactionEvent as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      args: { campaignId: 0, milestoneId: 0, voter: "0xother", weight: BigInt(500), support: true },
      blockNumber: 1,
      timestamp: 1,
      logIndex: 0,
    });

    await expect(voteOnMilestone("c1", 0, "0xabc", true, `0x${"1".repeat(64)}`)).rejects.toThrow(
      "does not match authenticated wallet"
    );
  });

  it("records a valid vote exactly once", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(campaign);
    (prisma.milestone.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(milestone);
    (verifyTransactionEvent as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      args: { campaignId: 0, milestoneId: 0, voter: "0xabc", weight: BigInt(500), support: true },
      blockNumber: 1,
      timestamp: 1,
      logIndex: 0,
    });
    (prisma.user.upsert as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "user-1" });
    (prisma.vote.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    (prisma.$transaction as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([{ id: "vote-1" }]);

    const result = await voteOnMilestone("c1", 0, "0xabc", true, `0x${"1".repeat(64)}`);
    expect(result).toEqual({ id: "vote-1" });
  });
});
