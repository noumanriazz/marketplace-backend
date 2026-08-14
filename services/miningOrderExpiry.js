const MiningOrder = require("../models/MiningOrder");

/**
 * Completes Active MiningOrders whose expiresAt has been reached.
 * Does not change historical payment or snapshot fields.
 *
 * @returns {Promise<{ completedCount: number }>}
 */
const completeExpiredMiningOrders = async () => {
  const currentTime = new Date();

  const result = await MiningOrder.updateMany(
    {
      status: "Active",
      expiresAt: { $lte: currentTime },
    },
    {
      $set: {
        status: "Completed",
        completedAt: currentTime,
      },
    }
  );

  const completedCount = result.modifiedCount || 0;

  if (completedCount > 0) {
    console.log(
      `Mining orders completed:\ncompletedCount=${completedCount}`
    );
  }

  return { completedCount };
};

module.exports = {
  completeExpiredMiningOrders,
};
