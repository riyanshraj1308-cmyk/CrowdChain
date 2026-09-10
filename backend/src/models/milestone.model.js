import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import { MILESTONE_STATUSES } from "./constants.js";

const milestoneSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    campaignId: { type: String, ref: "Campaign", required: true, index: true },
    contractMilestoneId: { type: Number, required: true },

    title: { type: String, default: null },
    description: { type: String, required: true },
    proofUrl: { type: String, default: null },

    amount: { type: String, default: "0" }, // wei

    status: { type: String, enum: MILESTONE_STATUSES, default: "PENDING", index: true },
    submittedAt: { type: Date, default: null },
    votingDeadline: { type: Date, default: null },
    votesFor: { type: String, default: "0" }, // wei (weight-based)
    votesAgainst: { type: String, default: "0" },
    releasedAt: { type: Date, default: null },
    releaseTxHash: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

milestoneSchema.index({ campaignId: 1, contractMilestoneId: 1 }, { unique: true });

export const Milestone = mongoose.model("Milestone", milestoneSchema);
