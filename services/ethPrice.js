/**
 * Fetches the current ETH/USD price.
 * Uses ETH_PRICE_API_URL when set, otherwise CoinGecko simple price API.
 * @returns {Promise<number>}
 */
const getEthPrice = async () => {
  const apiUrl =
    process.env.ETH_PRICE_API_URL ||
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const priceError = new Error(
        `Failed to fetch ETH price (HTTP ${response.status})`
      );
      priceError.code = "PRICE_ERROR";
      throw priceError;
    }

    const data = await response.json();
    const price = Number(
      data?.ethereum?.usd ?? data?.price ?? data?.usd ?? data?.ethUsd
    );

    if (Number.isNaN(price) || price <= 0) {
      const priceError = new Error("Invalid ETH price received from provider");
      priceError.code = "PRICE_ERROR";
      throw priceError;
    }

    return price;
  } catch (error) {
    if (error.code === "PRICE_ERROR") {
      throw error;
    }

    const priceError = new Error(
      error.message || "Failed to fetch ETH price"
    );
    priceError.code = "PRICE_ERROR";
    priceError.cause = error;
    throw priceError;
  }
};

module.exports = {
  getEthPrice,
};
