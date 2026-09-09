import { z } from "zod";

const txHash = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const milestoneParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    milestoneId: z.string().regex(/^\d+$/),
  }),
});

export const submitMilestoneSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    milestoneId: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    description: z.string().min(5).max(2000),
    proofUrl: z.string().url().optional(),
    txHash,
  }),
});

export const voteMilestoneSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    milestoneId: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    support: z.boolean(),
    txHash,
  }),
});

export const releaseMilestoneSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    milestoneId: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    txHash,
  }),
});
