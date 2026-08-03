const {
  getExchanges,
  getExchangeById,
} = require("../services/adminExchange");

const getAdminExchanges = async (req, res) => {
  try {
    const data = await getExchanges({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get exchanges error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching exchanges",
    });
  }
};

const getAdminExchangeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid exchange id.",
      });
    }

    const data = await getExchangeById(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin get exchange error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while fetching exchange",
    });
  }
};

module.exports = {
  getAdminExchanges,
  getAdminExchangeById,
};
