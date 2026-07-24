const jwt = require("jsonwebtoken");

const generateToken = (userId, walletAddress) => {
  return jwt.sign(
    {
      userId,
      walletAddress,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const generateAdminToken = (adminId) => {
  return jwt.sign(
    {
      adminId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = { generateToken, generateAdminToken };
