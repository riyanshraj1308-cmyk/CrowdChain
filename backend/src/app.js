import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import { logger } from "./utils/logger.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
  app.use("/api", apiRateLimiter);

  app.get("/health", (_req, res) => {
    res.json({ success: true, message: "OK", data: { uptime: process.uptime() } });
  });

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
