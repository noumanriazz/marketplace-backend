const { getActiveMiningMachines } = require("../services/miningMachine");

const getMiningMachines = async (req, res) => {
  try {
    const machines = await getActiveMiningMachines();

    return res.status(200).json({
      success: true,
      machines,
    });
  } catch (error) {
    console.error("Get mining machines error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching mining machines",
    });
  }
};

module.exports = {
  getMiningMachines,
};
