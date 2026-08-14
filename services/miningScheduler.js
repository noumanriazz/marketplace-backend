const MiningOrder = require("../models/MiningOrder");
const { generateMiningReward } = require("./miningReward");
const { completeExpiredMiningOrders } = require("./miningOrderExpiry");

const DUPLICATE_INTERVAL_MESSAGE =
  "Mining reward already generated for this interval.";

/**
 * Returns a skip reason for an Active mining order, or null if it may earn a reward.
 *
 * @param {object} order
 * @param {Date} now
 * @returns {string|null}
 */
const getSkipReason = (order, now) => {
  if (now < new Date(order.startedAt)) {
    return "not started";
  }

  if (now >= new Date(order.expiresAt)) {
    return "expired";
  }

  return null;
};

/**
 * Runs one mining-machine reward cycle for all Active MiningOrders.
 * Does not calculate rewards — only decides which orders are due and
 * calls generateMiningReward().
 *
 * @returns {Promise<{
 *   processed: number,
 *   generated: number,
 *   skipped: number,
 *   failed: number,
 *   completedCount: number
 * }>}
 */
const miningScheduler = async () => {
  console.log("Mining scheduler started.");

  const { completedCount } = await completeExpiredMiningOrders();

  const orders = await MiningOrder.find({ status: "Active" }).select(
    "_id startedAt expiresAt"
  );

  const now = new Date();
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of orders) {
    const orderId = String(order._id);

    try {
      const skipReason = getSkipReason(order, now);

      if (skipReason) {
        skipped += 1;
        console.log(
          `Mining order skipped:\norderId=${orderId}\nreason=${skipReason}`
        );
        continue;
      }

      const reward = await generateMiningReward(order._id);

      generated += 1;
      console.log(
        `Mining reward generated:\norderId=${orderId}\nreward=${reward._id}`
      );
    } catch (error) {
      if (
        error.message === DUPLICATE_INTERVAL_MESSAGE ||
        error.message === "Mining order has expired." ||
        error.message === "Mining order is not active."
      ) {
        skipped += 1;
        console.log(`No reward due:\norderId=${orderId}`);
        continue;
      }

      failed += 1;
      console.error(
        `Mining reward error:\norderId=${orderId}\nerror=${error.message}`
      );
    }
  }

  console.log(
    `Mining scheduler finished. Processed: ${orders.length}, Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}, Completed: ${completedCount}`
  );

  return {
    processed: orders.length,
    generated,
    skipped,
    failed,
    completedCount,
  };
};

module.exports = {
  miningScheduler,
  getSkipReason,
};
