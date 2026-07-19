require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/account");
const { startRewardCron } = require("./cron/rewardCron");

const app = express();

connectDB();
startRewardCron();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
