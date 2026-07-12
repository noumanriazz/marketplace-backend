const express = require("express");
const { getBalance } = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/balance", protect, getBalance);

module.exports = router;
