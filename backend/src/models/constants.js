// Replaces the Prisma enums; kept in one place so validators, models and
// services agree on the exact string values stored in MongoDB.

export const CAMPAIGN_STATUSES = ["ACTIVE", "SUCCESSFUL", "FAILED", "CANCELLED", "COMPLETED"];

export const MILESTONE_STATUSES = ["PENDING", "SUBMITTED", "APPROVED", "RELEASED", "REJECTED"];

export const TRANSACTION_TYPES = [
  "CAMPAIGN_CREATED",
  "CONTRIBUTION",
  "MILESTONE_SUBMITTED",
  "VOTE_CAST",
  "MILESTONE_APPROVED",
  "MILESTONE_REJECTED",
  "FUNDS_RELEASED",
  "CAMPAIGN_COMPLETED",
  "CAMPAIGN_STATUS_CHANGED",
  "REFUND_CLAIMED",
];

// On-chain CampaignStatusChanged event emits a uint8 status; this maps it to
// the API's string enum (order matches the Solidity enum).
export const ON_CHAIN_STATUS_MAP = ["ACTIVE", "SUCCESSFUL", "FAILED", "CANCELLED", "COMPLETED"];

// Mirrors the Solidity MilestoneStatus enum ordering.
export const ON_CHAIN_MILESTONE_STATUS_MAP = [
  "PENDING",
  "SUBMITTED",
  "APPROVED",
  "RELEASED",
  "REJECTED",
];
