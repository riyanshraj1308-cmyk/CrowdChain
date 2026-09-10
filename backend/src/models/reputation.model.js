import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const reputationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    userId: { type: String, ref: "User", required: true, unique: true, index: true },

    successfulCampaigns: { type: Number, default: 0 },
    totalCampaigns: { type: Number, default: 0 },
    milestoneCompletionPct: { type: Number, default: 0 },
    totalContributors: { type: Number, default: 0 },
    rejectedMilestones: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export const Reputation = mongoose.model("Reputation", reputationSchema);
