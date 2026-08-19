const {
  getSettings,
  updateAdminWalletAddress,
} = require("../services/settings");

const getAdminSettings = async (req, res) => {
  try {
    const settings = await getSettings();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Admin get settings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching settings",
    });
  }
};

const updateAdminWallet = async (req, res) => {
  try {
    const { adminWalletAddress } = req.body;

    if (!adminWalletAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address.",
      });
    }

    const settings = await updateAdminWalletAddress(adminWalletAddress);

    return res.status(200).json({
      success: true,
      message: "Admin wallet address updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("Admin update wallet error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating admin wallet address",
    });
  }
};

module.exports = {
  getAdminSettings,
  updateAdminWallet,
};
