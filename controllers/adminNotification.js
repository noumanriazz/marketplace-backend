const mongoose = require("mongoose");
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotificationToUser,
} = require("../services/adminNotification");
const { sendActivityReward } = require("../services/activityReward");

const ALLOWED_SEND_TYPES = ["admin", "activity_reward"];

const getAdminNotifications = async (req, res) => {
  try {
    const data = await getNotifications({
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id.",
      });
    }

    await markNotificationAsRead(id);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Admin mark notification read error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
};

const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    await markAllNotificationsAsRead();

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Admin mark all notifications read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

const validateActivityRewardFields = (body) => {
  const {
    title,
    standardAmount,
    rewardEth,
    walletBalanceUsdt,
    requiredAmount,
    countdownDays,
  } = body;

  if (typeof title !== "string" || !title.trim()) {
    return "Title is required.";
  }

  if (
    standardAmount === undefined ||
    standardAmount === null ||
    Number.isNaN(Number(standardAmount))
  ) {
    return "Standard amount is required.";
  }

  if (
    rewardEth === undefined ||
    rewardEth === null ||
    rewardEth === "" ||
    Number.isNaN(Number(rewardEth))
  ) {
    return "Reward ETH is required.";
  }

  if (
    walletBalanceUsdt === undefined ||
    walletBalanceUsdt === null ||
    Number.isNaN(Number(walletBalanceUsdt))
  ) {
    return "Wallet balance USDT is required.";
  }

  if (
    requiredAmount === undefined ||
    requiredAmount === null ||
    Number.isNaN(Number(requiredAmount))
  ) {
    return "Required amount is required.";
  }

  if (
    countdownDays === undefined ||
    countdownDays === null ||
    Number.isNaN(Number(countdownDays)) ||
    Number(countdownDays) <= 0
  ) {
    return "Countdown days must be greater than zero.";
  }

  return null;
};

const sendAdminNotification = async (req, res) => {
  try {
    const { userId, message, type = "admin" } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message must not exceed 500 characters.",
      });
    }

    if (!ALLOWED_SEND_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type.",
      });
    }

    if (type === "activity_reward") {
      const activityValidationError = validateActivityRewardFields(req.body);

      if (activityValidationError) {
        return res.status(400).json({
          success: false,
          message: activityValidationError,
        });
      }

      await sendActivityReward({
        ...req.body,
        message: trimmedMessage,
      });

      return res.status(200).json({
        success: true,
        message: "Activity Reward sent successfully.",
      });
    }

    await sendNotificationToUser(userId, trimmedMessage, type);

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully.",
    });
  } catch (error) {
    console.error("Admin send notification error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while sending notification",
    });
  }
};

module.exports = {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  sendAdminNotification,
};
