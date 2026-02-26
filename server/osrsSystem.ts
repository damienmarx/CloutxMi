import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";

export interface ExchangeRate {
  gpToUsd: number;
  gpToEur: number;
  gpToBtc: number;
  gpToEth: number;
  lastUpdated: Date;
}

export interface MuleTransaction {
  id: string;
  userId: number;
  osrsUsername: string;
  gpAmount: number;
  usdAmount: number;
  type: "deposit" | "withdrawal";
  worldType: "f2p" | "p2p";
  assignedWorld: number;
  assignedMule: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
}

// Current OSRS GP exchange rates (in real implementation, fetch from API)
export const getCurrentExchangeRates = (): ExchangeRate => {
  // These are example rates - in production, fetch from real OSRS gold trading APIs
  const gpToUsd = 0.00001; // 1 GP = $0.00001 USD
  
  return {
    gpToUsd,
    gpToEur: gpToUsd * 0.92, // EUR conversion
    gpToBtc: gpToUsd * 0.000000025, // BTC conversion
    gpToEth: gpToUsd * 0.00000035, // ETH conversion
    lastUpdated: new Date(),
  };
};

export function convertGpToUsd(gpAmount: number): number {
  const rates = getCurrentExchangeRates();
  return gpAmount * rates.gpToUsd;
}

export function convertUsdToGp(usdAmount: number): number {
  const rates = getCurrentExchangeRates();
  return usdAmount / rates.gpToUsd;
}

export function convertGpToCrypto(gpAmount: number, crypto: "btc" | "eth"): number {
  const rates = getCurrentExchangeRates();
  if (crypto === "btc") return gpAmount * rates.gpToBtc;
  if (crypto === "eth") return gpAmount * rates.gpToEth;
  return 0;
}

// Random world selection for mule trading
export function getRandomOsrsWorld(worldType: "f2p" | "p2p"): number {
  if (worldType === "f2p") {
    // F2P worlds: 1-14
    const f2pWorlds = Array.from({ length: 14 }, (_, i) => i + 1);
    return f2pWorlds[Math.floor(Math.random() * f2pWorlds.length)];
  } else {
    // P2P worlds: 1-40+ (using 1-40 for this example)
    const p2pWorlds = Array.from({ length: 40 }, (_, i) => i + 1);
    return p2pWorlds[Math.floor(Math.random() * p2pWorlds.length)];
  }
}

// Mule pool - in production, this would be managed separately
const MULE_POOL = [
  "Mule_Alpha",
  "Mule_Beta",
  "Mule_Gamma",
  "Mule_Delta",
  "Mule_Epsilon",
  "Mule_Zeta",
  "Mule_Eta",
  "Mule_Theta",
  "Mule_Iota",
  "Mule_Kappa",
];

export function getRandomMule(): string {
  return MULE_POOL[Math.floor(Math.random() * MULE_POOL.length)];
}

export async function createMuleTransaction(
  userId: number,
  osrsUsername: string,
  gpAmount: number,
  type: "deposit" | "withdrawal",
  worldType: "f2p" | "p2p"
): Promise<MuleTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const id = nanoid();
  const usdAmount = convertGpToUsd(gpAmount);
  const assignedWorld = getRandomOsrsWorld(worldType);
  const assignedMule = getRandomMule();

  // Store in database (you'd need to create a muleTransactions table)
  // For now, returning the transaction object
  
  return {
    id,
    userId,
    osrsUsername,
    gpAmount,
    usdAmount,
    type,
    worldType,
    assignedWorld,
    assignedMule,
    status: "pending",
    createdAt: new Date(),
  };
}

export async function completeMuleTransaction(transactionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Update transaction status in database
  console.log(`[OSRS] Transaction ${transactionId} completed`);
}

export async function cancelMuleTransaction(transactionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Update transaction status to cancelled
  console.log(`[OSRS] Transaction ${transactionId} cancelled`);
}

export function formatGpAmount(gp: number): string {
  if (gp >= 1_000_000) {
    return `${(gp / 1_000_000).toFixed(2)}M GP`;
  } else if (gp >= 1_000) {
    return `${(gp / 1_000).toFixed(2)}K GP`;
  }
  return `${gp} GP`;
}

export function parseGpAmount(input: string): number {
  const normalized = input.toUpperCase().trim();
  
  if (normalized.endsWith("M")) {
    return parseFloat(normalized.slice(0, -1)) * 1_000_000;
  } else if (normalized.endsWith("K")) {
    return parseFloat(normalized.slice(0, -1)) * 1_000;
  }
  
  return parseFloat(normalized);
}

export interface OsrsDepositRequest {
  osrsUsername: string;
  gpAmount: number;
  usdAmount: number;
  worldType: "f2p" | "p2p";
  assignedWorld: number;
  assignedMule: string;
}

export function validateOsrsUsername(username: string): boolean {
  // OSRS usernames are 1-12 characters, alphanumeric + space
  return /^[a-zA-Z0-9 ]{1,12}$/.test(username);
}

export function validateGpAmount(gp: number): boolean {
  // Minimum 100k GP, maximum 2.147B GP (int32 max)
  return gp >= 100_000 && gp <= 2_147_483_647;
}
