const Reward = require("../models/Reward");

const formatEth = (amount) => `${Number(amount) || 0} ETH`;

const mapStatus = (status) => {
  if (status === "PENDING") {
    return "pending";
  }

  return "success";
};

/**
 * Paginated mining or referral reward history.
 *
 * @param {string|object} userId
 * @param {"mining"|"referral"} type
 * @param {{ page: number, limit: number }} options
 * @returns {Promise<{ records: object[], totalRecords: number }>}
 */
const getRewardTypeRecords = async (userId, type, { page, limit }) => {
  const rewardTypes =
    type === "referral"
      ? ["referral", "REFERRAL"]
      : ["mining", "MINING"];

  const filter = {
    userId,
    rewardType: { $in: rewardTypes },
  };

  const totalRecords = await Reward.countDocuments(filter);
  const docs = await Reward.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const records = docs.map((doc) => ({
    id: String(doc._id),
    type,
    time: doc.createdAt ? doc.createdAt.toISOString() : null,
    payment: null,
    received: formatEth(doc.rewardEth),
    status: mapStatus(doc.status),
  }));

  return { records, totalRecords };
};

module.exports = {
  getRewardTypeRecords,
};
