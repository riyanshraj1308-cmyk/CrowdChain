import { Campaign, Contribution, Milestone, Reputation, User } from "../models/index.js";
import { ApiError } from "../utils/apiResponse.js";

export async function createCampaign(input) {
  const existing = await Campaign.findOne({ contractCampaignId: input.contractCampaignId });
  if (existing) {
    throw new ApiError(409, "Campaign with this contract ID has already been indexed");
  }

  const creator = await User.findOneAndUpdate(
    { walletAddress: input.creatorWalletAddress.toLowerCase() },
    { $setOnInsert: { walletAddress: input.creatorWalletAddress.toLowerCase() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const campaign = await Campaign.create({
    contractCampaignId: input.contractCampaignId,
    contractAddress: input.contractAddress,
    chainId: input.chainId,
    creationTxHash: input.creationTxHash,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    goal: input.goal,
    deadline: new Date(input.deadline),
    creatorId: creator._id,
  });

  const milestones = await Milestone.insertMany(
    input.milestones.map((m) => ({
      campaignId: campaign._id,
      contractMilestoneId: m.contractMilestoneId,
      title: m.title ?? null,
      description: m.description,
      amount: m.amount,
    }))
  );

  return { ...campaign.toObject(), milestones, creatorId: creator };
}

export async function listCampaigns(filters) {
  const query = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.creator ? { creatorId: (await User.findOne({ walletAddress: filters.creator.toLowerCase() }))?.id ?? null } : {}),
  };

  const [items, total] = await Promise.all([
    Campaign.find(query)
      .populate("creatorId")
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize)
      .lean(),
    Campaign.countDocuments(query),
  ]);

  const withMilestones = await Promise.all(
    items.map(async (c) => ({
      ...c,
      milestones: await Milestone.find({ campaignId: c._id }).sort({ contractMilestoneId: 1 }).lean(),
    }))
  );

  return { items: withMilestones, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getCampaignById(id) {
  const campaign = await Campaign.findById(id).populate("creatorId").lean();

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  const [milestones, contributions, reputation] = await Promise.all([
    Milestone.find({ campaignId: id }).sort({ contractMilestoneId: 1 }).lean(),
    Contribution.find({ campaignId: id, confirmed: true }).lean(),
    Reputation.findOne({ userId: campaign.creatorId._id ?? campaign.creatorId }).lean(),
  ]);

  return {
    ...campaign,
    milestones,
    contributions,
    creatorId: { ...campaign.creatorId, reputation: reputation ?? null },
  };
}

export async function updateCampaignMetadata(id, data) {
  await getCampaignById(id); // ensures existence + 404
  return Campaign.findByIdAndUpdate(id, { $set: data }, { new: true });
}
