const mongoose = require("mongoose");

const miningMachineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [1, "Name must be at least 1 character"],
    },
    priceUsdt: {
      type: Number,
      required: [true, "Price USDT is required"],
      min: [0.000001, "Price USDT must be greater than 0"],
    },
    dailyYieldPercentage: {
      type: Number,
      required: [true, "Daily yield percentage is required"],
      min: [0.000001, "Daily yield percentage must be greater than 0"],
    },
    durationDays: {
      type: Number,
      required: [true, "Duration days is required"],
      min: [1, "Duration days must be greater than 0"],
      validate: {
        validator: Number.isInteger,
        message: "Duration days must be an integer",
      },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MiningMachine", miningMachineSchema);
