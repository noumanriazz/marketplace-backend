const { getEthBalance } = require("../utils/blockchain");
const { getMiningStatus } = require("../utils/mining");
const {
  minimumEthBalance,
  rewardIntervalHours,
} = require("../config/mining");

const getStatus = async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address not found for authenticated user",
      });
    }

    const walletBalance = await getEthBalance(walletAddress);
    const status = getMiningStatus(walletBalance);

    return res.status(200).json({
      success: true,
      status,
      walletBalance,
      symbol: "ETH",
      minimumRequired: String(minimumEthBalance),
      rewardIntervalHours,
    });
  } catch (error) {
    console.error("Get mining status error:", error.message);

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

    return res.status(500).json({
      success: false,
      message: "Server error while fetching mining status",
    });
  }
};

module.exports = { getStatus };
