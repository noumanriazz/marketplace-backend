const User = require("../models/User");
const Reward = require("../models/Reward");
const { getEthBalance } = require("../services/blockchain");
const { getEthPrice } = require("../services/ethPrice");
const { getMiningStatus } = require("../services/mining");
const { calculateReward } = require("../services/reward");
const { convertEthToUsd } = require("../utils/reward");
const {
  minimumEthBalance,
  rewardIntervalHours,
} = require("../config/mining");

const getAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const walletAddress = user.walletAddress;
    const walletBalance = await getEthBalance(walletAddress);
    const ethPrice = await getEthPrice();
    const miningStatus = getMiningStatus(walletBalance);
    const rewardPreview = calculateReward(walletBalance, ethPrice);

    return res.status(200).json({
      success: true,
      account: {
        _id: user._id,
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        chainId: user.chainId,
        exchangeable: user.exchangeable ?? 0,
        withdrawable: user.withdrawable ?? 0,
        lastRewardTime: user.lastRewardTime ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        walletBalance,
        symbol: "ETH",
        ethPrice,
        miningStatus,
        minimumRequired: String(minimumEthBalance),
        rewardIntervalHours,
        rewardPreview: {
          walletBalanceUsd: rewardPreview.walletBalanceUsd,
          rewardPercentage: rewardPreview.rewardPercentage,
          dailyRewardUsd: rewardPreview.dailyRewardUsd,
          sixHourRewardUsd: rewardPreview.sixHourRewardUsd,
          sixHourRewardEth: rewardPreview.sixHourRewardEth,
        },
      },
    });
  } catch (error) {
    console.error("Get account error:", error.message);

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
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const exchangeable = user.exchangeable ?? 0;

    if (exchangeable <= 0) {
      return res.status(400).json({
        success: false,
        message: "No exchangeable reward available.",
      });
    }

    const ethPrice = await getEthPrice();
    const exchangedEth = exchangeable;
    const exchangedUsd = convertEthToUsd(exchangedEth, ethPrice);

    user.exchangeable = 0;
    user.withdrawable = (user.withdrawable ?? 0) + exchangedUsd;
    await user.save();

    await Reward.updateMany(
      { userId: user._id, status: "PENDING" },
      { $set: { status: "EXCHANGED" } }
    );

    return res.status(200).json({
      success: true,
      message: "Reward exchanged successfully.",
      exchange: {
        exchangedEth,
        exchangedUsd,
        ethPrice,
        exchangeable: user.exchangeable,
        withdrawable: user.withdrawable,
      },
    });
  } catch (error) {
    console.error("Exchange reward error:", error.message);

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
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const withdrawable = user.withdrawable ?? 0;

    if (withdrawable <= 0) {
      return res.status(400).json({
        success: false,
        message: "No withdrawable balance available.",
      });
    }

    const withdrawnUsd = withdrawable;

    user.withdrawable = 0;
    await user.save();

    await Reward.updateMany(
      { userId: user._id, status: "EXCHANGED" },
      { $set: { status: "WITHDRAWN" } }
    );

    return res.status(200).json({
      success: true,
      message: "Withdrawal request completed.",
      withdraw: {
        withdrawnUsd,
        exchangeable: user.exchangeable ?? 0,
        withdrawable: user.withdrawable,
      },
    });
  } catch (error) {
    console.error("Withdraw reward error:", error.message);
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
