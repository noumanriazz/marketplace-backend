const Reward = require("../models/Reward");
const Withdraw = require("../models/Withdraw");
const { getRewardSummary } = require("./rewardSummary");
const { createNotification } = require("./notification");
const { triggerPusherEvent } = require("../utils/pusher");
const { toEthString } = require("../utils/ethString");
const { minimumWithdrawUsdt } = require("../config/withdraw");

const EPSILON = 1e-8;

/**
 * Sum of Pending withdrawal requests for a user.
 * @param {string|object} userId
 * @returns {Promise<number>}
 */
const getPendingWithdrawTotal = async (userId) => {
  const pending = await Withdraw.find({ userId, status: "Pending" }).select(
    "amount"
  );

  return pending.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
};

/**
 * Available withdrawable USDT after pending withdrawal requests.
 * @param {string|object} userId
 * @returns {Promise<number>}
 */
const getAvailableWithdrawBalance = async (userId) => {
  const summary = await getRewardSummary(userId);
  const withdrawable = Number(summary.withdrawable) || 0;
  const pendingTotal = await getPendingWithdrawTotal(userId);

  return Math.max(withdrawable - pendingTotal, 0);
};

/**
 * Marks EXCHANGED rewards as WITHDRAWN for a specific USDT amount (FIFO).
 * Used only when admin marks a withdrawal as Completed.
 *
 * @param {string|object} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
const settleExchangedRewards = async (userId, amount) => {
  const exchangedRewards = await Reward.find({
    userId,
    status: "EXCHANGED",
  }).sort({ generatedAt: 1, createdAt: 1 });

  let remaining = Number(amount) || 0;
  const bulkOps = [];
  const splitDocs = [];

  for (const reward of exchangedRewards) {
    if (remaining <= EPSILON) {
      break;
    }

    const rewardUsd = Number(reward.rewardUsd) || 0;

    if (rewardUsd <= EPSILON) {
      continue;
    }

    if (rewardUsd <= remaining + EPSILON) {
      bulkOps.push({
        updateOne: {
          filter: { _id: reward._id },
          update: { $set: { status: "WITHDRAWN" } },
        },
      });
      remaining -= rewardUsd;
    } else {
      const withdrawnUsd = remaining;
      const leftoverUsd = rewardUsd - withdrawnUsd;
      const ratio = withdrawnUsd / rewardUsd;
      const rewardEth = Number(reward.rewardEth) || 0;
      const withdrawnEth = rewardEth * ratio;
      const leftoverEth = rewardEth - withdrawnEth;

      bulkOps.push({
        updateOne: {
          filter: { _id: reward._id },
          update: {
            $set: {
              rewardUsd: leftoverUsd,
              rewardEth: toEthString(leftoverEth),
            },
          },
        },
      });

      splitDocs.push({
        userId: reward.userId,
        walletAddress: reward.walletAddress,
        walletBalanceEth: reward.walletBalanceEth,
        walletBalanceUsd: reward.walletBalanceUsd,
        ethPrice: reward.ethPrice,
        rewardPercentage: reward.rewardPercentage,
        rewardEth: toEthString(withdrawnEth),
        rewardUsd: withdrawnUsd,
        rewardType: reward.rewardType || "mining",
        status: "WITHDRAWN",
        generatedAt: reward.generatedAt || new Date(),
      });

      remaining = 0;
    }
  }

  if (bulkOps.length) {
    await Reward.bulkWrite(bulkOps);
  }

  if (splitDocs.length) {
    await Reward.insertMany(splitDocs);
  }
};

/**
 * Creates a Pending withdrawal request and notifies admin via Pusher.
 *
 * @param {object} user
 * @param {number} amount
 * @returns {Promise<object>}
 */
const createWithdrawRequest = async (user, amount) => {
  if (!user || !user._id || !user.walletAddress) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const available = await getAvailableWithdrawBalance(user._id);

  if (amount > available + EPSILON) {
    const error = new Error("Insufficient withdrawable balance.");
    error.statusCode = 400;
    throw error;
  }

  const withdraw = await Withdraw.create({
    userId: user._id,
    walletAddress: user.walletAddress,
    amount,
    status: "Pending",
  });

  const shortWallet = `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;
  const title = "New Withdrawal Request";
  const message = `${shortWallet} requested a withdrawal of ${amount} USDT.`;

  await createNotification({
    title,
    message,
    type: "withdraw",
    referenceId: withdraw._id,
  });

  try {
    await triggerPusherEvent("admin-dashboard", "withdraw-request-created", {
      type: "withdraw",
      withdrawId: String(withdraw._id),
      userName: shortWallet,
      amount,
      walletAddress: user.walletAddress,
      createdAt: withdraw.createdAt,
    });
  } catch (pusherError) {
    console.error("Pusher withdraw event error:", pusherError.message);
  }

  return {
    id: withdraw._id,
    walletAddress: withdraw.walletAddress,
    amount: withdraw.amount,
    status: withdraw.status,
    createdAt: withdraw.createdAt,
  };
};

module.exports = {
  createWithdrawRequest,
  getAvailableWithdrawBalance,
  getPendingWithdrawTotal,
  settleExchangedRewards,
  minimumWithdrawUsdt,
};
