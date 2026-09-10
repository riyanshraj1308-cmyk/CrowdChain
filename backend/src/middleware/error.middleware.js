import { ZodError } from "zod";
import { ApiError } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      error: err.flatten(),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  logger.error(err instanceof Error ? err : new Error(String(err)));

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
