const crypto = require("crypto");
const User = require("../models/User");

/**
 * Generates a unique uppercase referral code.
 * @returns {Promise<string>}
 */
const generateUniqueReferralCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const exists = await User.exists({ referralCode: code });

    if (!exists) {
      return code;
    }
  }

  throw new Error("Failed to generate unique referral code.");
};

/**
 * Ensures a user has a referral code (backfills existing users).
 * @param {object} user
 * @returns {Promise<object>}
 */
const ensureReferralCode = async (user) => {
  if (user.referralCode) {
    return user;
  }

  user.referralCode = await generateUniqueReferralCode();
  await user.save();
  return user;
};

/**
 * Builds a public referral registration link.
 * @param {string} referralCode
 * @returns {string}
 */
const buildReferralLink = (referralCode) => {
  const baseUrl = (
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    "https://yourdomain.com"
  ).replace(/\/$/, "");

  return `${baseUrl}/register?ref=${referralCode}`;
};

module.exports = {
  generateUniqueReferralCode,
  ensureReferralCode,
  buildReferralLink,
};
