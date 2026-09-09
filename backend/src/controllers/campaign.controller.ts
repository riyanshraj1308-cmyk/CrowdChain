import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import * as campaignService from "../services/campaign.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { CampaignStatus } from "@prisma/client";

export const createCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campaign = await campaignService.createCampaign({
    ...req.body,
    creatorWalletAddress: req.user!.walletAddress,
  });
  return success(res, campaign, "Campaign indexed successfully", 201);
});

export const listCampaigns = asyncHandler(async (req, res: Response) => {
  const { status, creator, page, pageSize } = req.query as unknown as {
    status?: CampaignStatus;
    creator?: string;
    page: number;
    pageSize: number;
  };
  const result = await campaignService.listCampaigns({ status, creator, page, pageSize });
  return success(res, result, "Campaigns fetched");
});

export const getCampaign = asyncHandler(async (req, res: Response) => {
  const campaign = await campaignService.getCampaignById(req.params.id);
  return success(res, campaign, "Campaign fetched");
});

export const updateCampaign = asyncHandler(async (req, res: Response) => {
  const campaign = await campaignService.updateCampaignMetadata(req.params.id, req.body);
  return success(res, campaign, "Campaign updated");
});
