const express = require("express");
const { getMiningPaymentConfigController } = require("../controllers/miningOrder");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Payment config for Buy Now wallet transfer (no separate pay endpoint).
router.get("/payment-config", protect, getMiningPaymentConfigController);

module.exports = router;
