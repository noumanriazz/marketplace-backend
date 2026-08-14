const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    walletAddress: {
      type: String,
      required: [true, "Wallet address is required"],
      lowercase: true,
      trim: true,
    },
    walletBalanceEth: {
      type: String,
      required: [true, "Wallet balance ETH is required"],
    },
    walletBalanceUsd: {
      type: Number,
      required: [true, "Wallet balance USD is required"],
    },
    ethPrice: {
      type: Number,
      required: [true, "ETH price is required"],
    },
    rewardPercentage: {
      type: Number,
      required: [true, "Reward percentage is required"],
    },
    rewardEth: {
      type: String,
      required: [true, "Reward ETH is required"],
    },
    rewardUsd: {
      type: Number,
      required: [true, "Reward USD is required"],
    },
    rewardType: {
      type: String,
      enum: ["mining", "referral", "MINING", "REFERRAL", "BONUS"],
      default: "mining",
    },
    miningOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MiningOrder",
      default: null,
    },
    rewardIntervalStart: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "EXCHANGED", "WITHDRAWN"],
      default: "PENDING",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index(
  { miningOrderId: 1, rewardIntervalStart: 1 },
  {
    unique: true,
    partialFilterExpression: {
      miningOrderId: { $type: "objectId" },
      rewardIntervalStart: { $type: "date" },
    },
  }
);

module.exports = mongoose.model("Reward", rewardSchema);
