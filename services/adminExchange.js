const mongoose = require("mongoose");
const Reward = require("../models/Reward");
const { toEthString } = require("../utils/ethString");

/**
 * Maps a Reward document to an admin exchange list item.
 * @param {object} reward
 * @returns {object}
 */
const mapExchangeListItem = (reward) => ({
  _id: reward._id,
  walletAddress: reward.walletAddress,
  rewardEth: toEthString(reward.rewardEth),
  rewardUsd: reward.rewardUsd,
  ethPrice: reward.ethPrice,
  rewardPercentage: reward.rewardPercentage,
  status: reward.status,
  createdAt: reward.createdAt,
});

/**
 * Maps a Reward document to full admin exchange details.
 * @param {object} reward
 * @returns {object}
 */
const mapExchangeDetail = (reward) => ({
  _id: reward._id,
  walletAddress: reward.walletAddress,
  walletBalanceEth: toEthString(reward.walletBalanceEth),
  walletBalanceUsd: reward.walletBalanceUsd,
  rewardEth: toEthString(reward.rewardEth),
  rewardUsd: reward.rewardUsd,
  rewardPercentage: reward.rewardPercentage,
  ethPrice: reward.ethPrice,
  status: reward.status,
  generatedAt: reward.generatedAt,
  createdAt: reward.createdAt,
  updatedAt: reward.updatedAt,
});

/**
 * Returns paginated EXCHANGED reward records for admin.
 *
 * @param {{
 *   page?: number|string,
 *   limit?: number|string,
 *   search?: string,
 *   status?: string
 * }} options
 * @returns {Promise<object>}
 */
const getExchanges = async (options = {}) => {
  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 10;

  const filter = {
    status: "EXCHANGED",
  };

  if (options.status && String(options.status).trim()) {
    const status = String(options.status).trim().toUpperCase();

    if (status !== "EXCHANGED") {
      return {
        records: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  if (options.search && String(options.search).trim()) {
    filter.walletAddress = {
      $regex: String(options.search).trim(),
      $options: "i",
    };
  }

  const total = await Reward.countDocuments(filter);
  const rewards = await Reward.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    records: rewards.map(mapExchangeListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Returns a single EXCHANGED reward for admin.
 *
 * @param {string} exchangeId
 * @returns {Promise<object>}
 */
const getExchangeById = async (exchangeId) => {
  if (!mongoose.Types.ObjectId.isValid(exchangeId)) {
    const error = new Error("Invalid exchange id.");
    error.statusCode = 400;
    throw error;
  }

  const reward = await Reward.findOne({
    _id: exchangeId,
    status: "EXCHANGED",
  });

  if (!reward) {
    const error = new Error("Exchange not found.");
    error.statusCode = 404;
    throw error;
  }

  return mapExchangeDetail(reward);
};

module.exports = {
  getExchanges,
  getExchangeById,
};
