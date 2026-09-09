import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import * as contributionService from "../services/contribution.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const recordContribution = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contribution = await contributionService.recordContribution(
    req.params.id,
    req.user!.walletAddress,
    req.body.txHash
  );
  return success(res, contribution, "Contribution verified and recorded", 201);
});

export const listContributors = asyncHandler(async (req, res: Response) => {
  const contributors = await contributionService.listContributors(req.params.id);
  return success(res, contributors, "Contributors fetched");
});

export const listUserContributions = asyncHandler(async (req, res: Response) => {
  const contributions = await contributionService.listUserContributions(req.params.address);
  return success(res, contributions, "User contributions fetched");
});
