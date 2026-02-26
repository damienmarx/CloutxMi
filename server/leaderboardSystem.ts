import { sql } from "drizzle-orm";
import { getDb } from "./db";

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  gamesPlayed: number;
  rank: number;
}

export interface LeaderboardStats {
  period: "weekly" | "monthly" | "allTime";
  entries: LeaderboardEntry[];
  generatedAt: Date;
}

/**
 * Get top players by total wagered (all-time)
 */
export async function getTopWagerersAllTime(limit: number = 100): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT 
        u.id as userId,
        u.username,
        COALESCE(us.totalWagered, 0) as totalWagered,
        COALESCE(us.totalWon, 0) as totalWon,
        COALESCE(us.winRate, 0) as winRate,
        COALESCE(us.gamesPlayed, 0) as gamesPlayed
      FROM users u
      LEFT JOIN userStats us ON u.id = us.userId
      WHERE us.totalWagered > 0
      ORDER BY us.totalWagered DESC
      LIMIT ? `); // Params: limit

    return (result as any[]).map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      totalWagered: parseFloat(entry.totalWagered),
      totalWon: parseFloat(entry.totalWon),
      winRate: parseFloat(entry.winRate),
      gamesPlayed: entry.gamesPlayed,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("[Leaderboard] Error fetching top wagers:", error);
    return [];
  }
}

/**
 * Get top players by win rate
 */
export async function getTopWinRateAllTime(limit: number = 100, minGames: number = 10): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT 
        u.id as userId,
        u.username,
        COALESCE(us.totalWagered, 0) as totalWagered,
        COALESCE(us.totalWon, 0) as totalWon,
        COALESCE(us.winRate, 0) as winRate,
        COALESCE(us.gamesPlayed, 0) as gamesPlayed
      FROM users u
      LEFT JOIN userStats us ON u.id = us.userId
      WHERE us.gamesPlayed >= ?
      ORDER BY us.winRate DESC, us.gamesPlayed DESC
      LIMIT ? `); // Params: minGames, limit

    return (result as any[]).map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      totalWagered: parseFloat(entry.totalWagered),
      totalWon: parseFloat(entry.totalWon),
      winRate: parseFloat(entry.winRate),
      gamesPlayed: entry.gamesPlayed,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("[Leaderboard] Error fetching top win rates:", error);
    return [];
  }
}

/**
 * Get top players by total winnings
 */
export async function getTopWinnersAllTime(limit: number = 100): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT 
        u.id as userId,
        u.username,
        COALESCE(us.totalWagered, 0) as totalWagered,
        COALESCE(us.totalWon, 0) as totalWon,
        COALESCE(us.winRate, 0) as winRate,
        COALESCE(us.gamesPlayed, 0) as gamesPlayed
      FROM users u
      LEFT JOIN userStats us ON u.id = us.userId
      WHERE us.totalWon > 0
      ORDER BY us.totalWon DESC
      LIMIT ? `); // Params: limit

    return (result as any[]).map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      totalWagered: parseFloat(entry.totalWagered),
      totalWon: parseFloat(entry.totalWon),
      winRate: parseFloat(entry.winRate),
      gamesPlayed: entry.gamesPlayed,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("[Leaderboard] Error fetching top winners:", error);
    return [];
  }
}

/**
 * Get top players by games played
 */
export async function getTopGamesPlayedAllTime(limit: number = 100): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT 
        u.id as userId,
        u.username,
        COALESCE(us.totalWagered, 0) as totalWagered,
        COALESCE(us.totalWon, 0) as totalWon,
        COALESCE(us.winRate, 0) as winRate,
        COALESCE(us.gamesPlayed, 0) as gamesPlayed
      FROM users u
      LEFT JOIN userStats us ON u.id = us.userId
      WHERE us.gamesPlayed > 0
      ORDER BY us.gamesPlayed DESC
      LIMIT ? `); // Params: limit

    return (result as any[]).map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      totalWagered: parseFloat(entry.totalWagered),
      totalWon: parseFloat(entry.totalWon),
      winRate: parseFloat(entry.winRate),
      gamesPlayed: entry.gamesPlayed,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("[Leaderboard] Error fetching top games played:", error);
    return [];
  }
}

/**
 * Get user rank by total wagered
 */
export async function getUserWagerRank(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT COUNT(*) + 1 as rank
      FROM userStats us1
      WHERE us1.totalWagered > (
        SELECT COALESCE(us2.totalWagered, 0)
        FROM userStats us2
        WHERE us2.userId = ?
      ) `); // Params: userId

    return result && result.length > 0 ? result[0].rank : null;
  } catch (error) {
    console.error("[Leaderboard] Error fetching user wager rank:", error);
    return null;
  }
}

/**
 * Get user rank by win rate
 */
export async function getUserWinRateRank(userId: number, minGames: number = 10): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT COUNT(*) + 1 as rank
      FROM userStats us1
      WHERE us1.gamesPlayed >= ?
      AND us1.winRate > (
        SELECT COALESCE(us2.winRate, 0)
        FROM userStats us2
        WHERE us2.userId = ?
      ) `); // Params: minGames, userId

    return result && result.length > 0 ? result[0].rank : null;
  } catch (error) {
    console.error("[Leaderboard] Error fetching user win rate rank:", error);
    return null;
  }
}

/**
 * Get user rank by total winnings
 */
export async function getUserWinningsRank(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT COUNT(*) + 1 as rank
      FROM userStats us1
      WHERE us1.totalWon > (
        SELECT COALESCE(us2.totalWon, 0)
        FROM userStats us2
        WHERE us2.userId = ?
      ) `); // Params: userId

    return result && result.length > 0 ? result[0].rank : null;
  } catch (error) {
    console.error("[Leaderboard] Error fetching user winnings rank:", error);
    return null;
  }
}

/**
 * Get user rank by games played
 */
export async function getUserGamesPlayedRank(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT COUNT(*) + 1 as rank
      FROM userStats us1
      WHERE us1.gamesPlayed > (
        SELECT COALESCE(us2.gamesPlayed, 0)
        FROM userStats us2
        WHERE us2.userId = ?
      ) `); // Params: userId

    return result && result.length > 0 ? result[0].rank : null;
  } catch (error) {
    console.error("[Leaderboard] Error fetching user games played rank:", error);
    return null;
  }
}

/**
 * Get user position in all leaderboards
 */
export async function getUserLeaderboardPositions(userId: number) {
  return {
    wagerRank: await getUserWagerRank(userId),
    winRateRank: await getUserWinRateRank(userId),
    winningsRank: await getUserWinningsRank(userId),
    gamesPlayedRank: await getUserGamesPlayedRank(userId),
  };
}
