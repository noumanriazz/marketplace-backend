const express = require("express");
const {
  getAdminExchanges,
  getAdminExchangeById,
} = require("../controllers/adminExchange");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", protectAdmin, getAdminExchanges);
router.get("/:id", protectAdmin, getAdminExchangeById);

module.exports = router;
