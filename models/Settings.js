const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    adminWalletAddress: {
      type: String,
      required: [true, "Admin wallet address is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);
