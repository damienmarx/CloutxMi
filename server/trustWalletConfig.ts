import { sql } from "drizzle-orm";
/**
 * Trust Wallet Configuration for Degens♧Den
 * Primary wallet for receiving deposits and payments
 */

export const TRUST_WALLET_CONFIG = {
  // Primary Trust Wallet Address
  primaryWallet: "goatgang@trust",
  
  // Supported Networks on Trust Wallet
  supportedNetworks: {
    ethereum: {
      chainId: 1,
      name: "Ethereum",
      enabled: true,
      minDeposit: "0.01",
      maxDeposit: "100",
    },
    bsc: {
      chainId: 56,
      name: "Binance Smart Chain",
      enabled: true,
      minDeposit: "0.1",
      maxDeposit: "1000",
    },
    polygon: {
      chainId: 137,
      name: "Polygon",
      enabled: true,
      minDeposit: "1",
      maxDeposit: "10000",
    },
    arbitrum: {
      chainId: 42161,
      name: "Arbitrum",
      enabled: true,
      minDeposit: "0.01",
      maxDeposit: "100",
    },
    bitcoin: {
      chainId: 0,
      name: "Bitcoin",
      enabled: true,
      minDeposit: "0.001",
      maxDeposit: "10",
    },
  },

  // Supported Assets on Trust Wallet
  supportedAssets: {
    eth: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      networks: ["ethereum"],
      enabled: true,
    },
    usdc: {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      networks: ["ethereum", "bsc", "polygon", "arbitrum"],
      enabled: true,
      contractAddresses: {
        ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        bsc: "0x8AC76a51cc950d9822D68b83FE1Ad97B32Cd580d",
        polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5F86",
      },
    },
    usdt: {
      name: "Tether",
      symbol: "USDT",
      decimals: 6,
      networks: ["ethereum", "bsc", "polygon", "arbitrum"],
      enabled: true,
      contractAddresses: {
        ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        bsc: "0x55d398326f99059fF775485246999027B3197955",
        polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      },
    },
    bnb: {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
      networks: ["bsc"],
      enabled: true,
    },
    matic: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
      networks: ["polygon"],
      enabled: true,
    },
    btc: {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
      networks: ["bitcoin"],
      enabled: true,
    },
  },

  // Deposit Instructions
  depositInstructions: {
    ethereum: {
      network: "Ethereum Mainnet",
      chainId: 1,
      instructions: [
        "1. Open Trust Wallet and tap 'Receive'",
        "2. Search for and select 'Ethereum (ETH)'",
        "3. Copy your wallet address",
        "4. Send ETH or ERC-20 tokens to this address",
        "5. Minimum deposit: 0.01 ETH",
      ],
    },
    bsc: {
      network: "Binance Smart Chain",
      chainId: 56,
      instructions: [
        "1. Open Trust Wallet and tap 'Receive'",
        "2. Search for and select 'Binance Coin (BNB)'",
        "3. Copy your wallet address",
        "4. Send BNB or BEP-20 tokens to this address",
        "5. Minimum deposit: 0.1 BNB",
      ],
    },
    polygon: {
      network: "Polygon (Matic)",
      chainId: 137,
      instructions: [
        "1. Open Trust Wallet and tap 'Receive'",
        "2. Search for and select 'Polygon (MATIC)'",
        "3. Copy your wallet address",
        "4. Send MATIC or Polygon tokens to this address",
        "5. Minimum deposit: 1 MATIC",
      ],
    },
    arbitrum: {
      network: "Arbitrum One",
      chainId: 42161,
      instructions: [
        "1. Open Trust Wallet and tap 'Receive'",
        "2. Search for and select 'Arbitrum (ETH)'",
        "3. Copy your wallet address",
        "4. Send ETH or Arbitrum tokens to this address",
        "5. Minimum deposit: 0.01 ETH",
      ],
    },
    bitcoin: {
      network: "Bitcoin",
      chainId: 0,
      instructions: [
        "1. Open Trust Wallet and tap 'Receive'",
        "2. Select 'Bitcoin (BTC)'",
        "3. Copy your Bitcoin address",
        "4. Send BTC to this address",
        "5. Minimum deposit: 0.001 BTC",
      ],
    },
  },

  // Withdrawal Configuration
  withdrawalConfig: {
    minWithdrawal: {
      eth: "0.01",
      usdc: "10",
      usdt: "10",
      bnb: "0.1",
      matic: "1",
      btc: "0.001",
    },
    maxWithdrawal: {
      eth: "100",
      usdc: "10000",
      usdt: "10000",
      bnb: "1000",
      matic: "10000",
      btc: "10",
    },
    processingTime: {
      ethereum: "10-30 minutes",
      bsc: "5-15 minutes",
      polygon: "2-5 minutes",
      arbitrum: "1-2 minutes",
      bitcoin: "30-60 minutes",
    },
  },

  // Fee Configuration
  feeConfig: {
    depositFee: 0, // No deposit fee
    withdrawalFee: {
      ethereum: 0.001, // ETH
      bsc: 0.0005, // BNB
      polygon: 0.5, // MATIC
      arbitrum: 0.0005, // ETH
      bitcoin: 0.0001, // BTC
    },
  },

  // Support & Contact
  support: {
    email: "support@cloutscape.dev",
    discord: "https://discord.gg/cloutscape",
    twitter: "@DegensDen",
    website: "https://cloutscape.dev",
  },
};

/**
 * Get wallet deposit address for a user
 * In production, this would generate unique addresses per user
 */
export function getDepositAddress(userId: number, network: string): string {
  // For now, return the primary wallet
  // In production, you'd generate unique addresses per user per network
  return TRUST_WALLET_CONFIG.primaryWallet;
}

/**
 * Get deposit instructions for a network
 */
export function getDepositInstructions(network: string): string[] {
  const instructions = TRUST_WALLET_CONFIG.depositInstructions[network as keyof typeof TRUST_WALLET_CONFIG.depositInstructions];
  return instructions?.instructions || [];
}

/**
 * Validate deposit amount for a network/asset
 */
export function validateDepositAmount(
  amount: number,
  network: string,
  asset: string
): { valid: boolean; error?: string } {
  const networkConfig = TRUST_WALLET_CONFIG.supportedNetworks[network as keyof typeof TRUST_WALLET_CONFIG.supportedNetworks];
  
  if (!networkConfig) {
    return { valid: false, error: "Unsupported network" };
  }

  const minDeposit = parseFloat(networkConfig.minDeposit);
  const maxDeposit = parseFloat(networkConfig.maxDeposit);

  if (amount < minDeposit) {
    return { valid: false, error: `Minimum deposit is ${minDeposit} ${asset.toUpperCase()}` };
  }

  if (amount > maxDeposit) {
    return { valid: false, error: `Maximum deposit is ${maxDeposit} ${asset.toUpperCase()}` };
  }

  return { valid: true };
}

/**
 * Get withdrawal fee for a network
 */
export function getWithdrawalFee(network: string): number {
  return TRUST_WALLET_CONFIG.feeConfig.withdrawalFee[network as keyof typeof TRUST_WALLET_CONFIG.feeConfig.withdrawalFee] || 0;
}

/**
 * Get processing time for a network
 */
export function getProcessingTime(network: string): string {
  return TRUST_WALLET_CONFIG.withdrawalConfig.processingTime[network as keyof typeof TRUST_WALLET_CONFIG.withdrawalConfig.processingTime] || "Unknown";
}
