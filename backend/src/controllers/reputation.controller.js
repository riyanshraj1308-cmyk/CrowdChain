import { asyncHandler } from "../utils/asyncHandler.js";
import { success, ApiError } from "../utils/apiResponse.js";
import { getReputation } from "../services/reputation.service.js";
import { User } from "../models/index.js";

export const getReputationByAddress = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    walletAddress: req.params.address.toLowerCase(),
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const reputation = await getReputation(user._id);
  return success(res, reputation ?? { score: 0 }, "Reputation fetched");
});
