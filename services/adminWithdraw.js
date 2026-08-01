const mongoose = require("mongoose");
const Withdraw = require("../models/Withdraw");
const { settleExchangedRewards } = require("./withdrawRequest");

const ALLOWED_STATUSES = ["Completed", "Rejected"];

/**
 * Returns paginated withdrawal requests for admin.
 *
 * @param {{ page?: number|string, limit?: number|string, status?: string, search?: string }} options
 * @returns {Promise<object>}
 */
const getWithdrawals = async (options = {}) => {
  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 10;

  const filter = {};

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search && String(options.search).trim()) {
    const search = String(options.search).trim();
    filter.walletAddress = { $regex: search, $options: "i" };
  }

  const total = await Withdraw.countDocuments(filter);
  const withdrawals = await Withdraw.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("userId", "walletAddress referralCode createdAt");

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Returns a single withdrawal for admin.
 *
 * @param {string} withdrawId
 * @returns {Promise<object>}
 */
const getWithdrawalById = async (withdrawId) => {
  if (!mongoose.Types.ObjectId.isValid(withdrawId)) {
    const error = new Error("Invalid withdrawal id.");
    error.statusCode = 400;
    throw error;
  }

  const withdraw = await Withdraw.findById(withdrawId).populate(
    "userId",
    "walletAddress referralCode createdAt lastIpAddress"
  );

  if (!withdraw) {
    const error = new Error("Withdrawal not found.");
    error.statusCode = 404;
    throw error;
  }

  return withdraw;
};

/**
 * Updates a Pending withdrawal status to Completed or Rejected.
 *
 * @param {string} withdrawId
 * @param {string} status
 * @returns {Promise<object>}
 */
const updateWithdrawalStatus = async (withdrawId, status) => {
  if (!mongoose.Types.ObjectId.isValid(withdrawId)) {
    const error = new Error("Invalid withdrawal id.");
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    const error = new Error("Invalid status. Allowed: Completed, Rejected.");
    error.statusCode = 400;
    throw error;
  }

  const withdraw = await Withdraw.findById(withdrawId);

  if (!withdraw) {
    const error = new Error("Withdrawal not found.");
    error.statusCode = 404;
    throw error;
  }

  if (withdraw.status !== "Pending") {
    const error = new Error("Only Pending withdrawals can be updated.");
    error.statusCode = 400;
    throw error;
  }

  if (status === "Completed") {
    await settleExchangedRewards(withdraw.userId, withdraw.amount);
  }

  withdraw.status = status;
  await withdraw.save();

  return withdraw;
};

module.exports = {
  getWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
  ALLOWED_STATUSES,
};
