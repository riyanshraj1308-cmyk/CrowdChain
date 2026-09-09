import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import * as authService from "../services/auth.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const requestNonce = asyncHandler(async (req, res: Response) => {
  const { walletAddress } = req.body;
  const result = await authService.requestNonce(walletAddress);
  return success(res, result, "Nonce generated");
});

export const verifySignature = asyncHandler(async (req, res: Response) => {
  const { walletAddress, signature } = req.body;
  const result = await authService.verifySignatureAndIssueToken(walletAddress, signature);
  return success(res, result, "Authenticated successfully");
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getUserById(req.user!.userId);
  return success(res, user, "Current user fetched");
});
