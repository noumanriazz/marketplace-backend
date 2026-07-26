const express = require("express");
const {
  getAdminUsers,
  getAdminUserById,
} = require("../controllers/adminUser");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getAdminUsers);
router.get("/:id", protectAdmin, getAdminUserById);

module.exports = router;
