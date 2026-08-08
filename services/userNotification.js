const mongoose = require("mongoose");
const Notification = require("../models/Notification");

/**
 * Returns paginated notifications for a user.
 *
 * @param {string|object} userId
 * @param {{ page?: number|string, limit?: number|string }} options
 * @returns {Promise<object>}
 */
const getUserNotifications = async (userId, options = {}) => {
  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 10;

  const filter = { userId };

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id title message type referenceId isRead createdAt"),
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
 * Marks one user notification as read.
 *
 * @param {string|object} userId
 * @param {string} notificationId
 * @returns {Promise<object>}
 */
const markUserNotificationAsRead = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    const error = new Error("Invalid notification id.");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

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
 * Marks all unread notifications as read for a user.
 *
 * @param {string|object} userId
 * @returns {Promise<{ modifiedCount: number }>}
 */
const markAllUserNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

module.exports = {
  getUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
};
