import { z } from "zod";

const ethAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");
const txHash = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const createCampaignSchema = z.object({
  body: z.object({
    contractCampaignId: z.number().int().nonnegative(),
    contractAddress: ethAddress,
    chainId: z.number().int().positive(),
    creationTxHash: txHash,
    title: z.string().min(3).max(150),
    description: z.string().min(10).max(5000),
    imageUrl: z.string().url().optional(),
    goal: z.string().regex(/^\d+$/, "Goal must be an integer amount in wei"),
    deadline: z.string().datetime({ message: "Deadline must be an ISO datetime string" }),
    milestones: z
      .array(
        z.object({
          contractMilestoneId: z.number().int().nonnegative(),
          title: z.string().min(3).max(150).optional(),
          description: z.string().min(5).max(2000),
          amount: z.string().regex(/^\d+$/, "Amount must be an integer amount in wei"),
        })
      )
      .min(1, "At least one milestone is required"),
  }),
});

export const updateCampaignSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    description: z.string().min(10).max(5000).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const campaignIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listCampaignsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "SUCCESSFUL", "FAILED", "CANCELLED", "COMPLETED"]).optional(),
    creator: ethAddress.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }),
});
