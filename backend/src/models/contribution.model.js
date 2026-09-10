import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const contributionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    campaignId: { type: String, ref: "Campaign", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },

    amount: { type: String, default: "0" }, // wei, this single contribution tx
    txHash: { type: String, required: true, unique: true, index: true },
    blockNumber: { type: Number, required: true },
    confirmed: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const Contribution = mongoose.model("Contribution", contributionSchema);
