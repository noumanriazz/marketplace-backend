const Reward = require("../models/Reward");
const { getRewardSummary } = require("./rewardSummary");

/**
 * Withdraws all exchanged rewards.
 *
 * @param {object} user
 * @returns {Promise<object>}
 */
const withdrawReward = async (user) => {
  if (!user || !user._id) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const exchangedRewards = await Reward.find({
    userId: user._id,
    status: "EXCHANGED",
  });

  if (!exchangedRewards.length) {
    const error = new Error("No withdrawable balance available.");
    error.statusCode = 400;
    throw error;
  }

  const withdrawnUsd = exchangedRewards.reduce(
    (sum, reward) => sum + (Number(reward.rewardUsd) || 0),
    0
  );

  if (withdrawnUsd <= 0) {
    const error = new Error("No withdrawable balance available.");
    error.statusCode = 400;
    throw error;
  }

  await Reward.updateMany(
    { userId: user._id, status: "EXCHANGED" },
    { $set: { status: "WITHDRAWN" } }
  );

  const summary = await getRewardSummary(user._id);

  return {
    withdrawnUsd,
    exchangeable: summary.exchangeable,
    withdrawable: summary.withdrawable,
  };
};

module.exports = {
  withdrawReward,
};
