const {
  purchaseMiningMachine,
  getMiningPaymentConfig,
} = require("../services/miningOrder");
const { generateMiningReward } = require("../services/miningReward");

const purchaseMiningMachineController = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { txHash } = req.body;

    if (!machineId) {
      return res.status(400).json({
        success: false,
        message: "Mining machine not found.",
      });
    }

    if (!txHash) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash is required.",
      });
    }

    const order = await purchaseMiningMachine(req.user, machineId, txHash);

    return res.status(201).json({
      success: true,
      message: "Mining machine activated successfully.",
      order,
    });
  } catch (error) {
    console.error("Purchase mining machine error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while purchasing mining machine",
    });
  }
};

const getMiningPaymentConfigController = async (req, res) => {
  try {
    const paymentConfig = getMiningPaymentConfig();

    return res.status(200).json({
      success: true,
      paymentConfig,
    });
  } catch (error) {
    console.error("Get mining payment config error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching payment config",
    });
  }
};

const generateMiningRewardController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Mining order not found.",
      });
    }

    const reward = await generateMiningReward(orderId, req.user);

    return res.status(201).json({
      success: true,
      message: "Mining reward generated successfully.",
      reward,
    });
  } catch (error) {
    console.error("Generate mining reward error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while generating mining reward",
    });
  }
};

module.exports = {
  purchaseMiningMachineController,
  getMiningPaymentConfigController,
  generateMiningRewardController,
};
