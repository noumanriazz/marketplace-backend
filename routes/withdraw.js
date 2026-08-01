const express = require("express");
const { createWithdraw } = require("../controllers/withdraw");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createWithdraw);

module.exports = router;
