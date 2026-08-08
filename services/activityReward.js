const mongoose = require("mongoose");
const ActivityReward = require("../models/ActivityReward");
const User = require("../models/User");
const { createNotification } = require("./notification");
const { triggerPusherEvent } = require("../utils/pusher");
const { toEthString } = require("../utils/ethString");

/**
 * Returns true when the reward countdown has expired.
 * @param {object} reward
 * @returns {boolean}
 */
const isRewardExpired = (reward) => {
  if (!reward?.createdAt || !reward?.countdownDays) {
    return false;
  }

  const expiresAt = new Date(reward.createdAt);
  expiresAt.setDate(expiresAt.getDate() + Number(reward.countdownDays));

  return new Date() > expiresAt;
};

/**
 * Maps an ActivityReward document for API responses.
 * @param {object} reward
 * @returns {object}
 */
const mapActivityReward = (reward) => ({
  _id: reward._id,
  userId: reward.userId,
  title: reward.title,
  standardAmount: reward.standardAmount,
  rewardEth: toEthString(reward.rewardEth),
  walletBalanceUsdt: reward.walletBalanceUsdt,
  requiredAmount: reward.requiredAmount,
  countdownDays: reward.countdownDays,
  status: reward.status,
  isClaimed: reward.isClaimed,
  createdAt: reward.createdAt,
  updatedAt: reward.updatedAt,
});

/**
 * Sends an Activity Reward to a user and notifies them.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
const sendActivityReward = async (payload) => {
  const {
    userId,
    title,
    message,
    standardAmount,
    rewardEth,
    walletBalanceUsdt,
    requiredAmount,
    countdownDays,
  } = payload;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user id.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select("_id");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const existingReward = await ActivityReward.findOne({
    userId: user._id,
    status: "Pending",
    isClaimed: false,
  });

  if (existingReward && !isRewardExpired(existingReward)) {
    const error = new Error("User already has an active activity reward.");
    error.statusCode = 400;
    throw error;
  }

  if (existingReward && isRewardExpired(existingReward)) {
    existingReward.status = "Expired";
    await existingReward.save();
  }

  const activityReward = await ActivityReward.create({
    userId: user._id,
    title: String(title).trim(),
    standardAmount: Number(standardAmount),
    rewardEth: toEthString(rewardEth),
    walletBalanceUsdt: Number(walletBalanceUsdt),
    requiredAmount: Number(requiredAmount),
    countdownDays: Number(countdownDays),
    status: "Pending",
    isClaimed: false,
  });

  await createNotification({
    userId: user._id,
    title: activityReward.title,
    message: String(message).trim(),
    type: "activity_reward",
    referenceId: activityReward._id,
  });

  try {
    await triggerPusherEvent(`user-${user._id}`, "new-notification", {
      refresh: true,
    });
  } catch (pusherError) {
    console.error("Pusher activity reward event error:", pusherError.message);
  }

  return mapActivityReward(activityReward);
};

/**
 * Returns the current pending Activity Reward for a user.
 *
 * @param {string|object} userId
 * @returns {Promise<object|null>}
 */
const getCurrentActivityReward = async (userId) => {
  const reward = await ActivityReward.findOne({
    userId,
    status: "Pending",
    isClaimed: false,
  }).sort({ createdAt: -1 });

  if (!reward) {
    return null;
  }

  if (isRewardExpired(reward)) {
    reward.status = "Expired";
    await reward.save();
    return null;
  }

  return mapActivityReward(reward);
};

/**
 * Validates that a pending Activity Reward exists for claim.
 * Blockchain settlement will be added later.
 *
 * @param {string|object} userId
 * @returns {Promise<object>}
 */
const claimActivityReward = async (userId) => {
  const reward = await ActivityReward.findOne({
    userId,
    status: "Pending",
    isClaimed: false,
  }).sort({ createdAt: -1 });

  if (!reward) {
    const error = new Error("No activity reward available to claim.");
    error.statusCode = 404;
    throw error;
  }

  if (String(reward.userId) !== String(userId)) {
    const error = new Error("Activity reward does not belong to this user.");
    error.statusCode = 403;
    throw error;
  }

  if (reward.isClaimed || reward.status !== "Pending") {
    const error = new Error("Activity reward is not available to claim.");
    error.statusCode = 400;
    throw error;
  }

  if (isRewardExpired(reward)) {
    reward.status = "Expired";
    await reward.save();

    const error = new Error("Activity reward has expired.");
    error.statusCode = 400;
    throw error;
  }

  return mapActivityReward(reward);
};

module.exports = {
  sendActivityReward,
  getCurrentActivityReward,
  claimActivityReward,
  isRewardExpired,
};
