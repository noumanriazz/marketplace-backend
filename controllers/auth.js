const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

const login = async (req, res) => {
  try {
    const { walletAddress, walletType, chainId } = req.body;

    if (!walletAddress || !walletType || chainId === undefined || chainId === null) {
      return res.status(400).json({
        success: false,
        message: "walletAddress, walletType, and chainId are required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase().trim();

    let user = await User.findOne({ walletAddress: normalizedAddress });
    let isNewUser = false;

    if (user) {
      user.walletType = walletType;
      user.chainId = chainId;
      await user.save();
    } else {
      isNewUser = true;
      user = await User.create({
        walletAddress: normalizedAddress,
        walletType,
        chainId,
      });
    }

    const token = generateToken(user._id, user.walletAddress);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Wallet connected successfully."
        : "Login successful.",
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        chainId: user.chainId,
        lastRewardTime: user.lastRewardTime ?? null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

module.exports = { login };
