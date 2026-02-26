import { sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Comprehensive User Statistics System
 * Provides detailed metrics for user performance, achievements, and progress
 */

export interface UserStats {
  userId: number;
  username: string;
  email: string;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  roi: number; // Return on Investment percentage
  winRate: number; // Win percentage
  gamesPlayed: number;
  averageBet: number;
  largestWin: number;
  largestLoss: number;
  joinedDate: Date;
  lastActiveDate: Date;
}

export interface GameStats {
  gameType: string;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
  winRate: number;
  averageBet: number;
  largestWin: number;
  roi: number;
}

export interface UserAchievements {
  userId: number;
  achievements: Achievement[];
  totalAchievements: number;
  completionPercentage: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "performance" | "special" | "vip";
  unlockedAt?: Date;
  progress?: number; // 0-100
  requirement: string;
}

export interface UserDashboard {
  user: UserStats;
  gameStats: GameStats[];
  achievements: UserAchievements;
  vipProgress: any;
  recentTransactions: any[];
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  winStreak: number;
  lossStreak: number;
  bestGameType: string;
  worstGameType: string;
  totalSessionTime: number; // in minutes
  averageSessionLength: number; // in minutes
  peakPlayTime: string; // hour of day
}

/**
 * Get comprehensive user statistics
 */
export async function getComprehensiveUserStats(userId: number): Promise<UserStats | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await (await getDb()).execute(sql`
      SELECT 
        u.id as userId,
        u.username,
        u.email,
        COALESCE(SUM(CASE WHEN t.type IN ('game_win', 'deposit') THEN t.amount ELSE 0 END), 0) as totalWon,
        COALESCE(SUM(CASE WHEN t.type IN ('game_loss', 'withdrawal') THEN t.amount ELSE 0 END), 0) as totalLost,
        COALESCE(SUM(CASE WHEN t.type LIKE 'game_%' THEN t.amount ELSE 0 END), 0) as totalWagered,
        COUNT(CASE WHEN t.type LIKE 'game_%' THEN 1 END) as gamesPlayed,
        MAX(CASE WHEN t.type = 'game_win' THEN t.amount ELSE 0 END) as largestWin,
        MAX(CASE WHEN t.type = 'game_loss' THEN t.amount ELSE 0 END) as largestLoss,
        u.createdAt as joinedDate,
        MAX(t.createdAt) as lastActiveDate
      FROM users u
      LEFT JOIN transactions t ON u.id = t.userId
      WHERE u.id = ?
      GROUP BY u.id
    `); // Params: userId

    if (!result || result.length === 0) {
      return null;
    }

    const stats = result[0];
    const totalWagered = parseFloat(stats.totalWagered || 0);
    const totalWon = parseFloat(stats.totalWon || 0);
    const totalLost = parseFloat(stats.totalLost || 0);
    const gamesPlayed = parseInt(stats.gamesPlayed || 0);

    return {
      userId: stats.userId,
      username: stats.username,
      email: stats.email,
      totalWagered,
      totalWon,
      totalLost,
      netProfit: totalWon - totalLost,
      roi: totalWagered > 0 ? ((totalWon - totalLost) / totalWagered) * 100 : 0,
      winRate: gamesPlayed > 0 ? (totalWon / gamesPlayed) * 100 : 0,
      gamesPlayed,
      averageBet: gamesPlayed > 0 ? totalWagered / gamesPlayed : 0,
      largestWin: parseFloat(stats.largestWin || 0),
      largestLoss: parseFloat(stats.largestLoss || 0),
      joinedDate: stats.joinedDate,
      lastActiveDate: stats.lastActiveDate,
    };
  } catch (error) {
    console.error("[User Stats] Error getting comprehensive stats:", error);
    return null;
  }
}

/**
 * Get game-specific statistics
 */
export async function getGameSpecificStats(userId: number): Promise<GameStats[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await (await getDb()).execute(sql`
      SELECT 
        g.gameType,
        COUNT(*) as gamesPlayed,
        SUM(g.betAmount) as totalWagered,
        SUM(CASE WHEN g.won = 1 THEN g.winAmount ELSE 0 END) as totalWon,
        SUM(CASE WHEN g.won = 0 THEN g.betAmount ELSE 0 END) as totalLost,
        AVG(g.betAmount) as averageBet,
        MAX(g.winAmount) as largestWin
      FROM gameResults g
      WHERE g.userId = ?
      GROUP BY g.gameType
      ORDER BY gamesPlayed DESC
    `); // Params: userId

    return (result || []).map((stat: any) => {
      const totalWagered = parseFloat(stat.totalWagered || 0);
      const totalWon = parseFloat(stat.totalWon || 0);
      const totalLost = parseFloat(stat.totalLost || 0);
      const gamesPlayed = parseInt(stat.gamesPlayed || 0);

      return {
        gameType: stat.gameType,
        totalBets: gamesPlayed,
        totalWagered,
        totalWon,
        totalLost,
        gamesPlayed,
        winRate: gamesPlayed > 0 ? (totalWon / gamesPlayed) * 100 : 0,
        averageBet: parseFloat(stat.averageBet || 0),
        largestWin: parseFloat(stat.largestWin || 0),
        roi: totalWagered > 0 ? ((totalWon - totalLost) / totalWagered) * 100 : 0,
      };
    });
  } catch (error) {
    console.error("[User Stats] Error getting game-specific stats:", error);
    return [];
  }
}

/**
 * Get user achievements
 */
export async function getUserAchievements(userId: number): Promise<UserAchievements> {
  const db = await getDb();
  if (!db) {
    return {
      userId,
      achievements: [],
      totalAchievements: 0,
      completionPercentage: 0,
    };
  }

  try {
    // Define all possible achievements
    const allAchievements: Achievement[] = [
      {
        id: "first_bet",
        name: "First Bet",
        description: "Place your first bet",
        icon: "🎰",
        category: "milestone",
        requirement: "Place 1 bet",
      },
      {
        id: "hundred_bets",
        name: "Betting Enthusiast",
        description: "Place 100 bets",
        icon: "🎲",
        category: "milestone",
        requirement: "Place 100 bets",
      },
      {
        id: "thousand_bets",
        name: "Professional Gambler",
        description: "Place 1000 bets",
        icon: "👑",
        category: "milestone",
        requirement: "Place 1000 bets",
      },
      {
        id: "big_win",
        name: "Big Winner",
        description: "Win 1000 in a single game",
        icon: "💰",
        category: "performance",
        requirement: "Win 1000 in one game",
      },
      {
        id: "streak_5",
        name: "On Fire",
        description: "Win 5 games in a row",
        icon: "🔥",
        category: "performance",
        requirement: "Win 5 consecutive games",
      },
      {
        id: "roi_positive",
        name: "Profitable",
        description: "Achieve positive ROI",
        icon: "📈",
        category: "performance",
        requirement: "Positive ROI",
      },
      {
        id: "vip_bronze",
        name: "Bronze Member",
        description: "Reach Bronze VIP tier",
        icon: "🥉",
        category: "vip",
        requirement: "Wager $0+",
      },
      {
        id: "vip_silver",
        name: "Silver Member",
        description: "Reach Silver VIP tier",
        icon: "🥈",
        category: "vip",
        requirement: "Wager $10,000+",
      },
      {
        id: "vip_gold",
        name: "Gold Member",
        description: "Reach Gold VIP tier",
        icon: "🥇",
        category: "vip",
        requirement: "Wager $50,000+",
      },
      {
        id: "vip_platinum",
        name: "Platinum Member",
        description: "Reach Platinum VIP tier",
        icon: "💎",
        category: "vip",
        requirement: "Wager $100,000+",
      },
      {
        id: "vip_diamond",
        name: "Diamond Member",
        description: "Reach Diamond VIP tier",
        icon: "✨",
        category: "vip",
        requirement: "Wager $500,000+",
      },
    ];

    // Get user stats to check achievements
    const userStats = await getComprehensiveUserStats(userId);
    if (!userStats) {
      return {
        userId,
        achievements: [],
        totalAchievements: 0,
        completionPercentage: 0,
      };
    }

    // Check which achievements are unlocked
    const unlockedAchievements = allAchievements.filter((achievement) => {
      switch (achievement.id) {
        case "first_bet":
          return userStats.gamesPlayed >= 1;
        case "hundred_bets":
          return userStats.gamesPlayed >= 100;
        case "thousand_bets":
          return userStats.gamesPlayed >= 1000;
        case "big_win":
          return userStats.largestWin >= 1000;
        case "roi_positive":
          return userStats.roi > 0;
        case "vip_bronze":
          return userStats.totalWagered >= 0;
        case "vip_silver":
          return userStats.totalWagered >= 10000;
        case "vip_gold":
          return userStats.totalWagered >= 50000;
        case "vip_platinum":
          return userStats.totalWagered >= 100000;
        case "vip_diamond":
          return userStats.totalWagered >= 500000;
        default:
          return false;
      }
    });

    const completionPercentage = (unlockedAchievements.length / allAchievements.length) * 100;

    return {
      userId,
      achievements: unlockedAchievements,
      totalAchievements: unlockedAchievements.length,
      completionPercentage,
    };
  } catch (error) {
    console.error("[User Stats] Error getting achievements:", error);
    return {
      userId,
      achievements: [],
      totalAchievements: 0,
      completionPercentage: 0,
    };
  }
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(userId: number): Promise<PerformanceMetrics> {
  const db = await getDb();
  if (!db) {
    return {
      winStreak: 0,
      lossStreak: 0,
      bestGameType: "N/A",
      worstGameType: "N/A",
      totalSessionTime: 0,
      averageSessionLength: 0,
      peakPlayTime: "Unknown",
    };
  }

  try {
    // Get game results ordered by time
    const results = await (await getDb()).execute(sql`
      SELECT gameType, won, createdAt
      FROM gameResults
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 100
    `); // Params: userId

    let winStreak = 0;
    let lossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    // Calculate streaks from most recent games
    for (const result of results || []) {
      if (result.won === 1) {
        currentWinStreak++;
        currentLossStreak = 0;
        winStreak = Math.max(winStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        lossStreak = Math.max(lossStreak, currentLossStreak);
      }
    }

    // Get best and worst game types
    const gameStats = await getGameSpecificStats(userId);
    const bestGameType = gameStats.length > 0 ? gameStats[0].gameType : "N/A";
    const worstGameType = gameStats.length > 0 ? gameStats[gameStats.length - 1].gameType : "N/A";

    // Get peak play time
    const peakTimeResult = await (await getDb()).execute(sql`
      SELECT HOUR(createdAt) as hour, COUNT(*) as count
      FROM gameResults
      WHERE userId = ?
      GROUP BY HOUR(createdAt)
      ORDER BY count DESC
      LIMIT 1
    `); // Params: userId

    const peakPlayTime = peakTimeResult && peakTimeResult.length > 0
      ? `${peakTimeResult[0].hour}:00 - ${peakTimeResult[0].hour + 1}:00`
      : "Unknown";

    return {
      winStreak,
      lossStreak,
      bestGameType,
      worstGameType,
      totalSessionTime: 0, // Would require session tracking
      averageSessionLength: 0, // Would require session tracking
      peakPlayTime,
    };
  } catch (error) {
    console.error("[User Stats] Error getting performance metrics:", error);
    return {
      winStreak: 0,
      lossStreak: 0,
      bestGameType: "N/A",
      worstGameType: "N/A",
      totalSessionTime: 0,
      averageSessionLength: 0,
      peakPlayTime: "Unknown",
    };
  }
}

/**
 * Get complete user dashboard
 */
export async function getCompleteDashboard(userId: number, vipProgressFn?: (userId: number) => Promise<any>): Promise<UserDashboard | null> {
  try {
    const userStats = await getComprehensiveUserStats(userId);
    if (!userStats) return null;

    const gameStats = await getGameSpecificStats(userId);
    const achievements = await getUserAchievements(userId);
    const performanceMetrics = await getPerformanceMetrics(userId);

    let vipProgress = null;
    if (vipProgressFn) {
      vipProgress = await vipProgressFn(userId);
    }

    return {
      user: userStats,
      gameStats,
      achievements,
      vipProgress,
      recentTransactions: [],
      performanceMetrics,
    };
  } catch (error) {
    console.error("[User Stats] Error getting complete dashboard:", error);
    return null;
  }
}
