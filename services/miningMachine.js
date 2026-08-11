const mongoose = require("mongoose");
const MiningMachine = require("../models/MiningMachine");

const ALLOWED_STATUSES = ["Active", "Inactive"];

/**
 * Maps a MiningMachine document to a response object.
 * @param {object} machine
 * @returns {object}
 */
const mapMachine = (machine) => ({
  _id: machine._id,
  name: machine.name,
  priceUsdt: machine.priceUsdt,
  dailyYieldPercentage: machine.dailyYieldPercentage,
  durationDays: machine.durationDays,
  status: machine.status,
  createdAt: machine.createdAt,
  updatedAt: machine.updatedAt,
});

/**
 * Validates and normalizes create payload.
 * @param {object} payload
 * @returns {{ name: string, priceUsdt: number, dailyYieldPercentage: number, durationDays: number, status: string }}
 */
const validateCreatePayload = (payload = {}) => {
  const name =
    typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name) {
    const error = new Error("Name is required.");
    error.statusCode = 400;
    throw error;
  }

  const priceUsdt = Number(payload.priceUsdt);
  if (!Number.isFinite(priceUsdt) || priceUsdt <= 0) {
    const error = new Error("priceUsdt must be a number greater than 0.");
    error.statusCode = 400;
    throw error;
  }

  const dailyYieldPercentage = Number(payload.dailyYieldPercentage);
  if (!Number.isFinite(dailyYieldPercentage) || dailyYieldPercentage <= 0) {
    const error = new Error(
      "dailyYieldPercentage must be a number greater than 0."
    );
    error.statusCode = 400;
    throw error;
  }

  const durationDays = Number(payload.durationDays);
  if (!Number.isInteger(durationDays) || durationDays <= 0) {
    const error = new Error(
      "durationDays must be an integer greater than 0."
    );
    error.statusCode = 400;
    throw error;
  }

  let status = "Active";
  if (payload.status !== undefined && payload.status !== null) {
    status = String(payload.status).trim();
    if (!ALLOWED_STATUSES.includes(status)) {
      const error = new Error(
        'Invalid status. Allowed: "Active", "Inactive".'
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    name,
    priceUsdt,
    dailyYieldPercentage,
    durationDays,
    status,
  };
};

/**
 * Validates and normalizes update payload (only provided fields).
 * @param {object} payload
 * @returns {object}
 */
const validateUpdatePayload = (payload = {}) => {
  const updates = {};

  if (payload.name !== undefined) {
    const name =
      typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) {
      const error = new Error("Name must be at least 1 character.");
      error.statusCode = 400;
      throw error;
    }
    updates.name = name;
  }

  if (payload.priceUsdt !== undefined) {
    const priceUsdt = Number(payload.priceUsdt);
    if (!Number.isFinite(priceUsdt) || priceUsdt <= 0) {
      const error = new Error("priceUsdt must be a number greater than 0.");
      error.statusCode = 400;
      throw error;
    }
    updates.priceUsdt = priceUsdt;
  }

  if (payload.dailyYieldPercentage !== undefined) {
    const dailyYieldPercentage = Number(payload.dailyYieldPercentage);
    if (!Number.isFinite(dailyYieldPercentage) || dailyYieldPercentage <= 0) {
      const error = new Error(
        "dailyYieldPercentage must be a number greater than 0."
      );
      error.statusCode = 400;
      throw error;
    }
    updates.dailyYieldPercentage = dailyYieldPercentage;
  }

  if (payload.durationDays !== undefined) {
    const durationDays = Number(payload.durationDays);
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      const error = new Error(
        "durationDays must be an integer greater than 0."
      );
      error.statusCode = 400;
      throw error;
    }
    updates.durationDays = durationDays;
  }

  if (payload.status !== undefined) {
    const status = String(payload.status).trim();
    if (!ALLOWED_STATUSES.includes(status)) {
      const error = new Error(
        'Invalid status. Allowed: "Active", "Inactive".'
      );
      error.statusCode = 400;
      throw error;
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("No valid fields provided to update.");
    error.statusCode = 400;
    throw error;
  }

  return updates;
};

/**
 * Maps a MiningMachine document to a user-facing response object.
 * @param {object} machine
 * @returns {object}
 */
const mapActiveMachine = (machine) => ({
  _id: machine._id,
  name: machine.name,
  priceUsdt: machine.priceUsdt,
  dailyYieldPercentage: machine.dailyYieldPercentage,
  durationDays: machine.durationDays,
});

/**
 * Creates a mining machine.
 * @param {object} payload
 * @returns {Promise<object>}
 */
const createMiningMachine = async (payload) => {
  const data = validateCreatePayload(payload);
  const machine = await MiningMachine.create(data);
  return mapMachine(machine);
};

/**
 * Returns Active mining machines for users, newest first.
 * @returns {Promise<object[]>}
 */
const getActiveMiningMachines = async () => {
  const machines = await MiningMachine.find({ status: "Active" })
    .select("_id name priceUsdt dailyYieldPercentage durationDays")
    .sort({ createdAt: -1 })
    .lean();

  return machines.map(mapActiveMachine);
};

/**
 * Returns paginated mining machines, newest first.
 *
 * @param {{ page?: number|string, limit?: number|string }} options
 * @returns {Promise<object>}
 */
const getMiningMachines = async (options = {}) => {
  const pageNumber = Number(options.page);
  const limitNumber = Number(options.limit);

  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const limit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, 100)
      : 10;

  const skip = (page - 1) * limit;

  const [machines, total] = await Promise.all([
    MiningMachine.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MiningMachine.countDocuments(),
  ]);

  return {
    machines: machines.map(mapMachine),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

/**
 * Returns a single mining machine by id.
 * @param {string} id
 * @returns {Promise<object>}
 */
const getMiningMachineById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid mining machine id.");
    error.statusCode = 400;
    throw error;
  }

  const machine = await MiningMachine.findById(id).lean();

  if (!machine) {
    const error = new Error("Mining machine not found.");
    error.statusCode = 404;
    throw error;
  }

  return mapMachine(machine);
};

/**
 * Updates a mining machine by id.
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
const updateMiningMachine = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid mining machine id.");
    error.statusCode = 400;
    throw error;
  }

  const updates = validateUpdatePayload(payload);

  const machine = await MiningMachine.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  if (!machine) {
    const error = new Error("Mining machine not found.");
    error.statusCode = 404;
    throw error;
  }

  return mapMachine(machine);
};

/**
 * Deletes a mining machine by id.
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteMiningMachine = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid mining machine id.");
    error.statusCode = 400;
    throw error;
  }

  const machine = await MiningMachine.findByIdAndDelete(id);

  if (!machine) {
    const error = new Error("Mining machine not found.");
    error.statusCode = 404;
    throw error;
  }
};

module.exports = {
  createMiningMachine,
  getActiveMiningMachines,
  getMiningMachines,
  getMiningMachineById,
  updateMiningMachine,
  deleteMiningMachine,
};
