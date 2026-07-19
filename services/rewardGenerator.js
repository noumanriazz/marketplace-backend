const Reward = require("../models/Reward");
const { getEthBalance } = require("./blockchain");
const { getEthPrice } = require("./ethPrice");
const { getMiningStatus } = require("./mining");
const { calculateReward } = require("./reward");

const MIN_BALANCE_SKIP_MESSAGE =
  "Reward skipped because minimum balance requirement is not met.";

/**
 * Generates a mining reward for a user and stores it in the Reward ledger.
 * Always uses the user's current LIVE Ethereum wallet balance.
 *
 * @param {object} user - User document
 * @returns {Promise<{success: boolean, skipped?: boolean, reward?: object, message?: string}>}
 */
const generateReward = async (user) => {
  try {
    if (!user || !user._id || !user.walletAddress) {
      return {
        success: false,
        message: "Valid user with wallet address is required.",
      };
    }

    const walletAddress = user.walletAddress;

    let walletBalanceEth;
    try {
      walletBalanceEth = await getEthBalance(walletAddress);
    } catch (error) {
      console.error("Reward generator balance error:", error.message);
      return {
        success: false,
        message: "Failed to fetch wallet ETH balance.",
        error: error.message,
      };
    }

    const miningStatus = getMiningStatus(walletBalanceEth);

    if (miningStatus === "stopped") {
      console.log(
        `⚠️  ${MIN_BALANCE_SKIP_MESSAGE} Wallet: ${walletAddress}, Balance: ${walletBalanceEth}`
      );

      return {
        success: false,
        skipped: true,
        message: MIN_BALANCE_SKIP_MESSAGE,
      };
    }

    let ethPrice;
    try {
      ethPrice = await getEthPrice();
    } catch (error) {
      console.error("Reward generator price error:", error.message);
      return {
        success: false,
        message: "Failed to fetch current ETH price.",
        error: error.message,
      };
    }

    let rewardResult;
    try {
      rewardResult = calculateReward(walletBalanceEth, ethPrice);
    } catch (error) {
      console.error("Reward generator service error:", error.message);
      return {
        success: false,
        message: "Failed to calculate reward.",
        error: error.message,
      };
    }

    if (!rewardResult || rewardResult.sixHourRewardEth <= 0) {
      return {
        success: false,
        skipped: true,
        message: "No reward available for the current wallet balance.",
      };
    }

    try {
      const reward = await Reward.create({
        userId: user._id,
        walletAddress,
        walletBalanceEth: rewardResult.walletBalanceEth,
        walletBalanceUsd: rewardResult.walletBalanceUsd,
        ethPrice,
        rewardPercentage: rewardResult.rewardPercentage,
        rewardUsd: rewardResult.sixHourRewardUsd,
        rewardEth: rewardResult.sixHourRewardEth,
        rewardType: "MINING",
        status: "PENDING",
        generatedAt: new Date(),
      });

      return {
        success: true,
        reward,
      };
    } catch (error) {
      console.error("Reward generator save error:", error.message);
      return {
        success: false,
        message: "Failed to save reward ledger record.",
        error: error.message,
      };
    }
  } catch (error) {
    console.error("Reward generator unexpected error:", error.message);
    return {
      success: false,
      message: "Unexpected error while generating reward.",
      error: error.message,
    };
  }
};

module.exports = {
  generateReward,
};
