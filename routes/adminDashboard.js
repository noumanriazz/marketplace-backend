const express = require("express");
const { getDashboard } = require("../controllers/adminDashboard");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getDashboard);

module.exports = router;
