import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

// Wallet addresses are always stored lowercase.
const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    walletAddress: { type: String, required: true, unique: true, index: true },
    nonce: { type: String, default: () => uuid() },
  },
  { timestamps: true, versionKey: false }
);

export const User = mongoose.model("User", userSchema);
