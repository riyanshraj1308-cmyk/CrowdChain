import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/models/index.js", () => ({
  Campaign: {
    findById: jest.fn(),
    updateOne: jest.fn(),
    startSession: jest.fn(),
  },
  Contribution: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  },
  User: {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/blockchain/blockchainService.js", () => ({
  verifyTransactionEvent: jest.fn(),
}));

const { Campaign, Contribution, User, Transaction } = await import("../../src/models/index.js");
const { verifyTransactionEvent } = await import("../../src/blockchain/blockchainService.js");
const { recordContribution } = await import("../../src/services/contribution.service.js");
const { ApiError } = await import("../../src/utils/apiResponse.js");

// Fake Mongoose session: withTransaction just runs the callback.
function fakeSession() {
  return {
    withTransaction: async (fn) => fn(),
    endSession: jest.fn(),
  };
}

function mockCampaign(campaign) {
  Campaign.findById.mockResolvedValue(campaign);
  Campaign.startSession.mockResolvedValue(fakeSession());
}

describe("Contribution service - on-chain verification", () => {
  afterEach(() => jest.clearAllMocks());

  it("rejects recording a contribution when the campaign does not exist", async () => {
    Campaign.findById.mockResolvedValue(null);
    await expect(
      recordContribution("campaign-1", "0xabc", `0x${"1".repeat(64)}`)
    ).rejects.toThrow(ApiError);
  });

  it("rejects a tx hash that has already been recorded", async () => {
    mockCampaign({ id: "c1", contractCampaignId: 0 });
    Contribution.findOne.mockResolvedValue({ id: "existing" });

    await expect(
      recordContribution("c1", "0xabc", `0x${"1".repeat(64)}`)
    ).rejects.toThrow("already been recorded");
  });

  it("rejects when the on-chain event's campaign id does not match", async () => {
    mockCampaign({ id: "c1", contractCampaignId: 5 });
    Contribution.findOne.mockResolvedValue(null);
    verifyTransactionEvent.mockResolvedValue({
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
    mockCampaign({ id: "c1", contractCampaignId: 0 });
    Contribution.findOne.mockResolvedValue(null);
    verifyTransactionEvent.mockResolvedValue({
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
    mockCampaign({ id: "c1", contractCampaignId: 0 });
    Contribution.findOne.mockResolvedValue(null);
    verifyTransactionEvent.mockResolvedValue({
      args: { campaignId: 0, contributor: "0xabc", amount: BigInt(1000) },
      blockNumber: 10,
      timestamp: 1000,
      logIndex: 0,
    });
    User.findOneAndUpdate.mockResolvedValue({ id: "user-1" });
    Contribution.create.mockResolvedValue([{ id: "contribution-1" }]);

    const result = await recordContribution("c1", "0xabc", `0x${"1".repeat(64)}`);
    expect(result).toEqual({ id: "contribution-1" });
    expect(Contribution.create).toHaveBeenCalled();
    expect(Transaction.create).toHaveBeenCalled();
    expect(Campaign.updateOne).toHaveBeenCalled();
  });
});
