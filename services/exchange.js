const Reward = require("../models/Reward");
const { getEthPrice } = require("./ethPrice");
const { convertEthToUsd } = require("../utils/reward");
const { getRewardSummary } = require("./rewardSummary");

const EPSILON = 1e-18;

/**
 * Exchanges a specific ETH amount from pending rewards into withdrawable USDT.
 * Uses FIFO against PENDING reward ledger records.
 *
 * @param {object} user
 * @param {number} amount - ETH amount to exchange
 * @returns {Promise<object>}
 */
const exchangeReward = async (user, amount) => {
  if (!user || !user._id) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const summary = await getRewardSummary(user._id);
  const exchangeable = Number(summary.exchangeable) || 0;

  if (exchangeable <= 0 || amount > exchangeable + EPSILON) {
    const error = new Error("Insufficient exchangeable balance.");
    error.statusCode = 400;
    throw error;
  }

  const ethPrice = await getEthPrice();
  const exchangeAmountUsdt = convertEthToUsd(amount, ethPrice);

  const pendingRewards = await Reward.find({
    userId: user._id,
    status: "PENDING",
  }).sort({ generatedAt: 1, createdAt: 1 });

  let remaining = amount;
  const bulkOps = [];
  const exchangedDocs = [];

  for (const reward of pendingRewards) {
    if (remaining <= EPSILON) {
      break;
    }

    const rewardEth = Number(reward.rewardEth) || 0;

    if (rewardEth <= EPSILON) {
      continue;
    }

    if (rewardEth <= remaining + EPSILON) {
      bulkOps.push({
        updateOne: {
          filter: { _id: reward._id },
          update: {
            $set: {
              status: "EXCHANGED",
              ethPrice,
              rewardUsd: convertEthToUsd(rewardEth, ethPrice),
            },
          },
        },
      });
      remaining -= rewardEth;
    } else {
      const exchangedEth = remaining;
      const leftoverEth = rewardEth - exchangedEth;

      bulkOps.push({
        updateOne: {
          filter: { _id: reward._id },
          update: {
            $set: {
              rewardEth: leftoverEth,
              rewardUsd: convertEthToUsd(leftoverEth, reward.ethPrice),
            },
          },
        },
      });

      exchangedDocs.push({
        userId: reward.userId,
        walletAddress: reward.walletAddress,
        walletBalanceEth: reward.walletBalanceEth,
        walletBalanceUsd: reward.walletBalanceUsd,
        ethPrice,
        rewardPercentage: reward.rewardPercentage,
        rewardEth: exchangedEth,
        rewardUsd: convertEthToUsd(exchangedEth, ethPrice),
        rewardType: reward.rewardType || "mining",
        status: "EXCHANGED",
        generatedAt: reward.generatedAt || new Date(),
      });

      remaining = 0;
    }
  }

  if (remaining > EPSILON) {
    const error = new Error("Insufficient exchangeable balance.");
    error.statusCode = 400;
    throw error;
  }

  if (bulkOps.length) {
    await Reward.bulkWrite(bulkOps);
  }

  if (exchangedDocs.length) {
    await Reward.insertMany(exchangedDocs);
  }

  const updatedSummary = await getRewardSummary(user._id);

  return {
    exchangeAmount: amount,
    exchangeAmountUsdt,
    exchangeable: updatedSummary.exchangeable,
    withdrawable: updatedSummary.withdrawable,
    ethPrice,
  };
};

module.exports = {
  exchangeReward,
};
