const express = require("express");
const {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} = require("../controllers/adminNotification");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getAdminNotifications);
router.patch("/read-all", protectAdmin, markAllAdminNotificationsAsRead);
router.patch("/:id/read", protectAdmin, markAdminNotificationAsRead);

module.exports = router;
