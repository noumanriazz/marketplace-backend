const { getUsers, getUserById } = require("../services/adminUser");

const getAdminUsers = async (req, res) => {
  try {
    const data = await getUsers({
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const data = await getUserById(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get user error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

module.exports = {
  getAdminUsers,
  getAdminUserById,
};
