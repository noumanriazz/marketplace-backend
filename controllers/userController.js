const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        chainId: user.chainId,
        exchangeable: user.exchangeable ?? 0,
        withdrawable: user.withdrawable ?? 0,
        lastRewardTime: user.lastRewardTime ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user profile",
    });
  }
};

module.exports = { getProfile };
