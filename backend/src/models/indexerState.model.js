import mongoose from "mongoose";

// Single fixed document tracking the last block the indexer processed so it
// can resume after a restart without missing or double-processing events.
const indexerStateSchema = new mongoose.Schema(
  {
    _id: { type: Number, default: 1 },
    lastBlock: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export const IndexerState = mongoose.model("IndexerState", indexerStateSchema);
