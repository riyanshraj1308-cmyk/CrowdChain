import winston from "winston";
import { env } from "../config/env.js";

export const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});
