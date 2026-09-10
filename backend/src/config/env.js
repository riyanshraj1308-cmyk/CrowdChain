import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().default("crowdfunding"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),

  RPC_URL: z.string().default("http://127.0.0.1:8545"),
  CHAIN_ID: z.coerce.number().default(31337),
  CONTRACT_ADDRESS: z.string().optional(),

  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:5173"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  INDEXER_POLL_INTERVAL_MS: z.coerce.number().default(4000),
  INDEXER_CONFIRMATIONS: z.coerce.number().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
