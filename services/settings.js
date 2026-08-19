const { isAddress, getAddress } = require("viem");
const Settings = require("../models/Settings");

const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * @param {object} settings
 * @returns {{ adminWalletAddress: string }}
 */
const mapSettings = (settings) => ({
  adminWalletAddress: settings.adminWalletAddress,
});

/**
 * Validates an Ethereum wallet address (0x + 40 hex chars).
 * @param {unknown} value
 * @returns {string} Checksummed address
 */
const normalizeAdminWalletAddress = (value) => {
  const address = typeof value === "string" ? value.trim() : "";

  if (
    !address ||
    !WALLET_ADDRESS_PATTERN.test(address) ||
    !isAddress(address)
  ) {
    const error = new Error("Invalid wallet address.");
    error.statusCode = 400;
    throw error;
  }

  return getAddress(address);
};

/**
 * Returns the single Settings document, or null if none exists.
 * @returns {Promise<object|null>}
 */
const findSettingsDocument = async () => Settings.findOne();

/**
 * Returns admin settings. If no document exists, returns an empty wallet.
 * @returns {Promise<{ adminWalletAddress: string }>}
 */
const getSettings = async () => {
  const settings = await findSettingsDocument();

  if (!settings) {
    return { adminWalletAddress: "" };
  }

  return mapSettings(settings);
};

/**
 * Returns the current admin wallet from MongoDB Settings.
 * @returns {Promise<string>}
 */
const getStoredAdminWalletAddress = async () => {
  const settings = await findSettingsDocument();

  if (!settings || !settings.adminWalletAddress) {
    const error = new Error("Admin wallet address is not configured.");
    error.statusCode = 500;
    throw error;
  }

  if (!isAddress(settings.adminWalletAddress)) {
    const error = new Error("Admin wallet address is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return getAddress(settings.adminWalletAddress);
};

/**
 * Creates or updates the single Settings document's admin wallet.
 * @param {string} adminWalletAddress
 * @returns {Promise<{ adminWalletAddress: string }>}
 */
const updateAdminWalletAddress = async (adminWalletAddress) => {
  const normalized = normalizeAdminWalletAddress(adminWalletAddress);

  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: { adminWalletAddress: normalized } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return mapSettings(settings);
};

module.exports = {
  getSettings,
  getStoredAdminWalletAddress,
  updateAdminWalletAddress,
  normalizeAdminWalletAddress,
};
