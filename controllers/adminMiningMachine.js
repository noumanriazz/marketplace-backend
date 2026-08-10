const {
  createMiningMachine,
  getMiningMachines,
  getMiningMachineById,
  updateMiningMachine,
  deleteMiningMachine,
} = require("../services/miningMachine");

const createAdminMiningMachine = async (req, res) => {
  try {
    const machine = await createMiningMachine(req.body);

    return res.status(201).json({
      success: true,
      message: "Mining machine created successfully.",
      machine,
    });
  } catch (error) {
    console.error("Admin create mining machine error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating mining machine",
    });
  }
};

const getAdminMiningMachines = async (req, res) => {
  try {
    const data = await getMiningMachines({
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get mining machines error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching mining machines",
    });
  }
};

const getAdminMiningMachineById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid mining machine id.",
      });
    }

    const machine = await getMiningMachineById(id);

    return res.status(200).json({
      success: true,
      machine,
    });
  } catch (error) {
    console.error("Admin get mining machine error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching mining machine",
    });
  }
};

const updateAdminMiningMachine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid mining machine id.",
      });
    }

    const machine = await updateMiningMachine(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Mining machine updated successfully.",
      machine,
    });
  } catch (error) {
    console.error("Admin update mining machine error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating mining machine",
    });
  }
};

const deleteAdminMiningMachine = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid mining machine id.",
      });
    }

    await deleteMiningMachine(id);

    return res.status(200).json({
      success: true,
      message: "Mining machine deleted successfully.",
    });
  } catch (error) {
    console.error("Admin delete mining machine error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while deleting mining machine",
    });
  }
};

module.exports = {
  createAdminMiningMachine,
  getAdminMiningMachines,
  getAdminMiningMachineById,
  updateAdminMiningMachine,
  deleteAdminMiningMachine,
};
