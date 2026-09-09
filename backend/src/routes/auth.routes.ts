import { Router } from "express";
import { requestNonce, verifySignature, getMe } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { nonceRequestSchema, verifySignatureSchema } from "../validators/auth.validator.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/nonce", authRateLimiter, validate(nonceRequestSchema), requestNonce);
router.post("/verify", authRateLimiter, validate(verifySignatureSchema), verifySignature);
router.get("/me", requireAuth, getMe);

export default router;
