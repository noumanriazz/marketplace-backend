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

const formatUsdt = (amount) => `${Number(amount) || 0} USDT`;

/**
 * Paginated withdrawal history from WITHDRAWN reward ledger rows.
 *
 * @param {string|object} userId
 * @param {{ page: number, limit: number }} options
 * @returns {Promise<{ records: object[], totalRecords: number }>}
 */
const getWithdrawalRecords = async (userId, { page, limit }) => {
  const filter = {
    userId,
    status: "WITHDRAWN",
  };

  const totalRecords = await Reward.countDocuments(filter);
  const docs = await Reward.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const records = docs.map((doc) => {
    const amountUsdt = formatUsdt(doc.rewardUsd);

    return {
      id: String(doc._id),
      type: "withdraw",
      time: doc.createdAt ? doc.createdAt.toISOString() : null,
      payment: amountUsdt,
      received: amountUsdt,
      status: "success",
    };
  });

  return { records, totalRecords };
};

module.exports = {
  withdrawReward,
  getWithdrawalRecords,
};
