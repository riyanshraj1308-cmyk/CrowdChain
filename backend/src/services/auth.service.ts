import { v4 as uuid } from "uuid";
import { prisma } from "../config/database.js";
import { verifySignature } from "../blockchain/blockchainService.js";
import { signToken } from "../utils/jwt.js";
import { ApiError } from "../utils/apiResponse.js";

function buildSignMessage(walletAddress: string, nonce: string): string {
  return (
    `Welcome to Milestone Crowdfunding!\n\n` +
    `Sign this message to authenticate.\n\n` +
    `Wallet: ${walletAddress}\n` +
    `Nonce: ${nonce}`
  );
}

export async function requestNonce(walletAddressRaw: string) {
  const walletAddress = walletAddressRaw.toLowerCase();

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: { nonce: uuid() },
    create: { walletAddress, nonce: uuid() },
  });

  return {
    walletAddress: user.walletAddress,
    message: buildSignMessage(user.walletAddress, user.nonce),
  };
}

export async function verifySignatureAndIssueToken(walletAddressRaw: string, signature: string) {
  const walletAddress = walletAddressRaw.toLowerCase();

  const user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) {
    throw new ApiError(404, "Unknown wallet address. Request a nonce first.");
  }

  const message = buildSignMessage(user.walletAddress, user.nonce);
  const isValid = verifySignature(message, signature, user.walletAddress);

  if (!isValid) {
    throw new ApiError(401, "Invalid signature");
  }

  // Rotate the nonce immediately so the signature can never be replayed.
  await prisma.user.update({
    where: { id: user.id },
    data: { nonce: uuid() },
  });

  const token = signToken({ userId: user.id, walletAddress: user.walletAddress });

  return { token, user: { id: user.id, walletAddress: user.walletAddress } };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { reputation: true },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
}
