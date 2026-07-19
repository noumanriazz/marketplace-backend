const { getAccountSummary } = require("../services/account");
const { exchangeReward: exchangeRewardService } = require("../services/exchange");
const { withdrawReward: withdrawRewardService } = require("../services/withdraw");

const getAccount = async (req, res) => {
  try {
    const account = await getAccountSummary(req.user);

    return res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    console.error("Get account error:", error.message);

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "ETH_RPC_URL is not configured") {
      return res.status(500).json({
        success: false,
        message: "Blockchain RPC is not configured",
      });
    }

    if (error.message === "Invalid wallet address") {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address",
      });
    }

    if (error.code === "RPC_ERROR") {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch balance from Ethereum RPC",
        error: error.message,
      });
    }

    if (error.code === "PRICE_ERROR") {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch current ETH price",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching account",
    });
  }
};

const exchangeReward = async (req, res) => {
  try {
    const exchange = await exchangeRewardService(req.user);

    return res.status(200).json({
      success: true,
      message: "Reward exchanged successfully.",
      exchange,
    });
  } catch (error) {
    console.error("Exchange reward error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "PRICE_ERROR") {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch current ETH price",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while exchanging reward",
    });
  }
};

const withdrawReward = async (req, res) => {
  try {
    const withdraw = await withdrawRewardService(req.user);

    return res.status(200).json({
      success: true,
      message: "Withdrawal request completed.",
      withdraw,
    });
  } catch (error) {
    console.error("Withdraw reward error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while withdrawing reward",
    });
  }
};

module.exports = {
  getAccount,
  exchangeReward,
  withdrawReward,
};
