module.exports = {
  /**
   * Reward slabs based on wallet USD value.
   * Boundaries: lower inclusive, upper exclusive (except the last slab).
   * Example: 1000 USD uses 1.6%, 5000 USD uses 1.8%.
   */
  rewardSlabs: [
    { min: 1, max: 1000, percentage: 1.5 },
    { min: 1000, max: 3000, percentage: 1.6 },
    { min: 3000, max: 5000, percentage: 1.7 },
    { min: 5000, max: 10000, percentage: 1.8 },
    { min: 10000, max: 50000, percentage: 1.9 },
    { min: 50000, max: 100000, percentage: 2.0 },
  ],
  intervalsPerDay: 4,
};
