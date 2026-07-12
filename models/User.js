const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: [true, "Wallet address is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    walletType: {
      type: String,
      required: [true, "Wallet type is required"],
      trim: true,
    },
    chainId: {
      type: Number,
      required: [true, "Chain ID is required"],
    },
    exchangeable: {
      type: Number,
      default: 0,
    },
    withdrawable: {
      type: Number,
      default: 0,
    },
    lastRewardTime: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
