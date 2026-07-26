const express = require("express");
const { runRewardScheduler } = require("../controllers/cron");

const router = express.Router();

router.post("/rewards", runRewardScheduler);

module.exports = router;
