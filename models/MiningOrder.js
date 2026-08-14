const mongoose = require("mongoose");

const miningOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MiningMachine",
      required: [true, "Machine ID is required"],
    },
    machineName: {
      type: String,
      required: [true, "Machine name is required"],
      trim: true,
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
      enum: ["Active", "Completed"],
      default: "Active",
    },
    txHash: {
      type: String,
      required: [true, "Transaction hash is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    startedAt: {
      type: Date,
      required: [true, "Started at is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expires at is required"],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MiningOrder", miningOrderSchema);
