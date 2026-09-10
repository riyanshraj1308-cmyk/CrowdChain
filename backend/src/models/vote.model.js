import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const voteSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    milestoneId: { type: String, ref: "Milestone", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },

    support: { type: Boolean, required: true },
    weight: { type: String, default: "0" }, // wei (= contribution amount at time of vote)
    txHash: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

voteSchema.index({ milestoneId: 1, userId: 1 }, { unique: true });

export const Vote = mongoose.model("Vote", voteSchema);
