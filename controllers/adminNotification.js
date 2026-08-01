const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../services/adminNotification");

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

module.exports = {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
};
