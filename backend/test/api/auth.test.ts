import request from "supertest";
import { ethers } from "ethers";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../src/config/database.js", () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = await import("../../src/config/database.js");
const { createApp } = await import("../../src/app.js");

const app = createApp();

describe("Auth API", () => {
  const wallet = ethers.Wallet.createRandom();

  afterEach(() => jest.clearAllMocks());

  it("issues a nonce for a wallet address", async () => {
    (prisma.user.upsert as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      walletAddress: wallet.address.toLowerCase(),
      nonce: "abc-123",
    });

    const res = await request(app)
      .post("/api/auth/nonce")
      .send({ walletAddress: wallet.address });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("abc-123");
  });

  it("rejects a malformed wallet address", async () => {
    const res = await request(app).post("/api/auth/nonce").send({ walletAddress: "not-an-address" });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("issues a JWT for a valid signature and rejects an invalid one", async () => {
    const nonce = "test-nonce-1";
    const message =
      `Welcome to Milestone Crowdfunding!\n\n` +
      `Sign this message to authenticate.\n\n` +
      `Wallet: ${wallet.address.toLowerCase()}\n` +
      `Nonce: ${nonce}`;
    const signature = await wallet.signMessage(message);

    (prisma.user.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      id: "user-1",
      walletAddress: wallet.address.toLowerCase(),
      nonce,
    });
    (prisma.user.update as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({});

    const goodRes = await request(app)
      .post("/api/auth/verify")
      .send({ walletAddress: wallet.address, signature });

    expect(goodRes.status).toBe(200);
    expect(goodRes.body.data.token).toBeDefined();

    // Same signature replayed after nonce would have rotated should fail against
    // a *different* stored nonce (simulating rotation having occurred).
    (prisma.user.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
      id: "user-1",
      walletAddress: wallet.address.toLowerCase(),
      nonce: "rotated-nonce",
    });

    const replayRes = await request(app)
      .post("/api/auth/verify")
      .send({ walletAddress: wallet.address, signature });

    expect(replayRes.status).toBe(401);
  });

  it("rejects verify for an unknown wallet", async () => {
    (prisma.user.findUnique as unknown as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);
    const res = await request(app)
      .post("/api/auth/verify")
      .send({ walletAddress: wallet.address, signature: "0x00" });
    expect(res.status).toBe(404);
  });
});
