import { sql } from "drizzle-orm";
import { getDb } from "./db";

export const VIP_TIERS = [
  { name: "Bronze", requirement: 0, cashback: 1 },
  { name: "Silver", requirement: 10000, cashback: 2 },
  { name: "Gold", requirement: 50000, cashback: 3 },
  { name: "Platinum", requirement: 250000, cashback: 5 },
  { name: "Diamond", requirement: 1000000, cashback: 10 },
];

export function calculateVipTier(totalWagered: number) {
  return [...VIP_TIERS].reverse().find(tier => totalWagered >= tier.requirement) || VIP_TIERS[0];
}

export function getProgressToNextTier(totalWagered: number) {
  const currentTierIndex = VIP_TIERS.findIndex(tier => totalWagered < tier.requirement);
  if (currentTierIndex === -1) return { nextTier: null, progress: 100 };
  
  const nextTier = VIP_TIERS[currentTierIndex];
  const prevRequirement = currentTierIndex > 0 ? VIP_TIERS[currentTierIndex - 1].requirement : 0;
  const progress = ((totalWagered - prevRequirement) / (nextTier.requirement - prevRequirement)) * 100;
  
  return { nextTier: nextTier.name, progress: Math.min(100, Math.max(0, progress)) };
}

export async function updateUserStats(userId: number, betAmount: number, won: boolean, winAmount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get or create user stats
  const result = await db.execute(sql` SELECT * FROM userStats WHERE userId = ${userId} `);
  const existingStats = result[0] as unknown as any[];
  
  if (!existingStats || existingStats.length === 0) {
    // Create new stats
    const totalWon = won ? winAmount : 0;
    const totalLost = won ? 0 : betAmount;
    const winRate = won ? 100 : 0;
    await db.execute(sql` INSERT INTO userStats (userId, totalWagered, totalWon, totalLost, gamesPlayed, winRate) VALUES (${userId}, ${betAmount}, ${totalWon}, ${totalLost}, 1, ${winRate}) `);
  } else {
    // Update existing stats
    const stats = existingStats[0];
    const newTotalWagered = parseFloat(stats.totalWagered) + betAmount;
    const newTotalWon = parseFloat(stats.totalWon) + (won ? winAmount : 0);
    const newTotalLost = parseFloat(stats.totalLost) + (won ? 0 : betAmount);
    const newGamesPlayed = (stats.gamesPlayed || 0) + 1;
    const newWinRate = (newTotalWon / newTotalWagered) * 100;

    await db.execute(sql` UPDATE userStats SET totalWagered = ${newTotalWagered}, totalWon = ${newTotalWon}, totalLost = ${newTotalLost}, gamesPlayed = ${newGamesPlayed}, winRate = ${newWinRate} WHERE userId = ${userId} `);
  }
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.execute(sql` SELECT * FROM userStats WHERE userId = ${userId} `);
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
}

export function calculateLevel(experience: number): number {
  return Math.floor(experience / 1000) + 1;
}

export async function getLeaderboard(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.execute(sql` 
    SELECT us.*, u.username 
    FROM userStats us 
    JOIN users u ON us.userId = u.id 
    ORDER BY us.totalWagered DESC 
    LIMIT ${limit} 
  `);
  return result[0] as unknown as any[];
}
