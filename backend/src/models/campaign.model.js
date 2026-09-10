import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import { CAMPAIGN_STATUSES } from "./constants.js";

// Monetary fields are stored as integer strings (wei) to avoid float drift.
const campaignSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    contractCampaignId: { type: Number, required: true, unique: true, index: true },
    contractAddress: { type: String, required: true },
    chainId: { type: Number, required: true },
    creationTxHash: { type: String, required: true },

    creatorId: { type: String, ref: "User", required: true, index: true },

    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: null },

    goal: { type: String, default: "0" }, // wei
    deadline: { type: Date, required: true },

    totalRaised: { type: String, default: "0" }, // wei
    totalReleased: { type: String, default: "0" }, // wei

    status: { type: String, enum: CAMPAIGN_STATUSES, default: "ACTIVE", index: true },
  },
  { timestamps: true, versionKey: false }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
