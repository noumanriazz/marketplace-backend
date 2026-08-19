const express = require("express");
const {
  getAdminSettings,
  updateAdminWallet,
} = require("../controllers/adminSettings");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getAdminSettings);
router.patch("/wallet", protectAdmin, updateAdminWallet);

module.exports = router;
