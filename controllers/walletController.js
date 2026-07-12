const { getEthBalance } = require("../utils/blockchain");

const getBalance = async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address not found for authenticated user",
      });
    }

    const balance = await getEthBalance(walletAddress);

    return res.status(200).json({
      success: true,
      walletAddress,
      balance,
      symbol: "ETH",
    });
  } catch (error) {
    console.error("Get balance error:", error.message);

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
      message: "Server error while fetching wallet balance",
    });
  }
};

module.exports = { getBalance };
