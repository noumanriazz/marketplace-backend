const Reward = require("../models/Reward");

const formatUsdt = (amount) => `${Number(amount) || 0} USDT`;

/**
 * Paginated withdrawal history from WITHDRAWN reward ledger rows.
 * Used by Account Records (type=withdraw).
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
  getWithdrawalRecords,
};
