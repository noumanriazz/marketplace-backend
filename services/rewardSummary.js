const Reward = require("../models/Reward");

/**
 * Builds reward balance totals from the Reward ledger.
 * Does not read exchangeable/withdrawable from the User model.
 *
 * @param {string|object} userId
 * @returns {Promise<{
 *   exchangeable: number,
 *   withdrawable: number,
 *   totalRewards: number,
 *   totalClaimed: number
 * }>}
 */
const getRewardSummary = async (userId) => {
  const rewards = await Reward.find({ userId }).select(
    "status rewardEth rewardUsd"
  );

  let exchangeable = 0;
  let withdrawable = 0;
  let totalRewards = 0;
  let totalClaimed = 0;

  for (const reward of rewards) {
    const rewardEth = Number(reward.rewardEth) || 0;
    const rewardUsd = Number(reward.rewardUsd) || 0;

    totalRewards += rewardEth;

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
    exchangeable,
    withdrawable,
    totalRewards,
    totalClaimed,
  };
};

module.exports = {
  getRewardSummary,
};
