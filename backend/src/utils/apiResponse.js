export function success(res, data, message = "Operation successful", status = 200) {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
}

export function failure(res, message, status = 400, error) {
  return res.status(status).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error ?? undefined,
  });
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
