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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
