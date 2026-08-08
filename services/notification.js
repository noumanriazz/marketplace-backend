const Notification = require("../models/Notification");

/**
 * Creates a notification.
 *
 * @param {{
 *   title?: string|null,
 *   message: string,
 *   type: string,
 *   referenceId?: object|string|null,
 *   userId?: object|string|null
 * }} data
 * @returns {Promise<object>}
 */
const createNotification = async ({
  title = null,
  message,
  type,
  referenceId = null,
  userId = null,
}) => {
  return Notification.create({
    title,
    message,
    type,
    referenceId,
    userId,
    isRead: false,
  });
};

module.exports = {
  createNotification,
};
