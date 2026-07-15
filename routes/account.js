const express = require("express");
const {
  getAccount,
  exchangeReward,
  withdrawReward,
} = require("../controllers/account");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAccount);
router.post("/exchange", protect, exchangeReward);
router.post("/withdraw", protect, withdrawReward);

module.exports = router;
