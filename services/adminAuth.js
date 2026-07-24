const Admin = require("../models/Admin");
const { generateAdminToken } = require("../utils/jwt");

/**
 * Authenticates an admin by email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, admin: object }>}
 */
const loginAdmin = async (email, password) => {
  const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );

  if (!admin) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateAdminToken(admin._id);

  return {
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
    },
  };
};

/**
 * Returns a safe admin profile payload.
 *
 * @param {object} admin
 * @returns {object}
 */
const getAdminProfile = (admin) => {
  if (!admin) {
    const error = new Error("Admin not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
  };
};

module.exports = {
  loginAdmin,
  getAdminProfile,
};
