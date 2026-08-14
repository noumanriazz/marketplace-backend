const { rewardScheduler } = require("../services/rewardScheduler");
const { miningScheduler } = require("../services/miningScheduler");

const runRewardScheduler = async (req, res) => {
  try {
    const cronSecret = req.headers["x-cron-secret"];

    if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const summary = await rewardScheduler();
    const mining = await miningScheduler();

    return res.status(200).json({
      success: true,
      message: "Reward scheduler executed successfully.",
      data: {
        processed: summary.processed,
        generated: summary.generated,
        skipped: summary.skipped,
        failed: summary.failed,
        mining: {
          processed: mining.processed,
          generated: mining.generated,
          skipped: mining.skipped,
          failed: mining.failed,
          completedCount: mining.completedCount,
        },
      },
    });
  } catch (error) {
    console.error("Reward scheduler error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Reward scheduler failed.",
    });
  }
};

module.exports = {
  runRewardScheduler,
};
