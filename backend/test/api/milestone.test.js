import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/models/index.js", () => ({
  Campaign: {
    findById: jest.fn(),
    updateOne: jest.fn(),
    startSession: jest.fn(),
  },
  Milestone: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
  },
  Vote: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findOneAndUpdate: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
  },
  Contribution: { findOne: jest.fn(), find: jest.fn() },
  Reputation: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
  IndexerState: { findByIdAndUpdate: jest.fn(), updateOne: jest.fn() },
}));

jest.unstable_mockModule("../../src/blockchain/blockchainService.js", () => ({
  verifyTransactionEvent: jest.fn(),
}));

const { Campaign, Milestone, Vote, User } = await import("../../src/models/index.js");
const { verifyTransactionEvent } = await import("../../src/blockchain/blockchainService.js");
const { voteOnMilestone } = await import("../../src/services/milestone.service.js");

// Fake Mongoose session: withTransaction just runs the callback.
function fakeSession() {
  return {
    withTransaction: async (fn) => fn(),
    endSession: jest.fn(),
  };
}

function mockCampaignAndMilestone() {
  Campaign.findById.mockResolvedValue({ id: "c1", contractCampaignId: 0, creatorId: "creator-1" });
  Milestone.findOne.mockResolvedValue({ id: "m1", campaignId: "c1", contractMilestoneId: 0 });
  Campaign.startSession.mockResolvedValue(fakeSession());
}

describe("Milestone service - vote verification", () => {
  afterEach(() => jest.clearAllMocks());

  it("rejects double voting for the same wallet", async () => {
    mockCampaignAndMilestone();
    verifyTransactionEvent.mockResolvedValue({
      args: { campaignId: 0, milestoneId: 0, voter: "0xabc", weight: BigInt(500), support: true },
      blockNumber: 1,
      timestamp: 1,
      logIndex: 0,
    });
    User.findOneAndUpdate.mockResolvedValue({ id: "user-1" });
    Vote.findOne.mockResolvedValue({ id: "already-voted" });

    await expect(voteOnMilestone("c1", 0, "0xabc", true, `0x${"1".repeat(64)}`)).rejects.toThrow(
      "Vote already recorded"
    );
  });

  it("rejects a vote transaction whose sender does not match the caller", async () => {
    mockCampaignAndMilestone();
    verifyTransactionEvent.mockResolvedValue({
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
    mockCampaignAndMilestone();
    verifyTransactionEvent.mockResolvedValue({
      args: { campaignId: 0, milestoneId: 0, voter: "0xabc", weight: BigInt(500), support: true },
      blockNumber: 1,
      timestamp: 1,
      logIndex: 0,
    });
    User.findOneAndUpdate.mockResolvedValue({ id: "user-1" });
    Vote.findOne.mockResolvedValue(null);
    Vote.create.mockResolvedValue([{ id: "vote-1" }]);

    const result = await voteOnMilestone("c1", 0, "0xabc", true, `0x${"1".repeat(64)}`);
    expect(result).toEqual({ id: "vote-1" });
    expect(Vote.create).toHaveBeenCalled();
    expect(Milestone.updateOne).toHaveBeenCalled();
  });
});
