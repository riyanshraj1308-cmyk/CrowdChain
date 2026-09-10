import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import * as campaignService from "../services/campaign.service.js";

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign({
    ...req.body,
    creatorWalletAddress: req.user.walletAddress,
  });
  return success(res, campaign, "Campaign indexed successfully", 201);
});

export const listCampaigns = asyncHandler(async (req, res) => {
  const { status, creator, page, pageSize } = req.query;
  const result = await campaignService.listCampaigns({ status, creator, page, pageSize });
  return success(res, result, "Campaigns fetched");
});

export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.params.id);
  return success(res, campaign, "Campaign fetched");
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaignMetadata(req.params.id, req.body);
  return success(res, campaign, "Campaign updated");
});
