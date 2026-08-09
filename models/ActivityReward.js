const mongoose = require("mongoose");

const activityRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    standardAmount: {
      type: Number,
      required: [true, "Standard amount is required"],
    },
    rewardEth: {
      type: String,
      required: [true, "Reward ETH is required"],
    },
    walletBalanceUsdt: {
      type: Number,
      required: [true, "Wallet balance USDT is required"],
    },
    requiredAmount: {
      type: Number,
      required: [true, "Required amount is required"],
    },
    countdownDays: {
      type: Number,
      required: [true, "Countdown days is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Claimed", "Expired"],
      default: "Pending",
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    txHash: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ActivityReward", activityRewardSchema);
