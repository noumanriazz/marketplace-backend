const {
  getCurrentActivityReward,
  claimActivityReward,
} = require("../services/activityReward");
const { getClaimConfig } = require("../services/blockchain");

const getActivityReward = async (req, res) => {
  try {
    const reward = await getCurrentActivityReward(req.user._id);

    let claimConfig = null;

    try {
      claimConfig = getClaimConfig();
    } catch (configError) {
      console.error("Claim config error:", configError.message);
    }

    return res.status(200).json({
      success: true,
      reward,
      claimConfig,
    });
  } catch (error) {
    console.error("Get activity reward error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching activity reward",
    });
  }
};

const claimUserActivityReward = async (req, res) => {
  try {
    const { activityRewardId, txHash } = req.body;

    if (!activityRewardId) {
      return res.status(400).json({
        success: false,
        message: "Activity reward id is required.",
      });
    }

    if (!txHash) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash is required.",
      });
    }

    await claimActivityReward(req.user, activityRewardId, txHash);

    return res.status(200).json({
      success: true,
      message: "Activity reward claimed successfully.",
    });
  } catch (error) {
    console.error("Claim activity reward error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while claiming activity reward",
    });
  }
};

module.exports = {
  getActivityReward,
  claimUserActivityReward,
};
