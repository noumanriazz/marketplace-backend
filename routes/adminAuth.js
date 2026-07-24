const express = require("express");
const { login, getProfile } = require("../controllers/adminAuth");
const { protectAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", login);
router.get("/profile", protectAdmin, getProfile);

module.exports = router;
