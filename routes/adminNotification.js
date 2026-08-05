const express = require("express");
const {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  sendAdminNotification,
} = require("../controllers/adminNotification");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getAdminNotifications);
router.post("/send", protectAdmin, sendAdminNotification);
router.patch("/read-all", protectAdmin, markAllAdminNotificationsAsRead);
router.patch("/:id/read", protectAdmin, markAdminNotificationAsRead);

module.exports = router;
