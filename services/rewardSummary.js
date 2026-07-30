const Reward = require("../models/Reward");
const { toEthString } = require("../utils/ethString");

const isReferralType = (rewardType) =>
  rewardType === "referral" || rewardType === "REFERRAL";

/**
 * Builds reward balance totals from the Reward ledger.
 * Exchangeable includes both mining and referral PENDING rewards.
 *
 * @param {string|object} userId
 * @returns {Promise<{
 *   exchangeable: string,
 *   withdrawable: number,
 *   totalRewards: string,
 *   totalClaimed: number,
 *   shareDividend: string
 * }>}
 */
const getRewardSummary = async (userId) => {
  const rewards = await Reward.find({ userId }).select(
    "status rewardEth rewardUsd rewardType"
  );

  let exchangeable = 0;
  let withdrawable = 0;
  let totalRewards = 0;
  let totalClaimed = 0;
  let shareDividend = 0;

  for (const reward of rewards) {
    const rewardEth = Number(reward.rewardEth) || 0;
    const rewardUsd = Number(reward.rewardUsd) || 0;

    totalRewards += rewardEth;

    if (isReferralType(reward.rewardType)) {
      shareDividend += rewardEth;
    }

    if (reward.status === "PENDING") {
      exchangeable += rewardEth;
    }

    if (reward.status === "EXCHANGED") {
      withdrawable += rewardUsd;
    }

    if (reward.status === "WITHDRAWN") {
      totalClaimed += rewardUsd;
    }
  }

  return {
    exchangeable: toEthString(exchangeable),
    withdrawable,
    totalRewards: toEthString(totalRewards),
    totalClaimed,
    shareDividend: toEthString(shareDividend),
  };
};

module.exports = {
  getRewardSummary,
};
