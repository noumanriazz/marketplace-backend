const { minimumEthBalance } = require("../config/mining");

/**
 * Returns true if wallet balance meets the minimum mining requirement.
 * @param {string|number} balance
 * @returns {boolean}
 */
const isMiningActive = (balance) => {
  const numericBalance = Number(balance);

  if (Number.isNaN(numericBalance)) {
    return false;
  }

  return numericBalance >= minimumEthBalance;
};

/**
 * Returns mining status based on wallet balance.
 * @param {string|number} balance
 * @returns {"running"|"stopped"}
 */
const getMiningStatus = (balance) => {
  return isMiningActive(balance) ? "running" : "stopped";
};

module.exports = {
  isMiningActive,
  getMiningStatus,
};
