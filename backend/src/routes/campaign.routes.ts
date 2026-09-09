import { Router } from "express";
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
} from "../controllers/campaign.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdParamSchema,
  listCampaignsQuerySchema,
} from "../validators/campaign.validator.js";
import { requireAuth, requireCampaignCreator } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, validate(createCampaignSchema), createCampaign);
router.get("/", validate(listCampaignsQuerySchema), listCampaigns);
router.get("/:id", validate(campaignIdParamSchema), getCampaign);
router.put(
  "/:id",
  requireAuth,
  validate(updateCampaignSchema),
  requireCampaignCreator,
  updateCampaign
);

export default router;
