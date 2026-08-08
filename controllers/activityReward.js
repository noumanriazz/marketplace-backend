const {
  getCurrentActivityReward,
  claimActivityReward,
} = require("../services/activityReward");

const getActivityReward = async (req, res) => {
  try {
    const reward = await getCurrentActivityReward(req.user._id);

    return res.status(200).json({
      success: true,
      reward,
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
    await claimActivityReward(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Activity reward claim validated successfully.",
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
