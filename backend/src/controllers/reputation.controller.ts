import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success, ApiError } from "../utils/apiResponse.js";
import { getReputation } from "../services/reputation.service.js";
import { prisma } from "../config/database.js";

export const getReputationByAddress = asyncHandler(async (req, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { walletAddress: req.params.address.toLowerCase() },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const reputation = await getReputation(user.id);
  return success(res, reputation ?? { score: 0 }, "Reputation fetched");
});
