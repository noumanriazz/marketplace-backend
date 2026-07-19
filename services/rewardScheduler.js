const User = require("../models/User");
const { generateReward } = require("./rewardGenerator");

/**
 * Runs one reward cycle for all active users.
 * Coordinates users only — reward business logic stays in generateReward.
 *
 * @returns {Promise<{
 *   processed: number,
 *   generated: number,
 *   skipped: number,
 *   failed: number,
 *   successes: Array<object>,
 *   skips: Array<object>,
 *   failures: Array<object>
 * }>}
 */
const rewardScheduler = async () => {
  console.log("⏳ Reward cycle started...");

  const users = await User.find({
    walletAddress: { $exists: true, $ne: null },
  });

  const successes = [];
  const skips = [];
  const failures = [];

  for (const user of users) {
    try {
      const result = await generateReward(user);

      if (result.success) {
        successes.push({
          userId: user._id,
          walletAddress: user.walletAddress,
          rewardId: result.reward?._id,
        });
        console.log(`✅ Reward generated for ${user.walletAddress}`);
      } else if (result.skipped) {
        skips.push({
          userId: user._id,
          walletAddress: user.walletAddress,
          message: result.message,
        });
        console.log(
          `⚠️  Reward skipped for ${user.walletAddress}: ${result.message}`
        );
      } else {
        failures.push({
          userId: user._id,
          walletAddress: user.walletAddress,
          message: result.message || "Reward generation failed.",
        });
        console.error(
          `❌ Reward failed for ${user.walletAddress}: ${result.message}`
        );
      }
    } catch (error) {
      failures.push({
        userId: user._id,
        walletAddress: user.walletAddress,
        message: error.message || "Unexpected reward scheduler error.",
      });
      console.error(
        `❌ Reward failed for ${user.walletAddress}: ${error.message}`
      );
    }
  }

  const summary = {
    processed: users.length,
    generated: successes.length,
    skipped: skips.length,
    failed: failures.length,
    successes,
    skips,
    failures,
  };

  console.log(
    `🏁 Reward cycle finished. Processed: ${summary.processed}, Generated: ${summary.generated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`
  );

  return summary;
};

module.exports = {
  rewardScheduler,
};
