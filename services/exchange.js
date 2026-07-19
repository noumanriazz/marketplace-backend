const Reward = require("../models/Reward");
const { getEthPrice } = require("./ethPrice");
const { convertEthToUsd } = require("../utils/reward");
const { getRewardSummary } = require("./rewardSummary");

/**
 * Exchanges all pending rewards into withdrawable USD.
 *
 * @param {object} user
 * @returns {Promise<object>}
 */
const exchangeReward = async (user) => {
  if (!user || !user._id) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const pendingRewards = await Reward.find({
    userId: user._id,
    status: "PENDING",
  });

  if (!pendingRewards.length) {
    const error = new Error("No exchangeable reward available.");
    error.statusCode = 400;
    throw error;
  }

  const exchangedEth = pendingRewards.reduce(
    (sum, reward) => sum + (Number(reward.rewardEth) || 0),
    0
  );

  if (exchangedEth <= 0) {
    const error = new Error("No exchangeable reward available.");
    error.statusCode = 400;
    throw error;
  }

  const ethPrice = await getEthPrice();
  const exchangedUsd = convertEthToUsd(exchangedEth, ethPrice);

  const bulkOps = pendingRewards.map((reward) => ({
    updateOne: {
      filter: { _id: reward._id },
      update: {
        $set: {
          status: "EXCHANGED",
          rewardUsd: convertEthToUsd(reward.rewardEth, ethPrice),
        },
      },
    },
  }));

  await Reward.bulkWrite(bulkOps);

  const summary = await getRewardSummary(user._id);

  return {
    exchangedEth,
    exchangedUsd,
    ethPrice,
    exchangeable: summary.exchangeable,
    withdrawable: summary.withdrawable,
  };
};

module.exports = {
  exchangeReward,
};
