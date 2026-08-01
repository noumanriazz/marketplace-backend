const express = require("express");
const {
  getAdminWithdraws,
  getAdminWithdrawById,
  updateAdminWithdrawStatus,
} = require("../controllers/adminWithdraw");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getAdminWithdraws);
router.get("/:id", protectAdmin, getAdminWithdrawById);
router.patch("/:id/status", protectAdmin, updateAdminWithdrawStatus);

module.exports = router;
