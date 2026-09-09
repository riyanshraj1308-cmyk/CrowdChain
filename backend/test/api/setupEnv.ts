process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret-key-please-change-in-prod";
process.env.RPC_URL = "http://127.0.0.1:8545";
process.env.CHAIN_ID = "31337";
process.env.CORS_ORIGIN = "http://localhost:3000";
