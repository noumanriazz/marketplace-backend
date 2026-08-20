const ActivityReward = require("../models/ActivityReward");

const INDEX_NAME = "txHash_1";

const DESIRED_PARTIAL_FILTER = {
  txHash: { $type: "string" },
};

/**
 * Returns true when the index is the partial unique txHash index we want.
 * @param {object} index
 * @returns {boolean}
 */
const isDesiredTxHashIndex = (index) => {
  if (!index || index.unique !== true) {
    return false;
  }

  const keys = Object.keys(index.key || {});
  if (keys.length !== 1 || index.key.txHash !== 1) {
    return false;
  }

  const filter = index.partialFilterExpression;
  return Boolean(filter && filter.txHash && filter.txHash.$type === "string");
};

/**
 * Finds duplicate non-null string txHash values.
 * @returns {Promise<object[]>}
 */
const findDuplicateTxHashes = async () => {
  return ActivityReward.aggregate([
    {
      $match: {
        txHash: { $type: "string" },
      },
    },
    {
      $group: {
        _id: "$txHash",
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);
};

/**
 * Drops the old unique txHash index and creates a partial unique index
 * so multiple ActivityReward documents may have txHash: null.
 * Safe to run on every startup.
 *
 * @returns {Promise<void>}
 */
const migrateActivityRewardTxHashIndex = async () => {
  const collection = ActivityReward.collection;
  const indexes = await collection.indexes();

  const txHashIndexes = indexes.filter((index) => {
    const keys = Object.keys(index.key || {});
    return keys.length === 1 && index.key.txHash === 1;
  });

  const desiredIndex = txHashIndexes.find(isDesiredTxHashIndex);
  const outdatedIndexes = txHashIndexes.filter(
    (index) => !isDesiredTxHashIndex(index)
  );

  for (const index of outdatedIndexes) {
    console.log(
      `Dropping outdated ActivityReward txHash index: ${index.name}`
    );
    await collection.dropIndex(index.name);
  }

  if (desiredIndex) {
    console.log("ActivityReward txHash partial unique index already exists.");
    return;
  }

  const duplicates = await findDuplicateTxHashes();

  if (duplicates.length > 0) {
    const hashes = duplicates.map((item) => item._id).join(", ");
    console.error(
      `Cannot create ActivityReward txHash unique index. Duplicate transaction hashes found: ${hashes}`
    );
    return;
  }

  await collection.createIndex(
    { txHash: 1 },
    {
      unique: true,
      name: INDEX_NAME,
      partialFilterExpression: DESIRED_PARTIAL_FILTER,
    }
  );

  console.log(
    "Created ActivityReward txHash partial unique index (string values only)."
  );
};

module.exports = migrateActivityRewardTxHashIndex;
