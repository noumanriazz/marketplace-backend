const CACHE_TTL_MS =
  Number(process.env.ETH_PRICE_CACHE_TTL_MS) > 0
    ? Number(process.env.ETH_PRICE_CACHE_TTL_MS)
    : 5 * 60 * 1000; // 5 minutes

let cachedEthPrice = null;
let cachedAt = 0;
let priceFetchPromise = null;

/**
 * Fetches a fresh ETH/USD price from the external provider.
 * Throws a PRICE_ERROR on any failure.
 * @returns {Promise<number>}
 */
const fetchEthPriceFromProvider = async () => {
  const apiUrl =
    process.env.ETH_PRICE_API_URL ||
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const err = new Error(
      `Failed to fetch ETH price (HTTP ${response.status})`
    );
    err.code = "PRICE_ERROR";
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const price = Number(
    data?.ethereum?.usd ?? data?.price ?? data?.usd ?? data?.ethUsd
  );

  if (Number.isNaN(price) || price <= 0) {
    const err = new Error("Invalid ETH price received from provider");
    err.code = "PRICE_ERROR";
    throw err;
  }

  return price;
};

/**
 * Returns true when the cached price is still within the TTL window.
 * @returns {boolean}
 */
const isCacheValid = () =>
  cachedEthPrice !== null && Date.now() - cachedAt < CACHE_TTL_MS;

/**
 * Stores a new ETH price in the module-level cache.
 * @param {number} price
 */
const setCache = (price) => {
  cachedEthPrice = price;
  cachedAt = Date.now();
};

/**
 * Fetches the current ETH/USD price.
 *
 * Behaviour:
 * - Returns the cached price when it is still fresh.
 * - Deduplicates concurrent external requests (single in-flight promise).
 * - On HTTP 429 or any transient network error, returns the stale cached price
 *   if one exists rather than crashing the caller.
 * - Only throws when there is no cached price at all AND the provider fails.
 *
 * @returns {Promise<number>}
 */
const getEthPrice = async () => {
  if (isCacheValid()) {
    return cachedEthPrice;
  }

  if (priceFetchPromise) {
    try {
      return await priceFetchPromise;
    } catch {
      if (cachedEthPrice !== null) {
        return cachedEthPrice;
      }

      throw new (class extends Error {
        constructor() {
          super("Failed to fetch ETH price");
          this.code = "PRICE_ERROR";
        }
      })();
    }
  }

  priceFetchPromise = fetchEthPriceFromProvider();

  try {
    const price = await priceFetchPromise;
    setCache(price);
    return price;
  } catch (error) {
    const isRateLimit = error.status === 429;
    const isProviderError = error.code === "PRICE_ERROR";

    if ((isRateLimit || isProviderError) && cachedEthPrice !== null) {
      if (isRateLimit) {
        console.warn("ETH price API rate limited, using cached ETH price.");
      } else {
        console.warn(
          `ETH price provider error (${error.message}), using cached ETH price.`
        );
      }

      return cachedEthPrice;
    }

    if (isProviderError) {
      throw error;
    }

    const priceError = new Error(error.message || "Failed to fetch ETH price");
    priceError.code = "PRICE_ERROR";
    priceError.cause = error;
    throw priceError;
  } finally {
    priceFetchPromise = null;
  }
};

module.exports = {
  getEthPrice,
};
