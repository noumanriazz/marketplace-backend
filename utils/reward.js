const { rewardSlabs, intervalsPerDay } = require("../config/reward");

/**
 * Returns the reward percentage for a wallet USD value.
 * @param {number} walletUsdValue
 * @returns {number} Percentage value (e.g. 1.8), or 0 if outside slabs
 */
const getRewardPercentage = (walletUsdValue) => {
  const usdValue = Number(walletUsdValue);

  if (Number.isNaN(usdValue)) {
    return 0;
  }

  for (let i = 0; i < rewardSlabs.length; i += 1) {
    const slab = rewardSlabs[i];
    const isLastSlab = i === rewardSlabs.length - 1;

    if (isLastSlab) {
      if (usdValue >= slab.min && usdValue <= slab.max) {
        return slab.percentage;
      }
    } else if (usdValue >= slab.min && usdValue < slab.max) {
      return slab.percentage;
    }
  }

  return 0;
};

/**
 * Calculates the daily reward in USD.
 * @param {number} walletUsdValue
 * @param {number} rewardPercentage - e.g. 1.8 for 1.8%
 * @returns {number}
 */
const calculateDailyReward = (walletUsdValue, rewardPercentage) => {
  const usdValue = Number(walletUsdValue);
  const percentage = Number(rewardPercentage);

  if (Number.isNaN(usdValue) || Number.isNaN(percentage)) {
    return 0;
  }

  return (usdValue * percentage) / 100;
};

/**
 * Calculates the 6-hour reward from a daily reward.
 * @param {number} dailyReward
 * @returns {number}
 */
const calculateSixHourReward = (dailyReward) => {
  const reward = Number(dailyReward);

  if (Number.isNaN(reward)) {
    return 0;
  }

  return reward / intervalsPerDay;
};

/**
 * Converts ETH balance to USD.
 * @param {number|string} ethBalance
 * @param {number|string} ethPrice
 * @returns {number}
 */
const convertEthToUsd = (ethBalance, ethPrice) => {
  const eth = Number(ethBalance);
  const price = Number(ethPrice);

  if (Number.isNaN(eth) || Number.isNaN(price)) {
    return 0;
  }

  return eth * price;
};

/**
 * Converts USD amount to ETH.
 * @param {number|string} usdAmount
 * @param {number|string} ethPrice
 * @returns {number}
 */
const convertUsdToEth = (usdAmount, ethPrice) => {
  const usd = Number(usdAmount);
  const price = Number(ethPrice);

  if (Number.isNaN(usd) || Number.isNaN(price) || price === 0) {
    return 0;
  }

  return usd / price;
};

module.exports = {
  getRewardPercentage,
  calculateDailyReward,
  calculateSixHourReward,
  convertEthToUsd,
  convertUsdToEth,
};
