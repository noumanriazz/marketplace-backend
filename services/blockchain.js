const { createPublicClient, http, formatEther, isAddress } = require("viem");
const { mainnet } = require("viem/chains");

let publicClient = null;

const getPublicClient = () => {
  if (publicClient) {
    return publicClient;
  }

  const rpcUrl = process.env.ETH_RPC_URL;

  if (!rpcUrl) {
    throw new Error("ETH_RPC_URL is not configured");
  }

  publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });

  return publicClient;
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
    if (error.message === "ETH_RPC_URL is not configured") {
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

module.exports = {
  getPublicClient,
  getEthBalance,
};
