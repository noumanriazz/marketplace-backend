const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { triggerPusherEvent } = require("../utils/pusher");

/**
 * Returns paginated admin notifications with unread count.
 *
 * @param {{ page?: number|string, limit?: number|string }} options
 * @returns {Promise<object>}
 */
const getNotifications = async (options = {}) => {
  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 10;

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: false }),
    Notification.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id title message type isRead createdAt"),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    unreadCount,
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Marks a single notification as read.
 *
 * @param {string} notificationId
 * @returns {Promise<object>}
 */
const markNotificationAsRead = async (notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    const error = new Error("Invalid notification id.");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    const error = new Error("Notification not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return notification;
};

/**
 * Marks all unread notifications as read.
 *
 * @returns {Promise<{ modifiedCount: number }>}
 */
const markAllNotificationsAsRead = async () => {
  const result = await Notification.updateMany(
    { isRead: false },
    { $set: { isRead: true } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

/**
 * Sends a direct notification to one user.
 *
 * @param {string} userId
 * @param {string} message
 * @returns {Promise<object>}
 */
const sendNotificationToUser = async (userId, message) => {
  const user = await User.findById(userId).select("_id");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const notification = await Notification.create({
    userId: user._id,
    message,
    type: "admin",
    isRead: false,
  });

  await triggerPusherEvent(
    `user-${user._id}`,
    "new-notification",
    { refresh: true }
  );

  return notification;
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotificationToUser,
};
