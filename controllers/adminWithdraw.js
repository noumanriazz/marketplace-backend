const {
  getWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
  ALLOWED_STATUSES,
} = require("../services/adminWithdraw");

const getAdminWithdraws = async (req, res) => {
  try {
    const data = await getWithdrawals({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get withdraws error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching withdrawals",
    });
  }
};

const getAdminWithdrawById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal id.",
      });
    }

    const data = await getWithdrawalById(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get withdraw error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching withdrawal",
    });
  }
};

const updateAdminWithdrawStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal id.",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required.",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: Completed, Rejected.",
      });
    }

    const data = await updateWithdrawalStatus(id, status);

    return res.status(200).json({
      success: true,
      message: `Withdrawal marked as ${status}.`,
      data,
    });
  } catch (error) {
    console.error("Admin update withdraw status error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating withdrawal status",
    });
  }
};

module.exports = {
  getAdminWithdraws,
  getAdminWithdrawById,
  updateAdminWithdrawStatus,
};
