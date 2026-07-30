const { getDashboardSummary } = require("../services/adminDashboard");

const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardSummary();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};
