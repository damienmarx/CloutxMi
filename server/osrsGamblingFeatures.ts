import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";

// ───────────────────────────────────────────────
// Interfaces
// ───────────────────────────────────────────────

export interface CryptoWallet {
  id: string;
  userId: number;
  cryptoType: "btc" | "eth" | "usdc" | "osrs_gp";
  walletAddress: string;
  balance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OsrsItemBet {
  id: string;
  userId: number;
  itemName: string;
  itemValue: number;
  gameType: string;
  betAmount: number;
  won: boolean;
  result: string;
  createdAt: Date;
}

export interface CryptoExchange {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: Date;
}

export interface CryptoPayment {
  id: string;
  userId: number;
  cryptoType: "btc" | "eth" | "usdc" | "osrs_gp";
  amount: string;
  usdValue: string;
  walletAddress: string;
  transactionHash?: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: Date;
}

export interface Clan {
  id: string;
  name: string;
  leader: number;
  description: string;
  members: number[];
  totalWagered: number;
  totalWon: number;
  createdAt: Date;
}

// ───────────────────────────────────────────────
// Constants / Data
// ───────────────────────────────────────────────

export const OSRS_ITEM_VALUES: Record<string, number> = {
  // Weapons
  "Abyssal Whip": 2500000,
  "Dragon Scimitar": 60000,
  "Godsword": 3000000,
  "Armadyl Godsword": 3500000,
  "Bandos Godsword": 3000000,
  "Saradomin Godsword": 2500000,
  "Zamorak Godsword": 2500000,
  // Armor
  "Dragon Platebody": 150000,
  "Bandos Chestplate": 2500000,
  "Armadyl Chestplate": 1500000,
  "Ancestral Robe Top": 4000000,
  "Torva Platebody": 5000000,
  // Accessories
  "Amulet of Fury": 1500000,
  "Occult Necklace": 500000,
  "Tormented Bracelet": 800000,
  "Barrows Gloves": 50000,
  // Rare Items
  "Third Age Longsword": 50000000,
  "Blue Party Hat": 100000000,
  "Party Hat": 75000000,
  // Runes & Supplies
  "Blood Rune": 300,
  "Death Rune": 100,
  "Nature Rune": 50,
  "Law Rune": 200,
  "Zamorak Book": 1000000,
  "Saradomin Book": 1000000,
  "Guthix Book": 1000000,
};

export const CRYPTO_RATES: Record<string, number> = {
  btc: 45000,     // $45,000 per BTC
  eth: 2500,      // $2,500 per ETH
  usdc: 1,        // $1 per USDC
  osrs_gp: 0.00001, // $0.00001 per GP
};

export const OSRS_COSMETICS = {
  titles: [
    "the Wealthy",
    "the Fortunate",
    "the Gambler",
    "the High Roller",
    "the Legendary",
    "the Divine",
  ],
  pets: [
    "Skilling Pet",
    "Zuk Jr.",
    "Tzrek-Jad",
    "Corporeal Beast",
    "Kalphite Princess",
  ],
  capes: [
    "Quest Cape",
    "Skill Cape",
    "Max Cape",
    "Completionist Cape",
    "Trimmed Completionist Cape",
  ],
} as const;

// ───────────────────────────────────────────────
// Functions
// ───────────────────────────────────────────────

/**
 * Get OSRS item value
 */
export function getOsrsItemValue(itemName: string): number {
  return OSRS_ITEM_VALUES[itemName] || 0;
}

/**
 * Create OSRS item bet
 */
export async function createOsrsItemBet(
  userId: number,
  itemName: string,
  gameType: string,
  betAmount: number,
  won: boolean,
  result: string
): Promise<OsrsItemBet> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const itemValue = getOsrsItemValue(itemName);
  const id = nanoid();

  const bet: OsrsItemBet = {
    id,
    userId,
    itemName,
    itemValue,
    gameType,
    betAmount,
    won,
    result,
    createdAt: new Date(),
  };

  await db.execute(sql`
    INSERT INTO osrsItemBets (id, userId, itemName, itemValue, gameType, betAmount, won, result)
    VALUES (${id}, ${userId}, ${itemName}, ${itemValue}, ${gameType}, ${betAmount}, ${won ? 1 : 0}, ${result})
  `);

  return bet;
}

/**
 * Get crypto conversion rate
 */
export function getCryptoRate(cryptoType: string): number {
  return CRYPTO_RATES[cryptoType] || 0;
}

/**
 * Convert crypto to USD
 */
export function convertCryptoToUsd(amount: number, cryptoType: string): number {
  const rate = getCryptoRate(cryptoType);
  return amount * rate;
}

/**
 * Convert USD to crypto
 */
export function convertUsdToCrypto(usdAmount: number, cryptoType: string): number {
  const rate = getCryptoRate(cryptoType);
  return usdAmount / rate;
}

/**
 * Create crypto payment
 */
export async function createCryptoPayment(
  userId: number,
  cryptoType: "btc" | "eth" | "usdc" | "osrs_gp",
  amount: number,
  walletAddress: string
): Promise<CryptoPayment> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const id = nanoid();
  const usdValue = convertCryptoToUsd(amount, cryptoType);

  const payment: CryptoPayment = {
    id,
    userId,
    cryptoType,
    amount: amount.toString(),
    usdValue: usdValue.toString(),
    walletAddress,
    status: "pending",
    createdAt: new Date(),
  };

  await db.execute(sql`
    INSERT INTO cryptoPayments (id, userId, cryptoType, amount, usdValue, walletAddress, status)
    VALUES (${id}, ${userId}, ${cryptoType}, ${amount.toString()}, ${usdValue.toString()}, ${walletAddress}, "pending")
  `);

  return payment;
}

/**
 * Get user's crypto wallets
 */
export async function getUserCryptoWallets(userId: number): Promise<CryptoWallet[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`SELECT * FROM cryptoWallets WHERE userId = ${userId}`);
    const rows = result[0] as any[];
    return rows.map((wallet: any) => ({
      id: wallet.id,
      userId: wallet.userId,
      cryptoType: wallet.cryptoType,
      walletAddress: wallet.walletAddress,
      balance: wallet.balance,
      totalDeposited: wallet.totalDeposited,
      totalWithdrawn: wallet.totalWithdrawn,
      createdAt: new Date(wallet.createdAt),
      updatedAt: new Date(wallet.updatedAt),
    }));
  } catch (error) {
    console.error("[Crypto] Error getting user wallets:", error);
    return [];
  }
}

/**
 * Award OSRS cosmetic to user
 */
export async function awardOsrsCosmetic(
  userId: number,
  cosmeticType: "title" | "pet" | "cape",
  cosmeticName: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.execute(sql`
    INSERT INTO userCosmetics (userId, cosmeticType, cosmeticName)
    VALUES (${userId}, ${cosmeticType}, ${cosmeticName})
  `);
}

/**
 * Get user's OSRS cosmetics
 */
export async function getUserCosmetics(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`SELECT * FROM userCosmetics WHERE userId = ${userId}`);
    return result[0] || [];
  } catch (error) {
    console.error("[Cosmetics] Error getting user cosmetics:", error);
    return [];
  }
}

/**
 * Create clan
 */
export async function createClan(name: string, leaderId: number, description: string): Promise<Clan> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const id = nanoid();
  const clan: Clan = {
    id,
    name,
    leader: leaderId,
    description,
    members: [leaderId],
    totalWagered: 0,
    totalWon: 0,
    createdAt: new Date(),
  };

  await db.execute(sql`
    INSERT INTO clans (id, name, leader, description, members)
    VALUES (${id}, ${name}, ${leaderId}, ${description}, ${JSON.stringify([leaderId])})
  `);

  return clan;
}

/**
 * Join clan
 */
export async function joinClan(userId: number, clanId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.execute(sql`SELECT * FROM clans WHERE id = ${clanId}`);
  const rows = result[0] as any[];

  if (!rows || rows.length === 0) {
    throw new Error("Clan not found");
  }

  const clan = rows[0];
  const members: number[] = typeof clan.members === 'string' ? JSON.parse(clan.members) : clan.members;

  if (!members.includes(userId)) {
    members.push(userId);
    await db.execute(sql`
      UPDATE clans SET members = ${JSON.stringify(members)} WHERE id = ${clanId}
    `);
  }
}
