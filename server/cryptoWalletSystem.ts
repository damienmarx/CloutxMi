import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import crypto from "crypto";

/**
 * Crypto Wallet Management System
 * Supports BTC, ETH, USDC, and Trust Wallet Integration
 */

export type CryptoNetwork = "bitcoin" | "ethereum" | "bsc" | "polygon" | "arbitrum";
export type CryptoAsset = "btc" | "eth" | "usdc" | "usdt" | "bnb" | "matic";

export interface CryptoWallet {
  id: string;
  userId: number;
  walletAddress: string;
  network: CryptoNetwork;
  asset: CryptoAsset;
  balance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  isVerified: boolean;
  trustWalletConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CryptoTransaction {
  id: string;
  userId: number;
  walletId: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: string;
  usdValue: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  requiredConfirmations: number;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface TrustWalletConnection {
  userId: number;
  trustWalletAddress: string;
  connectedAt: Date;
  isActive: boolean;
  networks: CryptoNetwork[];
}

// Network Configuration
export const NETWORK_CONFIG: Record<CryptoNetwork, {
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  confirmationsRequired: number;
}> = {
  bitcoin: {
    chainId: 0,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://www.blockchain.com",
    confirmationsRequired: 3,
  },
  ethereum: {
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io",
    confirmationsRequired: 12,
  },
  bsc: {
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    blockExplorer: "https://bscscan.com",
    confirmationsRequired: 5,
  },
  polygon: {
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    confirmationsRequired: 128,
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    confirmationsRequired: 1,
  },
};

// Asset Configuration
export const ASSET_CONFIG: Record<CryptoAsset, {
  name: string;
  symbol: string;
  decimals: number;
  networks: CryptoNetwork[];
  contractAddress?: Record<string, string>;
}> = {
  btc: {
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 8,
    networks: ["bitcoin"],
  },
  eth: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    networks: ["ethereum"],
  },
  usdc: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    networks: ["ethereum", "bsc", "polygon", "arbitrum"],
    contractAddress: {
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
    contractAddress: {
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
  },
  matic: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
    networks: ["polygon"],
  },
};

/**
 * Create or retrieve a crypto wallet for a user
 */
export async function getOrCreateWallet(
  userId: number,
  network: CryptoNetwork,
  asset: CryptoAsset,
  walletAddress: string
): Promise<CryptoWallet> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Check if wallet already exists
    const result = await db.execute(sql` SELECT * FROM cryptoWallets WHERE userId = ${userId} AND network = ${network} AND asset = ${asset} `);
    const rows = result[0] as unknown as any[];
    const existing = rows && rows.length > 0 ? rows[0] : null;

    if (existing) {
      const w = existing;
      return {
        id: w.id,
        userId: w.userId,
        walletAddress: w.walletAddress,
        network: w.network,
        asset: w.asset,
        balance: w.balance,
        totalDeposited: w.totalDeposited,
        totalWithdrawn: w.totalWithdrawn,
        isVerified: w.isVerified === 1,
        trustWalletConnected: w.trustWalletConnected === 1,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt),
      };
    }

    // Create new wallet
    const walletId = nanoid();
    await db.execute(sql` INSERT INTO cryptoWallets (id, userId, walletAddress, network, asset, balance, totalDeposited, totalWithdrawn, isVerified, trustWalletConnected)
       VALUES (${walletId}, ${userId}, ${walletAddress}, ${network}, ${asset}, "0", "0", "0", 0, 0) `);

    return {
      id: walletId,
      userId,
      walletAddress,
      network,
      asset,
      balance: "0",
      totalDeposited: "0",
      totalWithdrawn: "0",
      isVerified: false,
      trustWalletConnected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("[Crypto Wallet] Error creating wallet:", error);
    throw error;
  }
}

/**
 * Connect Trust Wallet to user account
 */
export async function connectTrustWallet(
  userId: number,
  trustWalletAddress: string,
  networks: CryptoNetwork[]
): Promise<TrustWalletConnection> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Validate wallet address format
    if (!trustWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid Ethereum wallet address format");
    }

    // Check if already connected
    const result = await db.execute(sql` SELECT * FROM trustWalletConnections WHERE userId = ${userId} `);
    const rows = result[0] as unknown as any[];
    const existing = rows && rows.length > 0 ? rows[0] : null;

    if (existing) {
      // Update existing connection
      await db.execute(sql` UPDATE trustWalletConnections SET trustWalletAddress = ${trustWalletAddress}, networks = ${JSON.stringify(networks)}, isActive = 1, connectedAt = NOW()
         WHERE userId = ${userId} `);
    } else {
      // Create new connection
      await db.execute(sql` INSERT INTO trustWalletConnections (userId, trustWalletAddress, networks, isActive)
         VALUES (${userId}, ${trustWalletAddress}, ${JSON.stringify(networks)}, 1) `);
    }

    return {
      userId,
      trustWalletAddress,
      connectedAt: new Date(),
      isActive: true,
      networks,
    };
  } catch (error) {
    console.error("[Crypto Wallet] Error connecting Trust Wallet:", error);
    throw error;
  }
}

/**
 * Get user's Trust Wallet connection
 */
export async function getTrustWalletConnection(userId: number): Promise<TrustWalletConnection | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql` SELECT * FROM trustWalletConnections WHERE userId = ${userId} AND isActive = 1 `);
    const rows = result[0] as unknown as any[];

    if (!rows || rows.length === 0) {
      return null;
    }

    const conn = rows[0];
    return {
      userId: conn.userId,
      trustWalletAddress: conn.trustWalletAddress,
      connectedAt: new Date(conn.connectedAt),
      isActive: conn.isActive === 1,
      networks: typeof conn.networks === 'string' ? JSON.parse(conn.networks) : conn.networks,
    };
  } catch (error) {
    console.error("[Crypto Wallet] Error getting Trust Wallet connection:", error);
    return null;
  }
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: number): Promise<CryptoWallet[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql` SELECT * FROM cryptoWallets WHERE userId = ${userId} ORDER BY createdAt DESC `);
    const rows = result[0] as unknown as any[];

    return (rows || []).map((wallet: any) => ({
      id: wallet.id,
      userId: wallet.userId,
      walletAddress: wallet.walletAddress,
      network: wallet.network,
      asset: wallet.asset,
      balance: wallet.balance,
      totalDeposited: wallet.totalDeposited,
      totalWithdrawn: wallet.totalWithdrawn,
      isVerified: wallet.isVerified === 1,
      trustWalletConnected: wallet.trustWalletConnected === 1,
      createdAt: new Date(wallet.createdAt),
      updatedAt: new Date(wallet.updatedAt),
    }));
  } catch (error) {
    console.error("[Crypto Wallet] Error getting user wallets:", error);
    return [];
  }
}

/**
 * Record a crypto transaction
 */
export async function recordCryptoTransaction(
  userId: number,
  walletId: string,
  type: "deposit" | "withdrawal" | "transfer",
  amount: string,
  usdValue: string,
  txHash: string
): Promise<CryptoTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const transactionId = nanoid();

    await db.execute(sql` INSERT INTO cryptoTransactions (id, userId, walletId, type, amount, usdValue, txHash, status, confirmations, requiredConfirmations)
       VALUES (${transactionId}, ${userId}, ${walletId}, ${type}, ${amount}, ${usdValue}, ${txHash}, "pending", 0, 12) `);

    return {
      id: transactionId,
      userId,
      walletId,
      type,
      amount,
      usdValue,
      txHash,
      status: "pending",
      confirmations: 0,
      requiredConfirmations: 12,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("[Crypto Wallet] Error recording transaction:", error);
    throw error;
  }
}

/**
 * Get transaction history for a wallet
 */
export async function getWalletTransactionHistory(walletId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql` SELECT * FROM cryptoTransactions WHERE walletId = ${walletId} ORDER BY createdAt DESC LIMIT ${limit} `);
    const rows = result[0] as unknown as any[];

    return (rows || []).map((tx: any) => ({
      id: tx.id,
      userId: tx.userId,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      usdValue: tx.usdValue,
      txHash: tx.txHash,
      status: tx.status,
      confirmations: tx.confirmations,
      requiredConfirmations: tx.requiredConfirmations,
      createdAt: new Date(tx.createdAt),
      confirmedAt: tx.confirmedAt ? new Date(tx.confirmedAt) : undefined,
    }));
  } catch (error) {
    console.error("[Crypto Wallet] Error getting transaction history:", error);
    return [];
  }
}

/**
 * Generate a unique deposit address for a user
 */
export function generateDepositAddress(userId: number, network: CryptoNetwork): string {
  // Create a deterministic but unique address based on user ID and network
  const hash = crypto
    .createHash("sha256")
    .update(`${userId}-${network}-${Date.now()}`)
    .digest("hex");

  // For Ethereum-compatible networks, format as 0x + first 40 hex chars
  if (["ethereum", "bsc", "polygon", "arbitrum"].includes(network)) {
    return "0x" + hash.substring(0, 40);
  }

  // For Bitcoin, use a different format
  return hash.substring(0, 34);
}
