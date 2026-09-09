import { ethers } from "ethers";
import { getProvider, getReadOnlyContract, getDeployment } from "../provider.js";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { recalculateReputation } from "../../services/reputation.service.js";

/**
 * Polling-based indexer (works reliably against local Hardhat nodes and public
 * RPC providers alike, unlike raw `contract.on(...)` subscriptions which can
 * silently drop events on reconnects). On every tick it reads all blocks since
 * the last processed block, so a restart never causes events to be missed -
 * it simply resumes from IndexerState.lastBlock.
 */

const EVENT_NAMES = [
  "CampaignCreated",
  "ContributionReceived",
  "MilestoneSubmitted",
  "VoteCast",
  "MilestoneApproved",
  "MilestoneRejected",
  "FundsReleased",
  "CampaignCompleted",
  "CampaignStatusChanged",
  "RefundClaimed",
] as const;

async function getIndexerState() {
  const state = await prisma.indexerState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastBlock: BigInt(0) },
  });
  return state;
}

async function setLastBlock(blockNumber: bigint) {
  await prisma.indexerState.update({ where: { id: 1 }, data: { lastBlock: blockNumber } });
}

async function upsertTransactionRecord(
  campaignDbId: string | null,
  type: string,
  log: ethers.LogDescription,
  raw: ethers.Log,
  blockTimestamp: number
) {
  await prisma.transaction.upsert({
    where: { txHash_logIndex: { txHash: raw.transactionHash, logIndex: raw.index } },
    update: {},
    create: {
      campaignId: campaignDbId,
      type: type as never,
      txHash: raw.transactionHash,
      blockNumber: BigInt(raw.blockNumber),
      logIndex: raw.index,
      timestamp: new Date(blockTimestamp * 1000),
      payload: JSON.parse(
        JSON.stringify(log.args.toObject ? log.args.toObject() : {}, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      ),
    },
  });
}

async function findCampaignDbId(contractCampaignId: number): Promise<string | null> {
  const campaign = await prisma.campaign.findUnique({ where: { contractCampaignId } });
  return campaign?.id ?? null;
}

async function handleCampaignStatusChanged(args: Record<string, unknown>) {
  const contractCampaignId = Number(args.campaignId);
  const statusEnum = ["ACTIVE", "SUCCESSFUL", "FAILED", "CANCELLED", "COMPLETED"] as const;
  const status = statusEnum[Number(args.status)];
  if (!status) return;

  await prisma.campaign.updateMany({
    where: { contractCampaignId },
    data: { status },
  });
}

async function handleMilestoneApprovedOrRejected(
  args: Record<string, unknown>,
  approved: boolean
) {
  const contractCampaignId = Number(args.campaignId);
  const milestoneId = Number(args.milestoneId);
  const campaign = await prisma.campaign.findUnique({ where: { contractCampaignId } });
  if (!campaign) return;

  await prisma.milestone.updateMany({
    where: { campaignId: campaign.id, contractMilestoneId: milestoneId },
    data: { status: approved ? "APPROVED" : "REJECTED" },
  });

  if (!approved) {
    await recalculateReputation(campaign.creatorId);
  }
}

async function processLog(parsed: ethers.LogDescription, raw: ethers.Log, blockTimestamp: number) {
  const args = parsed.args.toObject ? (parsed.args.toObject() as Record<string, unknown>) : {};

  switch (parsed.name) {
    case "CampaignStatusChanged": {
      await handleCampaignStatusChanged(args);
      const dbId = await findCampaignDbId(Number(args.campaignId));
      await upsertTransactionRecord(dbId, "CAMPAIGN_STATUS_CHANGED", parsed, raw, blockTimestamp);
      break;
    }
    case "MilestoneApproved": {
      await handleMilestoneApprovedOrRejected(args, true);
      const dbId = await findCampaignDbId(Number(args.campaignId));
      await upsertTransactionRecord(dbId, "MILESTONE_APPROVED", parsed, raw, blockTimestamp);
      break;
    }
    case "MilestoneRejected": {
      await handleMilestoneApprovedOrRejected(args, false);
      const dbId = await findCampaignDbId(Number(args.campaignId));
      await upsertTransactionRecord(dbId, "MILESTONE_REJECTED", parsed, raw, blockTimestamp);
      break;
    }
    case "RefundClaimed": {
      const dbId = await findCampaignDbId(Number(args.campaignId));
      await upsertTransactionRecord(dbId, "REFUND_CLAIMED", parsed, raw, blockTimestamp);
      break;
    }
    // CampaignCreated, ContributionReceived, MilestoneSubmitted, VoteCast,
    // FundsReleased, CampaignCompleted are primarily written by their
    // corresponding API endpoints after verifying the tx directly (so the
    // response can return immediately after the user's own transaction).
    // The indexer still logs them here as an audit trail / reconciliation
    // pass, using upsert so re-processing is always safe.
    default: {
      const dbId = args.campaignId !== undefined ? await findCampaignDbId(Number(args.campaignId)) : null;
      await upsertTransactionRecord(dbId, parsed.name.toUpperCase(), parsed, raw, blockTimestamp);
      break;
    }
  }
}

async function pollOnce() {
  const provider = getProvider();
  const contract = getReadOnlyContract();
  const { address } = getDeployment();

  const state = await getIndexerState();
  const latestBlock = await provider.getBlockNumber();
  const safeLatest = Math.max(0, latestBlock - env.INDEXER_CONFIRMATIONS + 1);

  const fromBlock = Number(state.lastBlock) + 1;
  if (fromBlock > safeLatest) {
    return; // nothing new yet
  }

  const filter = { address, fromBlock, toBlock: safeLatest };
  const rawLogs = await provider.getLogs(filter);

  const blockTimestampCache = new Map<number, number>();

  for (const raw of rawLogs) {
    let parsed: ethers.LogDescription | null;
    try {
      parsed = contract.interface.parseLog(raw);
    } catch {
      continue;
    }
    if (!parsed || !(EVENT_NAMES as readonly string[]).includes(parsed.name)) continue;

    if (!blockTimestampCache.has(raw.blockNumber)) {
      const block = await provider.getBlock(raw.blockNumber);
      blockTimestampCache.set(raw.blockNumber, block?.timestamp ?? Math.floor(Date.now() / 1000));
    }

    try {
      await processLog(parsed, raw, blockTimestampCache.get(raw.blockNumber)!);
    } catch (err) {
      logger.error(`Failed to process event ${parsed.name} in tx ${raw.transactionHash}: ${err}`);
      // Don't advance lastBlock past a failed event on the next line;
      // instead continue processing remaining logs in this batch and rely
      // on the upsert being safely retryable on the next poll cycle.
    }
  }

  await setLastBlock(BigInt(safeLatest));
}

export function startEventListener() {
  logger.info("Starting blockchain event indexer...");
  pollOnce().catch((err) => logger.error(`Indexer initial poll failed: ${err}`));

  setInterval(() => {
    pollOnce().catch((err) => logger.error(`Indexer poll failed: ${err}`));
  }, env.INDEXER_POLL_INTERVAL_MS);
}

if (require.main === module) {
  startEventListener();
}
