const {
  getRewardPercentage,
  calculateDailyReward,
  calculateSixHourReward,
  convertEthToUsd,
  convertUsdToEth,
} = require("../utils/reward");

/**
 * Calculates the full reward breakdown for a wallet balance.
 * Pure calculation only — no database or side effects.
 *
 * @param {number|string} walletBalanceEth
 * @param {number|string} ethPrice
 * @returns {{
 *   walletBalanceEth: number,
 *   walletBalanceUsd: number,
 *   rewardPercentage: number,
 *   dailyRewardUsd: number,
 *   sixHourRewardUsd: number,
 *   sixHourRewardEth: number
 * }}
 */
const calculateReward = (walletBalanceEth, ethPrice) => {
  const ethBalance = Number(walletBalanceEth);
  const price = Number(ethPrice);

  const walletBalanceUsd = convertEthToUsd(ethBalance, price);
  const rewardPercentage = getRewardPercentage(walletBalanceUsd);
  const dailyRewardUsd = calculateDailyReward(walletBalanceUsd, rewardPercentage);
  const sixHourRewardUsd = calculateSixHourReward(dailyRewardUsd);
  const sixHourRewardEth = convertUsdToEth(sixHourRewardUsd, price);

  return {
    walletBalanceEth: ethBalance,
    walletBalanceUsd,
    rewardPercentage,
    dailyRewardUsd,
    sixHourRewardUsd,
    sixHourRewardEth,
  };
};

module.exports = {
  calculateReward,
};
