const express = require("express");
const {
  getAccount,
  getRecords,
  exchangeReward,
} = require("../controllers/account");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAccount);
router.get("/records", protect, getRecords);
router.post("/exchange", protect, exchangeReward);

module.exports = router;
