const Reward = require("../models/Reward");
const User = require("../models/User");
const { getEthBalance } = require("./blockchain");
const { getEthPrice } = require("./ethPrice");
const { getMiningStatus } = require("./mining");
const { calculateReward } = require("./reward");
const { REFERRAL_PERCENTAGE } = require("../config/reward");
const { toEthString } = require("../utils/ethString");

const MIN_BALANCE_SKIP_MESSAGE =
  "Reward skipped because minimum balance requirement is not met.";

/**
 * Creates a referral reward for the referrer when a referred user earns mining rewards.
 *
 * @param {object} minerUser
 * @param {object} miningReward
 * @param {number} ethPrice
 * @returns {Promise<object|null>}
 */
const createReferralReward = async (minerUser, miningReward, ethPrice) => {
  if (!minerUser?.referredBy) {
    return null;
  }

  const referrer = await User.findById(minerUser.referredBy);

  if (!referrer) {
    return null;
  }

  const referralEth =
    (Number(miningReward.rewardEth) || 0) * (REFERRAL_PERCENTAGE / 100);
  const referralUsd =
    (Number(miningReward.rewardUsd) || 0) * (REFERRAL_PERCENTAGE / 100);

  if (referralEth <= 0) {
    return null;
  }

  return Reward.create({
    userId: referrer._id,
    walletAddress: referrer.walletAddress,
    walletBalanceEth: toEthString(miningReward.walletBalanceEth),
    walletBalanceUsd: miningReward.walletBalanceUsd,
    ethPrice,
    rewardPercentage: REFERRAL_PERCENTAGE,
    rewardEth: toEthString(referralEth),
    rewardUsd: referralUsd,
    rewardType: "referral",
    status: "PENDING",
    generatedAt: new Date(),
  });
};

/**
 * Generates a mining reward for a user and stores it in the Reward ledger.
 * If the user was referred, also credits the referrer with a referral reward.
 * Always uses the user's current LIVE Ethereum wallet balance.
 *
 * @param {object} user - User document
 * @returns {Promise<{success: boolean, skipped?: boolean, reward?: object, referralReward?: object, message?: string}>}
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
        `⚠️  ${MIN_BALANCE_SKIP_MESSAGE} Wallet: ${walletAddress}, Balance: ${walletBalanceEth}`,
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
        walletBalanceEth: toEthString(rewardResult.walletBalanceEth),
        walletBalanceUsd: rewardResult.walletBalanceUsd,
        ethPrice,
        rewardPercentage: rewardResult.rewardPercentage,
        rewardUsd: rewardResult.sixHourRewardUsd,
        rewardEth: toEthString(rewardResult.sixHourRewardEth),
        rewardType: "mining",
        status: "PENDING",
        generatedAt: new Date(),
      });

      let referralReward = null;

      try {
        const minerUser = await User.findById(user._id).select("referredBy");
        referralReward = await createReferralReward(
          minerUser,
          reward,
          ethPrice,
        );

        if (referralReward) {
          console.log(
            `✅ Referral reward created for referrer of ${walletAddress}`,
          );
        }
      } catch (referralError) {
        console.error("Referral reward creation error:", referralError.message);
      }

      return {
        success: true,
        reward,
        referralReward,
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
  createReferralReward,
};
