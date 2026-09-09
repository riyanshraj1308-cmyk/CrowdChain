import { prisma } from "../config/database.js";
import { ApiError } from "../utils/apiResponse.js";
import { CampaignStatus } from "@prisma/client";

interface CreateCampaignInput {
  contractCampaignId: number;
  contractAddress: string;
  chainId: number;
  creationTxHash: string;
  title: string;
  description: string;
  imageUrl?: string;
  goal: string;
  deadline: string;
  milestones: { contractMilestoneId: number; title?: string; description: string; amount: string }[];
  creatorWalletAddress: string;
}

export async function createCampaign(input: CreateCampaignInput) {
  const existing = await prisma.campaign.findUnique({
    where: { contractCampaignId: input.contractCampaignId },
  });
  if (existing) {
    throw new ApiError(409, "Campaign with this contract ID has already been indexed");
  }

  const creator = await prisma.user.upsert({
    where: { walletAddress: input.creatorWalletAddress.toLowerCase() },
    update: {},
    create: { walletAddress: input.creatorWalletAddress.toLowerCase() },
  });

  return prisma.campaign.create({
    data: {
      contractCampaignId: input.contractCampaignId,
      contractAddress: input.contractAddress,
      chainId: input.chainId,
      creationTxHash: input.creationTxHash,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      goal: input.goal,
      deadline: new Date(input.deadline),
      creatorId: creator.id,
      milestones: {
        create: input.milestones.map((m) => ({
          contractMilestoneId: m.contractMilestoneId,
          title: m.title,
          description: m.description,
          amount: m.amount,
        })),
      },
    },
    include: { milestones: true, creator: true },
  });
}

export async function listCampaigns(filters: {
  status?: CampaignStatus;
  creator?: string;
  page: number;
  pageSize: number;
}) {
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.creator ? { creator: { walletAddress: filters.creator.toLowerCase() } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: { creator: true, milestones: true },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.campaign.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getCampaignById(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      creator: { include: { reputation: true } },
      milestones: { orderBy: { contractMilestoneId: "asc" } },
      contributions: { where: { confirmed: true } },
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  return campaign;
}

export async function updateCampaignMetadata(
  id: string,
  data: { title?: string; description?: string; imageUrl?: string }
) {
  await getCampaignById(id); // ensures existence + 404
  return prisma.campaign.update({ where: { id }, data });
}
