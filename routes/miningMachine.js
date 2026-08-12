const express = require("express");
const { getMiningMachines } = require("../controllers/miningMachine");
const {
  purchaseMiningMachineController,
} = require("../controllers/miningOrder");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMiningMachines);
router.post("/:machineId/purchase", protect, purchaseMiningMachineController);

module.exports = router;
