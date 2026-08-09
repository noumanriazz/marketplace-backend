const {
  createPublicClient,
  http,
  formatEther,
  isAddress,
  isHash,
  getAddress,
  parseEventLogs,
  erc20Abi,
} = require("viem");
const { mainnet } = require("viem/chains");

let publicClient = null;

const getConfiguredChainId = () => {
  const chainId = Number(process.env.CHAIN_ID);

  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error("CHAIN_ID is not configured");
  }

  return chainId;
};

const getUsdtContractAddress = () => {
  const address = process.env.USDT_CONTRACT_ADDRESS;

  if (!address || !isAddress(address)) {
    throw new Error("USDT_CONTRACT_ADDRESS is not configured");
  }

  return getAddress(address);
};

const getAdminWalletAddress = () => {
  const address = process.env.ADMIN_WALLET_ADDRESS;

  if (!address || !isAddress(address)) {
    throw new Error("ADMIN_WALLET_ADDRESS is not configured");
  }

  return getAddress(address);
};

const getPublicClient = () => {
  if (publicClient) {
    return publicClient;
  }

  const rpcUrl = process.env.ETH_RPC_URL;

  if (!rpcUrl) {
    throw new Error("ETH_RPC_URL is not configured");
  }

  publicClient = createPublicClient({
    chain: {
      ...mainnet,
      id: getConfiguredChainId(),
    },
    transport: http(rpcUrl),
  });

  return publicClient;
};

/**
 * Converts a human-readable token amount to base units using BigInt.
 * @param {number|string} amount
 * @param {number} decimals
 * @returns {bigint}
 */
const toTokenUnits = (amount, decimals) => {
  const tokenDecimals = Number(decimals);

  if (!Number.isInteger(tokenDecimals) || tokenDecimals < 0) {
    throw new Error("Invalid token decimals");
  }

  const raw =
    typeof amount === "number"
      ? amount.toFixed(tokenDecimals)
      : String(amount).trim();

  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("Invalid token amount");
  }

  const [whole, fraction = ""] = raw.split(".");

  if (fraction.length > tokenDecimals) {
    throw new Error("Amount precision exceeds token decimals");
  }

  const paddedFraction = fraction.padEnd(tokenDecimals, "0");
  const combined = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, "");

  return BigInt(combined || "0");
};

/**
 * Reads the ETH balance for a wallet address from Ethereum.
 * @param {string} walletAddress
 * @returns {Promise<string>} Balance in ETH (human-readable string)
 */
const getEthBalance = async (walletAddress) => {
  if (!walletAddress || typeof walletAddress !== "string") {
    throw new Error("Wallet address is required");
  }

  if (!isAddress(walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  try {
    const client = getPublicClient();
    const balanceWei = await client.getBalance({
      address: walletAddress,
    });

    return formatEther(balanceWei);
  } catch (error) {
    if (
      error.message === "ETH_RPC_URL is not configured" ||
      error.message === "CHAIN_ID is not configured"
    ) {
      throw error;
    }

    if (error.message === "Invalid wallet address") {
      throw error;
    }

    const rpcMessage =
      error?.shortMessage ||
      error?.details ||
      error?.message ||
      "Failed to fetch balance from RPC";

    const rpcError = new Error(rpcMessage);
    rpcError.code = "RPC_ERROR";
    rpcError.cause = error;
    throw rpcError;
  }
};

/**
 * Verifies an ERC-20 USDT transfer transaction on-chain.
 *
 * @param {{
 *   txHash: string,
 *   expectedFrom: string,
 *   expectedTo: string,
 *   expectedAmount: number|string
 * }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const verifyUsdtTransfer = async ({
  txHash,
  expectedFrom,
  expectedTo,
  expectedAmount,
}) => {
  try {
    if (!txHash || !isHash(txHash)) {
      return {
        success: false,
        message: "Invalid transaction hash.",
      };
    }

    if (!isAddress(expectedFrom) || !isAddress(expectedTo)) {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    const usdtAddress = getUsdtContractAddress();
    const adminWallet = getAdminWalletAddress();
    const configuredChainId = getConfiguredChainId();
    const client = getPublicClient();

    if (getAddress(expectedTo) !== adminWallet) {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    const networkChainId = await client.getChainId();

    if (networkChainId !== configuredChainId) {
      return {
        success: false,
        message: "Please switch to the correct network.",
      };
    }

    const receipt = await client.getTransactionReceipt({
      hash: txHash,
    });

    if (!receipt || receipt.status !== "success") {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    const decimals = await client.readContract({
      address: usdtAddress,
      abi: erc20Abi,
      functionName: "decimals",
    });

    const expectedValue = toTokenUnits(expectedAmount, Number(decimals));

    const transferLogs = parseEventLogs({
      abi: erc20Abi,
      eventName: "Transfer",
      logs: receipt.logs,
    });

    const matchingTransfer = transferLogs.find((log) => {
      if (getAddress(log.address) !== usdtAddress) {
        return false;
      }

      const from = getAddress(log.args.from);
      const to = getAddress(log.args.to);
      const value = BigInt(log.args.value);

      return (
        from === getAddress(expectedFrom) &&
        to === getAddress(expectedTo) &&
        value === expectedValue
      );
    });

    if (!matchingTransfer) {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("USDT transfer verification error:", error.message);

    if (error.message === "Please switch to the correct network.") {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: "Transaction verification failed.",
    };
  }
};

/**
 * Returns claim configuration for the frontend.
 * @returns {{ adminWalletAddress: string, usdtContractAddress: string, chainId: number }}
 */
const getClaimConfig = () => ({
  adminWalletAddress: getAdminWalletAddress(),
  usdtContractAddress: getUsdtContractAddress(),
  chainId: getConfiguredChainId(),
});

module.exports = {
  getPublicClient,
  getEthBalance,
  verifyUsdtTransfer,
  getClaimConfig,
  getAdminWalletAddress,
  getUsdtContractAddress,
  toTokenUnits,
};
