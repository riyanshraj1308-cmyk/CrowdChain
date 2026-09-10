import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

async function main() {
  const app = createApp();

  await connectDatabase();
  logger.info(`Connected to MongoDB (${env.MONGODB_URI})`);

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
