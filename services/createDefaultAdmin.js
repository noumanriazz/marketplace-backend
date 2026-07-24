const Admin = require("../models/Admin");

const DEFAULT_ADMIN = {
  name: "Nouman",
  email: "admin@gmail.com",
  password: "Admin@123",
};

const createDefaultAdmin = async () => {
  const adminExists = await Admin.findOne({
    email: DEFAULT_ADMIN.email,
  });

  if (adminExists) return;

  await Admin.create(DEFAULT_ADMIN);

  console.log("✅ Default admin created.");
};

module.exports = createDefaultAdmin;