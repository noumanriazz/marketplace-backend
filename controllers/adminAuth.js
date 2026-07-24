const { loginAdmin, getAdminProfile } = require("../services/adminAuth");

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase().trim());

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email must be valid.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    const data = await loginAdmin(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: data.token,
      admin: data.admin,
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during admin login",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const admin = getAdminProfile(req.admin);

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Admin profile error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching admin profile",
    });
  }
};

module.exports = {
  login,
  getProfile,
};
