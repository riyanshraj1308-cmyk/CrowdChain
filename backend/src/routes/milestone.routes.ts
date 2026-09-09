import { Router } from "express";
import {
  listMilestones,
  getMilestone,
  submitMilestone,
  voteOnMilestone,
  releaseMilestone,
} from "../controllers/milestone.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  milestoneParamsSchema,
  submitMilestoneSchema,
  voteMilestoneSchema,
  releaseMilestoneSchema,
} from "../validators/milestone.validator.js";
import { campaignIdParamSchema } from "../validators/campaign.validator.js";
import { requireAuth, requireCampaignCreator, requireContributor } from "../middleware/auth.middleware.js";

// Mounted at /api/campaigns
export const milestoneRouter = Router({ mergeParams: true });

milestoneRouter.get("/:id/milestones", validate(campaignIdParamSchema), listMilestones);
milestoneRouter.get(
  "/:id/milestones/:milestoneId",
  validate(milestoneParamsSchema),
  getMilestone
);

// Creator-only: submit proof of milestone completion.
milestoneRouter.post(
  "/:id/milestones/:milestoneId/submit",
  requireAuth,
  validate(submitMilestoneSchema),
  requireCampaignCreator,
  submitMilestone
);

// Contributor-only: vote to approve/reject a submitted milestone.
milestoneRouter.post(
  "/:id/milestones/:milestoneId/vote",
  requireAuth,
  validate(voteMilestoneSchema),
  requireContributor,
  voteOnMilestone
);

// Anyone can report a release tx hash; the service independently verifies it
// on-chain before recording anything, so this cannot be used to fabricate funds.
milestoneRouter.post(
  "/:id/milestones/:milestoneId/release",
  requireAuth,
  validate(releaseMilestoneSchema),
  releaseMilestone
);
