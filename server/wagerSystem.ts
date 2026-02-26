import { sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * VIP Tier Configuration with all benefits
 */
export const VIP_TIERS = {
  bronze: {
    tier: "bronze",
    name: "Bronze",
    minWagered: 0,
    maxWagered: 9999,
    cashbackPercentage: 1,
    bonusMultiplier: 1.0,
    benefits: ["1% cashback", "Access to basic games"],
  },
  silver: {
    tier: "silver",
    name: "Silver",
    minWagered: 10000,
    maxWagered: 49999,
    cashbackPercentage: 2,
    bonusMultiplier: 1.25,
    benefits: ["2% cashback", "1.25x bonus multiplier", "Priority support"],
  },
  gold: {
    tier: "gold",
    name: "Gold",
    minWagered: 50000,
    maxWagered: 99999,
    cashbackPercentage: 3,
    bonusMultiplier: 1.5,
    benefits: ["3% cashback", "1.5x bonus multiplier", "VIP chat access", "Monthly bonus"],
  },
  platinum: {
    tier: "platinum",
    name: "Platinum",
    minWagered: 100000,
    maxWagered: 499999,
    cashbackPercentage: 5,
    bonusMultiplier: 2.0,
    benefits: ["5% cashback", "2.0x bonus multiplier", "Dedicated manager", "Weekly bonuses", "Exclusive events"],
  },
  diamond: {
    tier: "diamond",
    name: "Diamond",
    minWagered: 500000,
    maxWagered: Infinity,
    cashbackPercentage: 10,
    bonusMultiplier: 2.5,
    benefits: ["10% cashback", "2.5x bonus multiplier", "Personal account manager", "Daily bonuses", "VIP events", "Custom rewards"],
  },
};

/**
 * Calculate VIP tier based on total wagered amount
 */
export function calculateVipTier(totalWagered: number) {
  if (totalWagered >= 500000) return VIP_TIERS.diamond;
  if (totalWagered >= 100000) return VIP_TIERS.platinum;
  if (totalWagered >= 50000) return VIP_TIERS.gold;
  if (totalWagered >= 10000) return VIP_TIERS.silver;
  return VIP_TIERS.bronze;
}

/**
 * Get progress to next tier
 */
export function getProgressToNextTier(totalWagered: number) {
  const tiers = [VIP_TIERS.bronze, VIP_TIERS.silver, VIP_TIERS.gold, VIP_TIERS.platinum, VIP_TIERS.diamond];
  
  for (let i = 0; i < tiers.length - 1; i++) {
    if (totalWagered >= tiers[i].minWagered && totalWagered < tiers[i + 1].minWagered) {
      const currentMin = tiers[i].minWagered;
      const nextMin = tiers[i + 1].minWagered;
      const progress = ((totalWagered - currentMin) / (nextMin - currentMin)) * 100;
      return { nextTier: tiers[i + 1].name, progress: Math.min(100, Math.max(0, progress)) };
    }
  }
  
  return { nextTier: null, progress: 100 };
}

/**
 * Update user stats after a game
 */
export async function updateUserStats(userId: number, betAmount: number, won: boolean, winAmount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`SELECT * FROM userStats WHERE userId = ${userId}`);
    const existingStats = result[0] as unknown as any[];
    
    if (!existingStats || existingStats.length === 0) {
      const totalWon = won ? winAmount : 0;
      const totalLost = won ? 0 : betAmount;
      const winRate = won ? 100 : 0;
      await db.execute(sql`INSERT INTO userStats (userId, totalWagered, totalWon, totalLost, gamesPlayed, winRate) VALUES (${userId}, ${betAmount}, ${totalWon}, ${totalLost}, 1, ${winRate})`);
    } else {
      const stats = existingStats[0];
      const newTotalWagered = parseFloat(stats.totalWagered) + betAmount;
      const newTotalWon = parseFloat(stats.totalWon) + (won ? winAmount : 0);
      const newTotalLost = parseFloat(stats.totalLost) + (won ? 0 : betAmount);
      const newGamesPlayed = (stats.gamesPlayed || 0) + 1;
      const newWinRate = (newTotalWon / newTotalWagered) * 100;

      await db.execute(sql`UPDATE userStats SET totalWagered = ${newTotalWagered}, totalWon = ${newTotalWon}, totalLost = ${newTotalLost}, gamesPlayed = ${newGamesPlayed}, winRate = ${newWinRate} WHERE userId = ${userId}`);
    }
  } catch (error) {
    console.error("[Wager System] Error updating user stats:", error);
    throw error;
  }
}

/**
 * Get user stats
 */
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`SELECT * FROM userStats WHERE userId = ${userId}`);
    const stats = result[0] as unknown as any[];
    
    if (!stats || stats.length === 0) {
      return {
        userId,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        gamesPlayed: 0,
        winRate: 0,
        level: 1,
        experience: 0,
      };
    }

    return stats[0];
  } catch (error) {
    console.error("[Wager System] Error getting user stats:", error);
    throw error;
  }
}

/**
 * Calculate user level based on experience
 */
export function calculateLevel(experience: number): number {
  return Math.floor(experience / 1000) + 1;
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`
      SELECT us.*, u.username 
      FROM userStats us 
      JOIN users u ON us.userId = u.id 
      ORDER BY us.totalWagered DESC 
      LIMIT ${limit}
    `);
    return result[0] as unknown as any[];
  } catch (error) {
    console.error("[Wager System] Error getting leaderboard:", error);
    throw error;
  }
}
