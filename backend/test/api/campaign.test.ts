import request from "supertest";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  prisma: {
    campaign: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = await import("../../src/config/database.js");
const { createApp } = await import("../../src/app.js");

const app = createApp();
const JWT_SECRET = "test-secret-key-please-change-in-prod";

function tokenFor(userId: string, walletAddress: string) {
  return jwt.sign({ userId, walletAddress }, JWT_SECRET, { expiresIn: "1h" });
}

describe("Campaign API", () => {
  afterEach(() => jest.clearAllMocks());

  it("rejects campaign creation without a token", async () => {
    const res = await request(app).post("/api/campaigns").send({});
    expect(res.status).toBe(401);
  });

  it("rejects campaign creation with invalid body", async () => {
    const token = tokenFor("user-1", "0x1111111111111111111111111111111111111a");
    const res = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "hi" }); // missing required fields
    expect(res.status).toBe(422);
  });

  it("creates a campaign with a valid body and token", async () => {
    const wallet = "0x1111111111111111111111111111111111111a";
    const token = tokenFor("user-1", wallet);

    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    (prisma.user.upsert as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "user-1", walletAddress: wallet });
    (prisma.campaign.create as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      id: "campaign-1",
      title: "Solar-powered water pumps",
    });

    const res = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contractCampaignId: 0,
        contractAddress: "0x000000000000000000000000000000000000dEaD",
        chainId: 31337,
        creationTxHash: `0x${"a".repeat(64)}`,
        title: "Solar-powered water pumps",
        description: "Bringing clean water access to rural communities using solar pumps.",
        goal: "3000000000000000000",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: [
          { contractMilestoneId: 0, description: "Procure pump hardware", amount: "1000000000000000000" },
          { contractMilestoneId: 1, description: "Install and commission", amount: "2000000000000000000" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(prisma.campaign.create).toHaveBeenCalled();
  });

  it("returns 409 when the contract campaign id is already indexed", async () => {
    const wallet = "0x1111111111111111111111111111111111111a";
    const token = tokenFor("user-1", wallet);

    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: "existing" });

    const res = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contractCampaignId: 0,
        contractAddress: "0x000000000000000000000000000000000000dEaD",
        chainId: 31337,
        creationTxHash: `0x${"a".repeat(64)}`,
        title: "Solar-powered water pumps",
        description: "Bringing clean water access to rural communities using solar pumps.",
        goal: "3000000000000000000",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: [
          { contractMilestoneId: 0, description: "Procure pump hardware", amount: "3000000000000000000" },
        ],
      });

    expect(res.status).toBe(409);
  });

  it("blocks a non-creator from updating a campaign", async () => {
    const attackerToken = tokenFor("user-2", "0x2222222222222222222222222222222222222b");

    (prisma.campaign.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      creator: { walletAddress: "0x1111111111111111111111111111111111111a" },
    });

    const res = await request(app)
      .put("/api/campaigns/11111111-1111-1111-1111-111111111111")
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ title: "Hijacked title" });

    expect(res.status).toBe(403);
  });

  it("lists campaigns with pagination", async () => {
    (prisma.campaign.findMany as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([]);
    (prisma.campaign.count as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(0);

    const res = await request(app).get("/api/campaigns?page=1&pageSize=10");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });
});
