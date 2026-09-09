import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import * as milestoneService from "../services/milestone.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const listMilestones = asyncHandler(async (req, res: Response) => {
  const milestones = await milestoneService.listMilestones(req.params.id);
  return success(res, milestones, "Milestones fetched");
});

export const getMilestone = asyncHandler(async (req, res: Response) => {
  const milestone = await milestoneService.getMilestone(req.params.id, Number(req.params.milestoneId));
  return success(res, milestone, "Milestone fetched");
});

export const submitMilestone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { description, proofUrl, txHash } = req.body;
  const milestone = await milestoneService.submitMilestone(
    req.params.id,
    Number(req.params.milestoneId),
    description,
    proofUrl,
    txHash
  );
  return success(res, milestone, "Milestone submission recorded", 201);
});

export const voteOnMilestone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { support, txHash } = req.body;
  const vote = await milestoneService.voteOnMilestone(
    req.params.id,
    Number(req.params.milestoneId),
    req.user!.walletAddress,
    support,
    txHash
  );
  return success(res, vote, "Vote recorded", 201);
});

export const releaseMilestone = asyncHandler(async (req, res: Response) => {
  const milestone = await milestoneService.releaseMilestone(
    req.params.id,
    Number(req.params.milestoneId),
    req.body.txHash
  );
  return success(res, milestone, "Milestone release recorded");
});
