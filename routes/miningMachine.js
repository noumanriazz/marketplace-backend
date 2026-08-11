const express = require("express");
const { getMiningMachines } = require("../controllers/miningMachine");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMiningMachines);

module.exports = router;
