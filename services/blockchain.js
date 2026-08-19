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
        message: "Transaction verification failed.",
      };
    }

    if (!isAddress(expectedFrom) || !isAddress(expectedTo)) {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    const usdtAddress = getUsdtContractAddress();
    const configuredChainId = getConfiguredChainId();
    const client = getPublicClient();

    const normalizedFrom = getAddress(expectedFrom);
    const normalizedTo = getAddress(expectedTo);

    const networkChainId = await client.getChainId();

    if (networkChainId !== configuredChainId) {
      return {
        success: false,
        message: "Please switch to the correct network.",
      };
    }

    let receipt;

    try {
      receipt = await client.getTransactionReceipt({
        hash: txHash,
      });
    } catch (receiptError) {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    if (!receipt) {
      return {
        success: false,
        message: "Transaction verification failed.",
      };
    }

    if (receipt.status !== "success") {
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

    const usdtTransfers = transferLogs.filter(
      (log) => getAddress(log.address) === usdtAddress
    );

    if (usdtTransfers.length === 0) {
      return {
        success: false,
        message: "Invalid payment token.",
      };
    }

    const matchingTransfer = usdtTransfers.find((log) => {
      const from = getAddress(log.args.from);
      const to = getAddress(log.args.to);
      const value = BigInt(log.args.value);

      return (
        from === normalizedFrom &&
        to === normalizedTo &&
        value === expectedValue
      );
    });

    if (matchingTransfer) {
      return { success: true };
    }

    const senderMatch = usdtTransfers.some(
      (log) => getAddress(log.args.from) === normalizedFrom
    );

    if (!senderMatch) {
      return {
        success: false,
        message: "Transaction sender does not match the user wallet.",
      };
    }

    const destinationMatch = usdtTransfers.some(
      (log) =>
        getAddress(log.args.from) === normalizedFrom &&
        getAddress(log.args.to) === normalizedTo
    );

    if (!destinationMatch) {
      return {
        success: false,
        message: "Invalid payment destination.",
      };
    }

    return {
      success: false,
      message: "Incorrect payment amount.",
    };
  } catch (error) {
    console.error("USDT transfer verification error:", error.message);

    if (
      error.message === "Please switch to the correct network." ||
      error.message === "Invalid payment destination." ||
      error.message === "USDT_CONTRACT_ADDRESS is not configured" ||
      error.message === "ETH_RPC_URL is not configured" ||
      error.message === "CHAIN_ID is not configured"
    ) {
      return {
        success: false,
        message:
          error.message.includes("not configured")
            ? "Transaction verification failed."
            : error.message,
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
 * Admin wallet comes from MongoDB Settings.
 * @returns {Promise<{ adminWalletAddress: string, usdtContractAddress: string, chainId: number }>}
 */
const getClaimConfig = async () => {
  const { getStoredAdminWalletAddress } = require("./settings");

  return {
    adminWalletAddress: await getStoredAdminWalletAddress(),
    usdtContractAddress: getUsdtContractAddress(),
    chainId: getConfiguredChainId(),
  };
};

module.exports = {
  getPublicClient,
  getEthBalance,
  verifyUsdtTransfer,
  getClaimConfig,
  getUsdtContractAddress,
  getConfiguredChainId,
  toTokenUnits,
};
