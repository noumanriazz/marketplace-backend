const express = require("express");
const {
  createAdminMiningMachine,
  getAdminMiningMachines,
  getAdminMiningMachineById,
  updateAdminMiningMachine,
  deleteAdminMiningMachine,
} = require("../controllers/adminMiningMachine");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/", protectAdmin, createAdminMiningMachine);
router.get("/", protectAdmin, getAdminMiningMachines);
router.get("/:id", protectAdmin, getAdminMiningMachineById);
router.patch("/:id", protectAdmin, updateAdminMiningMachine);
router.delete("/:id", protectAdmin, deleteAdminMiningMachine);

module.exports = router;
