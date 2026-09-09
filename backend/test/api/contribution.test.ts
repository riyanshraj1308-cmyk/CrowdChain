import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  prisma: {
    campaign: { findUnique: jest.fn(), update: jest.fn() },
    contribution: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
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
const { recordContribution } = await import("../../src/services/contribution.service.js");
const { ApiError } = await import("../../src/utils/apiResponse.js");

describe("Contribution service - on-chain verification", () => {
  afterEach(() => jest.clearAllMocks());

  it("rejects recording a contribution when the campaign does not exist", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    await expect(
      recordContribution("campaign-1", "0xabc", `0x${"1".repeat(64)}`)
    ).rejects.toThrow(ApiError);
  });

  it("rejects a tx hash that has already been recorded", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "c1", contractCampaignId: 0 });
    (prisma.contribution.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "existing" });

    await expect(
      recordContribution("c1", "0xabc", `0x${"1".repeat(64)}`)
    ).rejects.toThrow("already been recorded");
  });

  it("rejects when the on-chain event's campaign id does not match", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "c1", contractCampaignId: 5 });
    (prisma.contribution.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    (verifyTransactionEvent as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      args: { campaignId: 0, contributor: "0xabc", amount: BigInt(100) },
      blockNumber: 10,
      timestamp: 1000,
      logIndex: 0,
    });

    await expect(
      recordContribution("c1", "0xabc", `0x${"1".repeat(64)}`)
    ).rejects.toThrow("does not correspond to this campaign");
  });

  it("rejects when the tx sender does not match the authenticated wallet", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "c1", contractCampaignId: 0 });
    (prisma.contribution.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    (verifyTransactionEvent as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      args: { campaignId: 0, contributor: "0xdifferent", amount: BigInt(100) },
      blockNumber: 10,
      timestamp: 1000,
      logIndex: 0,
    });

    await expect(
      recordContribution("c1", "0xabc", `0x${"1".repeat(64)}`)
    ).rejects.toThrow("does not match authenticated wallet");
  });

  it("records the contribution once verified successfully", async () => {
    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "c1", contractCampaignId: 0 });
    (prisma.contribution.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    (verifyTransactionEvent as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      args: { campaignId: 0, contributor: "0xabc", amount: BigInt(1000) },
      blockNumber: 10,
      timestamp: 1000,
      logIndex: 0,
    });
    (prisma.user.upsert as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "user-1" });
    (prisma.$transaction as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([{ id: "contribution-1" }]);

    const result = await recordContribution("c1", "0xabc", `0x${"1".repeat(64)}`);
    expect(result).toEqual({ id: "contribution-1" });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
