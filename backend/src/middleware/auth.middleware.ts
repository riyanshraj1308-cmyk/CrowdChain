import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import { failure } from "../utils/apiResponse.js";
import { prisma } from "../config/database.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
export async function requireCampaignCreator(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { creator: true },
    });

    if (!campaign) {
      return failure(res, "Campaign not found", 404);
    }

    if (!req.user || campaign.creator.walletAddress !== req.user.walletAddress) {
      return failure(res, "Only the campaign creator may perform this action", 403);
    }

    return next();
  } catch (err) {
    return failure(res, "Authorization check failed", 500, err);
  }
}

/** Ensures the authenticated user has an on-chain-confirmed contribution to the campaign. */
export async function requireContributor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return failure(res, "Authentication required", 401);
    }

    const contribution = await prisma.contribution.findFirst({
      where: {
        campaignId: req.params.id,
        user: { walletAddress: req.user.walletAddress },
        confirmed: true,
      },
    });

    if (!contribution) {
      return failure(res, "Only confirmed contributors may perform this action", 403);
    }

    return next();
  } catch (err) {
    return failure(res, "Authorization check failed", 500, err);
  }
}
