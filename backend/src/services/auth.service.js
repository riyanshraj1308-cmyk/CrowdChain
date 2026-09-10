import { v4 as uuid } from "uuid";
import { User, Reputation } from "../models/index.js";
import { verifySignature } from "../blockchain/blockchainService.js";
import { signToken } from "../utils/jwt.js";
import { ApiError } from "../utils/apiResponse.js";

function buildSignMessage(walletAddress, nonce) {
  return (
    `Welcome to Milestone Crowdfunding!\n\n` +
    `Sign this message to authenticate.\n\n` +
    `Wallet: ${walletAddress}\n` +
    `Nonce: ${nonce}`
  );
}

export async function requestNonce(walletAddressRaw) {
  const walletAddress = walletAddressRaw.toLowerCase();

  const user = await User.findOneAndUpdate(
    { walletAddress },
    { $set: { nonce: uuid() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return {
    walletAddress: user.walletAddress,
    message: buildSignMessage(user.walletAddress, user.nonce),
  };
}

export async function verifySignatureAndIssueToken(walletAddressRaw, signature) {
  const walletAddress = walletAddressRaw.toLowerCase();

  const user = await User.findOne({ walletAddress });
  if (!user) {
    throw new ApiError(404, "Unknown wallet address. Request a nonce first.");
  }

  const message = buildSignMessage(user.walletAddress, user.nonce);
  const isValid = verifySignature(message, signature, user.walletAddress);

  if (!isValid) {
    throw new ApiError(401, "Invalid signature");
  }

  // Rotate the nonce immediately so the signature can never be replayed.
  await User.updateOne({ _id: user._id }, { $set: { nonce: uuid() } });

  const token = signToken({ userId: user._id, walletAddress: user.walletAddress });

  return { token, user: { id: user._id, walletAddress: user.walletAddress } };
}

export async function getUserById(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const reputation = await Reputation.findOne({ userId }).lean();

  return { ...user, reputation: reputation ?? null };
}
