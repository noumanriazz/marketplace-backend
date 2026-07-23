const { getExchangeRecords } = require("./exchange");
const { getWithdrawalRecords } = require("./withdraw");
const { getRewardTypeRecords } = require("./rewardRecords");

const ALLOWED_TYPES = ["exchange", "withdraw", "referral", "mining"];

/**
 * Returns paginated account records for a given type.
 *
 * @param {object} user
 * @param {string} type
 * @param {{ page?: number|string, limit?: number|string }} options
 * @returns {Promise<object>}
 */
const getAccountRecords = async (user, type, options = {}) => {
  if (!user || !user._id) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!ALLOWED_TYPES.includes(type)) {
    const error = new Error("Invalid record type.");
    error.statusCode = 400;
    throw error;
  }

  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 20;

  let result;

  if (type === "exchange") {
    result = await getExchangeRecords(user._id, { page, limit });
  } else if (type === "withdraw") {
    result = await getWithdrawalRecords(user._id, { page, limit });
  } else {
    result = await getRewardTypeRecords(user._id, type, { page, limit });
  }

  const totalPages =
    result.totalRecords === 0
      ? 0
      : Math.ceil(result.totalRecords / limit);

  return {
    records: result.records,
    pagination: {
      page,
      limit,
      totalRecords: result.totalRecords,
      totalPages,
    },
  };
};

module.exports = {
  getAccountRecords,
  ALLOWED_TYPES,
};
