const User = require("../models/User");
const { getEthBalance } = require("./blockchain");
const { getEthPrice } = require("./ethPrice");
const { getMiningStatus } = require("./mining");
const { calculateReward } = require("./reward");
const { getRewardSummary } = require("./rewardSummary");
const {
  minimumEthBalance,
  rewardIntervalHours,
} = require("../config/mining");

/**
 * Builds the full account summary for the Account page.
 *
 * @param {object} user - Authenticated user (at least _id)
 * @returns {Promise<object>}
 */
const getAccountSummary = async (user) => {
  if (!user || !user._id) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const dbUser = await User.findById(user._id);

  if (!dbUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const walletAddress = dbUser.walletAddress;
  const walletBalance = await getEthBalance(walletAddress);
  const ethPrice = await getEthPrice();
  const miningStatus = getMiningStatus(walletBalance);
  const rewardPreview = calculateReward(walletBalance, ethPrice);
  const rewardSummary = await getRewardSummary(dbUser._id);

  return {
    _id: dbUser._id,
    walletAddress: dbUser.walletAddress,
    walletType: dbUser.walletType,
    chainId: dbUser.chainId,
    exchangeable: rewardSummary.exchangeable,
    withdrawable: rewardSummary.withdrawable,
    totalRewards: rewardSummary.totalRewards,
    totalClaimed: rewardSummary.totalClaimed,
    lastRewardTime: dbUser.lastRewardTime ?? null,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    walletBalance,
    symbol: "ETH",
    ethPrice,
    miningStatus,
    minimumRequired: String(minimumEthBalance),
    rewardIntervalHours,
    rewardPreview: {
      walletBalanceUsd: rewardPreview.walletBalanceUsd,
      rewardPercentage: rewardPreview.rewardPercentage,
      dailyRewardUsd: rewardPreview.dailyRewardUsd,
      sixHourRewardUsd: rewardPreview.sixHourRewardUsd,
      sixHourRewardEth: rewardPreview.sixHourRewardEth,
    },
  };
};

module.exports = {
  getAccountSummary,
};
