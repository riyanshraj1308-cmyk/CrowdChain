import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import { TRANSACTION_TYPES } from "./constants.js";

const transactionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuid() },
    campaignId: { type: String, ref: "Campaign", default: null, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true, index: true },
    txHash: { type: String, required: true, index: true },
    blockNumber: { type: Number, required: true },
    logIndex: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

transactionSchema.index({ txHash: 1, logIndex: 1 }, { unique: true });

export const Transaction = mongoose.model("Transaction", transactionSchema);
