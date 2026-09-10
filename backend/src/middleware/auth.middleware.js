import { verifyToken } from "../utils/jwt.js";
import { failure } from "../utils/apiResponse.js";
import { Campaign, Contribution, User } from "../models/index.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return failure(res, "Missing or malformed Authorization header", 401);
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, walletAddress: payload.walletAddress };
    return next();
  } catch {
    return failure(res, "Invalid or expired token", 401);
  }
}

/** Ensures the authenticated user is the on-record creator of the campaign in :id. */
export async function requireCampaignCreator(req, res, next) {
  try {
    const campaign = await Campaign.findById(req.params.id).populate("creatorId");

    if (!campaign) {
      return failure(res, "Campaign not found", 404);
    }

    if (!req.user || campaign.creatorId.walletAddress !== req.user.walletAddress) {
      return failure(res, "Only the campaign creator may perform this action", 403);
    }

    return next();
  } catch (err) {
    return failure(res, "Authorization check failed", 500, err);
  }
}

/** Ensures the authenticated user has an on-chain-confirmed contribution to the campaign. */
export async function requireContributor(req, res, next) {
  try {
    if (!req.user) {
      return failure(res, "Authentication required", 401);
    }

    const user = await User.findOne({ walletAddress: req.user.walletAddress.toLowerCase() });
    if (user) {
      const contribution = await Contribution.findOne({
        campaignId: req.params.id,
        userId: user._id,
        confirmed: true,
      });

      if (contribution) return next();
    }

    return failure(res, "Only confirmed contributors may perform this action", 403);
  } catch (err) {
    return failure(res, "Authorization check failed", 500, err);
  }
}
