const mongoose = require("mongoose");
const User = require("../models/User");
const { getEthBalance } = require("./blockchain");
const { getEthPrice } = require("./ethPrice");
const { getMiningStatus } = require("./mining");
const { getRewardSummary } = require("./rewardSummary");
const { convertEthToUsd } = require("../utils/reward");
const { toEthString } = require("../utils/ethString");

const formatMiningStatus = (status) => {
  if (status === "running") {
    return "Running";
  }

  return "Stopped";
};

/**
 * Builds admin-facing live metrics for a user.
 *
 * @param {object} user
 * @param {number} ethPrice
 * @returns {Promise<object>}
 */
const buildUserMetrics = async (user, ethPrice) => {
  let walletBalanceEth = "0";
  let walletBalanceUsdt = 0;
  let miningStatus = "Stopped";

  try {
    const balanceRaw = await getEthBalance(user.walletAddress);
    walletBalanceEth = toEthString(balanceRaw);
    walletBalanceUsdt = convertEthToUsd(balanceRaw, ethPrice);
    miningStatus = formatMiningStatus(getMiningStatus(balanceRaw));
  } catch (error) {
    console.error(
      `Admin users balance error for ${user.walletAddress}:`,
      error.message
    );
  }

  const rewardSummary = await getRewardSummary(user._id);

  return {
    walletBalanceEth,
    walletBalanceUsdt,
    miningStatus,
    exchangeable: rewardSummary.exchangeable,
    withdrawable: rewardSummary.withdrawable,
    totalRewards: rewardSummary.totalRewards,
    totalClaimed: rewardSummary.totalClaimed,
  };
};

/**
 * Returns a paginated list of users for admin.
 *
 * @param {{ page?: number|string, limit?: number|string }} options
 * @returns {Promise<object>}
 */
const getUsers = async (options = {}) => {
  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 10;

  const ethPrice = await getEthPrice();

  const total = await User.countDocuments();
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const mappedUsers = [];

  for (const user of users) {
    const metrics = await buildUserMetrics(user, ethPrice);

    mappedUsers.push({
      _id: user._id,
      walletAddress: user.walletAddress,
      walletBalanceEth: metrics.walletBalanceEth,
      walletBalanceUsdt: metrics.walletBalanceUsdt,
      miningStatus: metrics.miningStatus,
      exchangeable: metrics.exchangeable,
      withdrawable: metrics.withdrawable,
      createdAt: user.createdAt,
    });
  }

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    users: mappedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Returns a single user detail for admin.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user id.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const ethPrice = await getEthPrice();
  const metrics = await buildUserMetrics(user, ethPrice);

  return {
    _id: user._id,
    walletAddress: user.walletAddress,
    walletBalanceEth: metrics.walletBalanceEth,
    walletBalanceUsdt: metrics.walletBalanceUsdt,
    miningStatus: metrics.miningStatus,
    exchangeable: metrics.exchangeable,
    withdrawable: metrics.withdrawable,
    totalRewards: metrics.totalRewards,
    totalClaimed: metrics.totalClaimed,
    referralCode: user.referralCode || null,
    referredBy: user.referredBy || null,
    createdAt: user.createdAt,
  };
};

module.exports = {
  getUsers,
  getUserById,
};
