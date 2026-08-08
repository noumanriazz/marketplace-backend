const {
  getUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
} = require("../services/userNotification");

const getNotifications = async (req, res) => {
  try {
    const data = await getUserNotifications(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get user notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification id.",
      });
    }

    await markUserNotificationAsRead(req.user._id, id);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Mark user notification read error:", error.message);

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

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await markAllUserNotificationsAsRead(req.user._id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all user notifications read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
