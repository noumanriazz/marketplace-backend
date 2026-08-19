const mongoose = require("mongoose");
const { isHash } = require("viem");
const MiningMachine = require("../models/MiningMachine");
const MiningOrder = require("../models/MiningOrder");
const { verifyUsdtTransfer, getUsdtContractAddress, getConfiguredChainId } = require("./blockchain");
const { getStoredAdminWalletAddress } = require("./settings");

/**
 * Maps a MiningOrder document to the API response shape.
 * @param {object} order
 * @returns {object}
 */
const mapOrder = (order) => ({
  _id: order._id,
  machineId: order.machineId,
  machineName: order.machineName,
  priceUsdt: order.priceUsdt,
  dailyYieldPercentage: order.dailyYieldPercentage,
  durationDays: order.durationDays,
  status: order.status,
  txHash: order.txHash,
  startedAt: order.startedAt,
  expiresAt: order.expiresAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

/**
 * Purchases and activates a mining machine after on-chain USDT verification.
 * Creates the MiningOrder only after blockchain verification succeeds.
 *
 * @param {object} user - Authenticated user document
 * @param {string} machineId
 * @param {string} txHash
 * @returns {Promise<object>}
 */
const purchaseMiningMachine = async (user, machineId, txHash) => {
  if (!user || !user._id || !user.walletAddress) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(machineId)) {
    const error = new Error("Mining machine not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!txHash || typeof txHash !== "string" || !txHash.trim()) {
    const error = new Error("Transaction hash is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedTxHash = txHash.trim().toLowerCase();

  if (!isHash(normalizedTxHash)) {
    const error = new Error("Transaction verification failed.");
    error.statusCode = 400;
    throw error;
  }

  const machine = await MiningMachine.findById(machineId);

  if (!machine) {
    const error = new Error("Mining machine not found.");
    error.statusCode = 404;
    throw error;
  }

  if (machine.status !== "Active") {
    const error = new Error("Mining machine is not available.");
    error.statusCode = 400;
    throw error;
  }

  const existingActiveOrder = await MiningOrder.findOne({
    userId: user._id,
    status: "Active",
  });

  if (existingActiveOrder) {
    const error = new Error("You already have an active mining machine.");
    error.statusCode = 400;
    throw error;
  }

  const existingTx = await MiningOrder.findOne({
    txHash: normalizedTxHash,
  });

  if (existingTx) {
    const error = new Error("Transaction has already been used.");
    error.statusCode = 400;
    throw error;
  }

  let adminWalletAddress;

  try {
    adminWalletAddress = await getStoredAdminWalletAddress();
  } catch (configError) {
    console.error("Mining payment config error:", configError.message);
    const error = new Error("Transaction verification failed.");
    error.statusCode = 500;
    throw error;
  }

  const verification = await verifyUsdtTransfer({
    txHash: normalizedTxHash,
    expectedFrom: user.walletAddress,
    expectedTo: adminWalletAddress,
    expectedAmount: machine.priceUsdt,
  });

  if (!verification.success) {
    const error = new Error(
      verification.message || "Transaction verification failed."
    );
    error.statusCode = 400;
    throw error;
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + machine.durationDays);

  let order;

  try {
    order = await MiningOrder.create({
      userId: user._id,
      machineId: machine._id,
      machineName: machine.name,
      priceUsdt: machine.priceUsdt,
      dailyYieldPercentage: machine.dailyYieldPercentage,
      durationDays: machine.durationDays,
      status: "Active",
      txHash: normalizedTxHash,
      startedAt,
      expiresAt,
    });
  } catch (saveError) {
    if (saveError && saveError.code === 11000) {
      const error = new Error("Transaction has already been used.");
      error.statusCode = 400;
      throw error;
    }

    throw saveError;
  }

  return mapOrder(order);
};

/**
 * Returns payment config for the frontend wallet transfer.
 * Admin wallet comes from MongoDB Settings.
 * @returns {Promise<{ adminWalletAddress: string, usdtContractAddress: string, chainId: number }>}
 */
const getMiningPaymentConfig = async () => {
  const adminWalletAddress = await getStoredAdminWalletAddress();

  return {
    adminWalletAddress,
    usdtContractAddress: getUsdtContractAddress(),
    chainId: getConfiguredChainId(),
  };
};

module.exports = {
  purchaseMiningMachine,
  getMiningPaymentConfig,
  mapOrder,
};
