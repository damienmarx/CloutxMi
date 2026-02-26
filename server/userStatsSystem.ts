import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { getUserVipProgress } from "./vipProgressSystem";

export interface UserStats {
  userId: number;
  username: string;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
  winRate: number;
  roi: number; // Return on investment percentage
  netProfit: number;
  averageBetSize: number;
  largestWin: number;
  largestLoss: number;
  level: number;
  experience: number;
  joinedDate: Date;
}

export interface GameStats {
  gameType: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  averageBet: number;
}

export interface DashboardData {
  userStats: UserStats;
  gameStats: GameStats[];
  vipProgress: any;
  recentTransactions: any[];
  achievements: string[];
}

/**
 * Get comprehensive user stats
 */
export async function getUserStats(userId: number): Promise<UserStats | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get user info
    const userResult = await (await getDb()).execute(sql` SELECT id, username, createdAt FROM users WHERE id = ? `); // Params: userId

    if (!userResult || userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Get or create user stats
    const statsResult = await (await getDb()).execute(sql` SELECT * FROM userStats WHERE userId = ? `); // Params: userId

    let stats;
    if (statsResult && statsResult.length > 0) {
      stats = statsResult[0];
    } else {
      // Create default stats
      await (await getDb()).execute(sql` INSERT INTO userStats (userId, totalWagered, totalWon, totalLost, gamesPlayed, winRate) VALUES (?, 0, 0, 0, 0, 0) `); // Params: userId
      stats = {
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        gamesPlayed: 0,
        winRate: 0,
        level: 1,
        experience: 0,
      };
    }

    const totalWagered = parseFloat(stats.totalWagered || 0);
    const totalWon = parseFloat(stats.totalWon || 0);
    const totalLost = parseFloat(stats.totalLost || 0);
    const netProfit = totalWon - totalLost;
    const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;
    const averageBetSize = stats.gamesPlayed > 0 ? totalWagered / stats.gamesPlayed : 0;

    return {
      userId,
      username: user.username,
      totalWagered,
      totalWon,
      totalLost,
      gamesPlayed: stats.gamesPlayed || 0,
      winRate: parseFloat(stats.winRate || 0),
      roi,
      netProfit,
      averageBetSize,
      largestWin: parseFloat(stats.largestWin || 0),
      largestLoss: parseFloat(stats.largestLoss || 0),
      level: stats.level || 1,
      experience: stats.experience || 0,
      joinedDate: user.createdAt,
    };
  } catch (error) {
    console.error("[User Stats] Error getting user stats:", error);
    return null;
  }
}

/**
 * Get game-specific statistics
 */
export async function getGameStats(userId: number): Promise<GameStats[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const games = ["keno", "slots", "crash", "blackjack", "roulette", "dice", "poker"];
    const gameStats: GameStats[] = [];

    for (const game of games) {
      const result = await (await getDb()).execute(sql` SELECT 
          COUNT(*) as gamesPlayed,
          SUM(CASE WHEN type = 'game_win' THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN type = 'game_loss' THEN 1 ELSE 0 END) as losses,
          SUM(amount) as totalAmount
        FROM transactions 
        WHERE userId = ? AND gameType = ? `); // Params: userId, game

      if (result && result.length > 0) {
        const data = result[0];
        const gamesPlayed = data.gamesPlayed || 0;
        const wins = data.wins || 0;
        const losses = data.losses || 0;
        const totalAmount = parseFloat(data.totalAmount || 0);

        // Get total wagered for this game
        const wagerResult = await (await getDb()).execute(sql` SELECT SUM(amount) as totalWagered
          FROM transactions
          WHERE userId = ? AND gameType = ? AND type IN ('game_win', 'game_loss') `); // Params: userId, game

        const totalWagered = wagerResult && wagerResult.length > 0 
          ? parseFloat(wagerResult[0].totalWagered || 0)
          : 0;

        gameStats.push({
          gameType: game,
          gamesPlayed,
          wins,
          losses,
          totalWagered,
          totalWon: Math.max(totalAmount, 0),
          winRate: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
          averageBet: gamesPlayed > 0 ? totalWagered / gamesPlayed : 0,
        });
      }
    }

    return gameStats;
  } catch (error) {
    console.error("[User Stats] Error getting game stats:", error);
    return [];
  }
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT id, type, amount, description, gameType, status, createdAt
      FROM transactions
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ? `); // Params: userId, limit

    return result || [];
  } catch (error) {
    console.error("[User Stats] Error getting recent transactions:", error);
    return [];
  }
}

/**
 * Get user achievements
 */
export async function getUserAchievements(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const stats = await getUserStats(userId);
    if (!stats) return [];

    const achievements: string[] = [];

    // First game
    if (stats.gamesPlayed >= 1) {
      achievements.push("First Game");
    }

    // 10 games
    if (stats.gamesPlayed >= 10) {
      achievements.push("Rookie");
    }

    // 100 games
    if (stats.gamesPlayed >= 100) {
      achievements.push("Veteran");
    }

    // 1000 games
    if (stats.gamesPlayed >= 1000) {
      achievements.push("Legend");
    }

    // First win
    if (stats.totalWon > 0) {
      achievements.push("First Win");
    }

    // 50% win rate
    if (stats.winRate >= 50) {
      achievements.push("Hot Streak");
    }

    // Positive ROI
    if (stats.roi > 0) {
      achievements.push("Profitable");
    }

    // 100+ ROI
    if (stats.roi >= 100) {
      achievements.push("High Roller");
    }

    // $1000+ wagered
    if (stats.totalWagered >= 1000) {
      achievements.push("Big Spender");
    }

    // $10000+ wagered
    if (stats.totalWagered >= 10000) {
      achievements.push("VIP Player");
    }

    // Silver tier
    if (stats.totalWagered >= 10000) {
      achievements.push("Silver Member");
    }

    // Gold tier
    if (stats.totalWagered >= 50000) {
      achievements.push("Gold Member");
    }

    // Platinum tier
    if (stats.totalWagered >= 100000) {
      achievements.push("Platinum Member");
    }

    // Diamond tier
    if (stats.totalWagered >= 500000) {
      achievements.push("Diamond Member");
    }

    return achievements;
  } catch (error) {
    console.error("[User Stats] Error getting achievements:", error);
    return [];
  }
}

/**
 * Get complete dashboard data
 */
export async function getUserDashboard(userId: number): Promise<DashboardData | null> {
  try {
    const userStats = await getUserStats(userId);
    if (!userStats) return null;

    const gameStats = await getGameStats(userId);
    const vipProgress = await getUserVipProgress(userId);
    const recentTransactions = await getRecentTransactions(userId, 10);
    const achievements = await getUserAchievements(userId);

    return {
      userStats,
      gameStats,
      vipProgress,
      recentTransactions,
      achievements,
    };
  } catch (error) {
    console.error("[User Stats] Error getting dashboard:", error);
    return null;
  }
}

/**
 * Update user stats after a game
 */
export async function updateUserStatsAfterGame(
  userId: number,
  gameType: string,
  betAmount: number,
  winAmount: number,
  won: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const stats = await getUserStats(userId);
    if (!stats) return;

    const newTotalWagered = stats.totalWagered + betAmount;
    const newTotalWon = stats.totalWon + (won ? winAmount : 0);
    const newTotalLost = stats.totalLost + (won ? 0 : betAmount);
    const newGamesPlayed = stats.gamesPlayed + 1;
    const newWinRate = (newTotalWon / newTotalWagered) * 100;

    // Update largest win/loss
    let largestWin = stats.largestWin;
    let largestLoss = stats.largestLoss;

    if (won && winAmount > largestWin) {
      largestWin = winAmount;
    }
    if (!won && betAmount > largestLoss) {
      largestLoss = betAmount;
    }

    // Update stats
    await sql` 
      UPDATE userStats 
      SET totalWagered = ?, totalWon = ?, totalLost = ?, gamesPlayed = ?, winRate = ?, largestWin = ?, largestLoss = ?
      WHERE userId = ?
       `,
      [newTotalWagered, newTotalWon, newTotalLost, newGamesPlayed, newWinRate, largestWin, largestLoss, userId]
  } catch (error) {
    console.error("[User Stats] Error updating stats:", error);
  }
}
