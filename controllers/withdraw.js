const {
  createWithdrawRequest,
  minimumWithdrawUsdt,
} = require("../services/withdrawRequest");

const validateWithdrawAmount = (amount) => {
  if (amount === undefined || amount === null || amount === "") {
    return "Amount is required.";
  }

  if (typeof amount === "string" && amount.trim() === "") {
    return "Amount is required.";
  }

  const amountNumber = Number(amount);

  if (Number.isNaN(amountNumber) || !Number.isFinite(amountNumber)) {
    return "Invalid amount.";
  }

  if (amountNumber <= 0) {
    return "Amount must be greater than zero.";
  }

  if (amountNumber < minimumWithdrawUsdt) {
    return `Minimum withdrawal amount is ${minimumWithdrawUsdt} USDT.`;
  }

  return null;
};

const createWithdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const validationError = validateWithdrawAmount(amount);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const data = await createWithdrawRequest(req.user, Number(amount));

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully.",
      data,
    });
  } catch (error) {
    console.error("Create withdraw error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating withdrawal request",
    });
  }
};

module.exports = {
  createWithdraw,
};
