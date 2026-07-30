const User = require("../models/User");
const Reward = require("../models/Reward");
const { minimumEthBalance } = require("../config/mining");
const { toEthString } = require("../utils/ethString");

const ACTIVE_LOGIN_DAYS = 30;

/**
 * Sums rewardEth (stored as string) for an optional status filter.
 * @param {object} [match]
 * @returns {Promise<string>}
 */
const sumRewardEth = async (match = {}) => {
  const result = await Reward.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $convert: {
              input: "$rewardEth",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
  ]);

  return toEthString(result[0]?.total || 0);
};

/**
 * Counts unique users whose latest reward snapshot meets the mining minimum.
 * @returns {Promise<number>}
 */
const countRunningMiners = async () => {
  const result = await Reward.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$userId",
        walletBalanceEth: { $first: "$walletBalanceEth" },
      },
    },
    {
      $project: {
        balance: {
          $convert: {
            input: "$walletBalanceEth",
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    {
      $match: {
        balance: { $gte: minimumEthBalance },
      },
    },
    {
      $count: "running",
    },
  ]);

  return result[0]?.running || 0;
};

/**
 * Builds the admin dashboard summary.
 * @returns {Promise<object>}
 */
const getDashboardSummary = async () => {
  const activeSince = new Date();
  activeSince.setDate(activeSince.getDate() - ACTIVE_LOGIN_DAYS);

  const [
    totalUsers,
    activeUsers,
    runningMiners,
    totalRewards,
    pendingRewards,
    claimedRewards,
    pendingWithdrawals,
    approvedWithdrawals,
    totalExchanges,
    completedExchanges,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLogin: { $gte: activeSince } }),
    countRunningMiners(),
    sumRewardEth(),
    sumRewardEth({ status: "PENDING" }),
    sumRewardEth({ status: "WITHDRAWN" }),
    Reward.countDocuments({ status: "EXCHANGED" }),
    Reward.countDocuments({ status: "WITHDRAWN" }),
    Reward.countDocuments({ status: { $in: ["EXCHANGED", "WITHDRAWN"] } }),
    Reward.countDocuments({ status: { $in: ["EXCHANGED", "WITHDRAWN"] } }),
  ]);

  const inactiveUsers = Math.max(totalUsers - activeUsers, 0);
  const stoppedMiners = Math.max(totalUsers - runningMiners, 0);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    runningMiners,
    stoppedMiners,
    totalRewards,
    pendingRewards,
    claimedRewards,
    pendingWithdrawals,
    approvedWithdrawals,
    rejectedWithdrawals: 0,
    totalExchanges,
    completedExchanges,
    pendingExchanges: 0,
  };
};

module.exports = {
  getDashboardSummary,
};
