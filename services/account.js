const User = require("../models/User");
const { getEthBalance } = require("./blockchain");
const { getEthPrice } = require("./ethPrice");
const { getMiningStatus } = require("./mining");
const { calculateReward } = require("./reward");
const { getRewardSummary } = require("./rewardSummary");
const { ensureReferralCode, buildReferralLink } = require("../utils/referral");
const { toEthString } = require("../utils/ethString");

/**
 * Builds the Account page summary.
 * Returns only frontend-required fields.
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

  let dbUser = await User.findById(user._id);

  if (!dbUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  dbUser = await ensureReferralCode(dbUser);

  const walletAddress = dbUser.walletAddress;
  const walletBalanceRaw = await getEthBalance(walletAddress);
  const ethPrice = await getEthPrice();
  const miningStatus = getMiningStatus(walletBalanceRaw);
  const rewardPreview = calculateReward(walletBalanceRaw, ethPrice);
  const rewardSummary = await getRewardSummary(dbUser._id);

  return {
    walletAddress: dbUser.walletAddress,
    exchangeable: rewardSummary.exchangeable,
    withdrawable: rewardSummary.withdrawable,
    totalRewards: rewardSummary.totalRewards,
    shareDividend: rewardSummary.shareDividend,
    referralCode: dbUser.referralCode,
    referralLink: buildReferralLink(dbUser.referralCode),
    walletBalance: toEthString(walletBalanceRaw),
    symbol: "ETH",
    ethPrice,
    miningStatus,
    rewardPreview: {
      dailyRewardUsd: rewardPreview.dailyRewardUsd,
      sixHourRewardEth: toEthString(rewardPreview.sixHourRewardEth),
    },
  };
};

module.exports = {
  getAccountSummary,
};
