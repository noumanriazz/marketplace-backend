require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/account");
const adminAuthRoutes = require("./routes/adminAuth");
const adminUserRoutes = require("./routes/adminUser");
const adminDashboardRoutes = require("./routes/adminDashboard");
const adminWithdrawRoutes = require("./routes/adminWithdraw");
const withdrawRoutes = require("./routes/withdraw");
const cronRoutes = require("./routes/cron");
const createDefaultAdmin = require("./services/createDefaultAdmin");

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/withdraws", adminWithdrawRoutes);
app.use("/api/cron", cronRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
