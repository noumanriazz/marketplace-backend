const mongoose = require("mongoose");
const Reward = require("../models/Reward");
const MiningOrder = require("../models/MiningOrder");
const User = require("../models/User");
const { getEthBalance } = require("./blockchain");
const { getEthPrice } = require("./ethPrice");
const {
  calculateDailyReward,
  calculateSixHourReward,
  convertEthToUsd,
  convertUsdToEth,
} = require("../utils/reward");
const { rewardIntervalHours } = require("../config/mining");
const { toEthString } = require("../utils/ethString");

/**
 * Maps a Reward document to the mining reward API response.
 * @param {object} reward
 * @returns {object}
 */
const mapMiningReward = (reward) => ({
  _id: reward._id,
  miningOrderId: reward.miningOrderId,
  rewardType: reward.rewardType,
  rewardUsd: reward.rewardUsd,
  rewardEth: toEthString(reward.rewardEth),
  status: reward.status,
  generatedAt: reward.generatedAt,
});

/**
 * Returns the current UTC 6-hour reward interval.
 * Periods: 00:00-06:00, 06:00-12:00, 12:00-18:00, 18:00-00:00 (UTC).
 *
 * @param {Date} [now]
 * @returns {{ intervalStart: Date, intervalEnd: Date }}
 */
const getCurrentRewardInterval = (now = new Date()) => {
  const current = new Date(now);
  const intervalMs = rewardIntervalHours * 60 * 60 * 1000;
  const startHour =
    Math.floor(current.getUTCHours() / rewardIntervalHours) *
    rewardIntervalHours;

  const intervalStart = new Date(
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
      startHour,
      0,
      0,
      0
    )
  );

  return {
    intervalStart,
    intervalEnd: new Date(intervalStart.getTime() + intervalMs),
  };
};

/**
 * Generates one mining reward for an Active MiningOrder in the current interval.
 * Uses snapshot price/yield from the order, not the live MiningMachine.
 *
 * @param {string} orderId
 * @param {object} [user] - Authenticated user; when provided, order must belong to them
 * @returns {Promise<object>}
 */
const generateMiningReward = async (orderId, user) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Mining order not found.");
    error.statusCode = 404;
    throw error;
  }

  const order = await MiningOrder.findById(orderId);

  if (!order) {
    const error = new Error("Mining order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user && String(order.userId) !== String(user._id)) {
    const error = new Error("Mining order not found.");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();

  if (order.status !== "Active" || now < new Date(order.startedAt)) {
    const error = new Error("Mining order is not active.");
    error.statusCode = 400;
    throw error;
  }

  if (now >= new Date(order.expiresAt)) {
    const error = new Error("Mining order has expired.");
    error.statusCode = 400;
    throw error;
  }

  const { intervalStart } = getCurrentRewardInterval(now);

  const existingReward = await Reward.findOne({
    miningOrderId: order._id,
    rewardIntervalStart: intervalStart,
  });

  if (existingReward) {
    const error = new Error(
      "Mining reward already generated for this interval."
    );
    error.statusCode = 400;
    throw error;
  }

  const owner =
    user && String(user._id) === String(order.userId)
      ? user
      : await User.findById(order.userId);

  if (!owner || !owner.walletAddress) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  let walletBalanceEth;

  try {
    walletBalanceEth = await getEthBalance(owner.walletAddress);
  } catch (balanceError) {
    console.error("Mining reward balance error:", balanceError.message);
    const error = new Error("Failed to fetch wallet ETH balance.");
    error.statusCode = 500;
    throw error;
  }

  let ethPrice;

  try {
    ethPrice = await getEthPrice();
  } catch (priceError) {
    console.error("Mining reward price error:", priceError.message);
    const error = new Error("Failed to fetch current ETH price.");
    error.statusCode = 500;
    throw error;
  }

  const dailyRewardUsd = calculateDailyReward(
    order.priceUsdt,
    order.dailyYieldPercentage
  );
  const sixHourRewardUsd = calculateSixHourReward(dailyRewardUsd);
  const sixHourRewardEth = convertUsdToEth(sixHourRewardUsd, ethPrice);

  if (sixHourRewardUsd <= 0 || sixHourRewardEth <= 0) {
    const error = new Error("No mining reward available for this order.");
    error.statusCode = 400;
    throw error;
  }

  const walletBalanceUsd = convertEthToUsd(walletBalanceEth, ethPrice);

  const stillActive = await MiningOrder.findOne({
    _id: order._id,
    status: "Active",
    startedAt: { $lte: new Date() },
    expiresAt: { $gt: new Date() },
  }).select("_id");

  if (!stillActive) {
    const error = new Error("Mining order is not active.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const reward = await Reward.create({
      userId: order.userId,
      walletAddress: owner.walletAddress,
      walletBalanceEth: toEthString(walletBalanceEth),
      walletBalanceUsd,
      ethPrice,
      rewardPercentage: order.dailyYieldPercentage,
      rewardEth: toEthString(sixHourRewardEth),
      rewardUsd: sixHourRewardUsd,
      rewardType: "mining",
      miningOrderId: order._id,
      rewardIntervalStart: intervalStart,
      status: "PENDING",
      generatedAt: now,
    });

    return mapMiningReward(reward);
  } catch (saveError) {
    if (saveError && saveError.code === 11000) {
      const error = new Error(
        "Mining reward already generated for this interval."
      );
      error.statusCode = 400;
      throw error;
    }

    throw saveError;
  }
};

module.exports = {
  generateMiningReward,
  getCurrentRewardInterval,
  mapMiningReward,
};
