import { Router } from "express";
import {
  recordContribution,
  listContributors,
  listUserContributions,
} from "../controllers/contribution.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  recordContributionSchema,
  walletAddressParamSchema,
} from "../validators/contribution.validator.js";
import { campaignIdParamSchema } from "../validators/campaign.validator.js";
import { requireAuth } from "../middleware/auth.middleware.js";

// Mounted at /api/campaigns
export const campaignContributionRouter = Router({ mergeParams: true });

campaignContributionRouter.post(
  "/:id/contribute",
  requireAuth,
  validate(recordContributionSchema),
  recordContribution
);
campaignContributionRouter.get(
  "/:id/contributors",
  validate(campaignIdParamSchema),
  listContributors
);

// Mounted at /api/users
export const userContributionRouter = Router({ mergeParams: true });

userContributionRouter.get(
  "/:address/contributions",
  validate(walletAddressParamSchema),
  listUserContributions
);
