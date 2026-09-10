import { z } from "zod";

const txHash = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const recordContributionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    txHash,
  }),
});

export const walletAddressParamSchema = z.object({
  params: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  }),
});
