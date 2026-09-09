import { Router } from "express";
import { getReputationByAddress } from "../controllers/reputation.controller.js";
import { userContributionRouter } from "./contribution.routes.js";
import { walletAddressParamSchema } from "../validators/contribution.validator.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use("/", userContributionRouter);
router.get("/:address/reputation", validate(walletAddressParamSchema), getReputationByAddress);

export default router;
