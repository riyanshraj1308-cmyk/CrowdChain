import { Router } from "express";
import authRoutes from "./auth.routes.js";
import campaignRoutes from "./campaign.routes.js";
import userRoutes from "./user.routes.js";
import { campaignContributionRouter } from "./contribution.routes.js";
import { milestoneRouter } from "./milestone.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/campaigns", campaignContributionRouter);
router.use("/campaigns", milestoneRouter);
router.use("/users", userRoutes);

export default router;
