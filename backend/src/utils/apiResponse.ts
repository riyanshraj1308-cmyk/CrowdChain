import { Response } from "express";

export function success<T>(res: Response, data: T, message = "Operation successful", status = 200) {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
}

export function failure(res: Response, message: string, status = 400, error?: unknown) {
  return res.status(status).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error ?? undefined,
  });
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
