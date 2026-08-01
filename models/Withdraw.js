const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Withdraw", withdrawSchema);
