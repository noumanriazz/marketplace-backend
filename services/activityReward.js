const mongoose = require("mongoose");
const ActivityReward = require("../models/ActivityReward");
const User = require("../models/User");
const { createNotification } = require("./notification");
const { triggerPusherEvent } = require("../utils/pusher");
const { toEthString } = require("../utils/ethString");
const {
  verifyUsdtTransfer,
  getClaimConfig,
} = require("./blockchain");

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
  txHash: reward.txHash || null,
  claimedAt: reward.claimedAt || null,
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
 * Claims an Activity Reward after verifying the on-chain USDT transfer.
 *
 * @param {object} user
 * @param {string} activityRewardId
 * @param {string} txHash
 * @returns {Promise<object>}
 */
const claimActivityReward = async (user, activityRewardId, txHash) => {
  if (!user || !user._id || !user.walletAddress) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(activityRewardId)) {
    const error = new Error("Invalid activity reward id.");
    error.statusCode = 400;
    throw error;
  }

  if (!txHash || typeof txHash !== "string" || !txHash.trim()) {
    const error = new Error("Transaction hash is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedTxHash = txHash.trim().toLowerCase();

  const existingTx = await ActivityReward.findOne({
    txHash: normalizedTxHash,
  });

  if (existingTx) {
    const error = new Error("Transaction has already been used.");
    error.statusCode = 400;
    throw error;
  }

  const reward = await ActivityReward.findById(activityRewardId);

  if (!reward) {
    const error = new Error("Activity reward not found.");
    error.statusCode = 404;
    throw error;
  }

  if (String(reward.userId) !== String(user._id)) {
    const error = new Error("Activity reward does not belong to this user.");
    error.statusCode = 403;
    throw error;
  }

  if (reward.isClaimed || reward.status === "Claimed") {
    const error = new Error("Activity reward has already been claimed.");
    error.statusCode = 400;
    throw error;
  }

  if (reward.status !== "Pending") {
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

  let claimConfig;

  try {
    claimConfig = getClaimConfig();
  } catch (configError) {
    console.error("Claim config error:", configError.message);
    const error = new Error("Transaction verification failed.");
    error.statusCode = 500;
    throw error;
  }

  const verification = await verifyUsdtTransfer({
    txHash: normalizedTxHash,
    expectedFrom: user.walletAddress,
    expectedTo: claimConfig.adminWalletAddress,
    expectedAmount: reward.requiredAmount,
  });

  if (!verification.success) {
    const error = new Error(
      verification.message || "Transaction verification failed."
    );
    error.statusCode = 400;
    throw error;
  }

  reward.status = "Claimed";
  reward.isClaimed = true;
  reward.txHash = normalizedTxHash;
  reward.claimedAt = new Date();
  await reward.save();

  return mapActivityReward(reward);
};

module.exports = {
  sendActivityReward,
  getCurrentActivityReward,
  claimActivityReward,
  isRewardExpired,
};
