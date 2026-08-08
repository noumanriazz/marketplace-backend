const express = require("express");
const {
  getActivityReward,
  claimUserActivityReward,
} = require("../controllers/activityReward");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getActivityReward);
router.post("/claim", protect, claimUserActivityReward);

module.exports = router;
