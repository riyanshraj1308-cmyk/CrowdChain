import { z } from "zod";

const ethAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const nonceRequestSchema = z.object({
  body: z.object({
    walletAddress: ethAddress,
  }),
});

export const verifySignatureSchema = z.object({
  body: z.object({
    walletAddress: ethAddress,
    signature: z.string().min(1, "Signature is required"),
  }),
});
