const Notification = require("../models/Notification");

/**
 * Creates an admin notification.
 *
 * @param {{ title: string, message: string, type: string, referenceId?: object|string|null }} data
 * @returns {Promise<object>}
 */
const createNotification = async ({
  title,
  message,
  type,
  referenceId = null,
}) => {
  return Notification.create({
    title,
    message,
    type,
    referenceId,
    isRead: false,
  });
};

module.exports = {
  createNotification,
};
