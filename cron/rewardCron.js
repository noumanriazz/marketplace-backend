const cron = require("node-cron");
const { rewardIntervalHours } = require("../config/mining");
const { rewardScheduler } = require("../services/rewardScheduler");

/**
 * Starts the reward cron job.
 * Cron only schedules execution — no business logic here.
 */
const startRewardCron = () => {
  const intervalHours = rewardIntervalHours || 6;
  const cronExpression = `0 */${intervalHours} * * *`;

  if (!cron.validate(cronExpression)) {
    console.error(`❌ Invalid reward cron expression: ${cronExpression}`);
    return;
  }

  cron.schedule(cronExpression, async () => {
    console.log("⏰ Reward cron triggered");

    try {
      await rewardScheduler();
    } catch (error) {
      console.error("❌ Reward cron execution failed:", error.message);
    }
  });

  console.log(
    `🕒 Reward cron scheduled every ${intervalHours} hours (${cronExpression})`
  );
};

module.exports = {
  startRewardCron,
};
