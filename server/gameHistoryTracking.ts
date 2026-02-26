import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";

/**
 * Game History Tracking System
 * Tracks detailed game results for Keno, Slots, and other games
 */

export interface GameHistoryRecord {
  id: string;
  userId: number;
  gameType: string;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  won: boolean;
  duration: number; // in seconds
  timestamp: Date;
  details?: Record<string, any>; // Game-specific details (symbols, numbers, etc.)
}

export interface GameHistoryFilter {
  gameType?: string;
  startDate?: Date;
  endDate?: Date;
  minBet?: number;
  maxBet?: number;
  limit?: number;
  offset?: number;
}

export interface GameHistoryStats {
  totalGames: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  winRate: number;
  averageBet: number;
  averageWin: number;
  largestWin: number;
  largestLoss: number;
  roi: number;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Record a game result
 */
export async function recordGameHistory(
  userId: number,
  gameType: string,
  betAmount: number,
  winAmount: number,
  won: boolean,
  duration: number,
  details?: Record<string, any>
): Promise<GameHistoryRecord | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const recordId = nanoid();
    const multiplier = betAmount > 0 ? winAmount / betAmount : 0;

    await (await getDb()).execute(sql`
      INSERT INTO gameHistory 
      (id, userId, gameType, betAmount, winAmount, multiplier, won, duration, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `); // Params: recordId, userId, gameType, betAmount, winAmount, multiplier, won ? 1 : 0, duration, details ? JSON.stringify(details) : null

    return {
      id: recordId,
      userId,
      gameType,
      betAmount,
      winAmount,
      multiplier,
      won,
      duration,
      timestamp: new Date(),
      details,
    };
  } catch (error) {
    console.error("[Game History] Error recording game:", error);
    return null;
  }
}

/**
 * Get game history for a user with filtering
 */
export async function getGameHistory(
  userId: number,
  filter: GameHistoryFilter = {}
): Promise<GameHistoryRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = `
      SELECT * FROM gameHistory
      WHERE userId = ?
    `;
    const params: any[] = [userId];

    if (filter.gameType) {
      query += ` AND gameType = ?`;
      params.push(filter.gameType);
    }

    if (filter.startDate) {
      query += ` AND timestamp >= ?`;
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      query += ` AND timestamp <= ?`;
      params.push(filter.endDate);
    }

    if (filter.minBet) {
      query += ` AND betAmount >= ?`;
      params.push(filter.minBet);
    }

    if (filter.maxBet) {
      query += ` AND betAmount <= ?`;
      params.push(filter.maxBet);
    }

    query += ` ORDER BY timestamp DESC`;

    if (filter.limit) {
      query += ` LIMIT ?`;
      params.push(filter.limit);
    }

    if (filter.offset) {
      query += ` OFFSET ?`;
      params.push(filter.offset);
    }

    const result = await (await getDb()).execute(sql.raw(query, params));

    return (result || []).map((record: any) => ({
      id: record.id,
      userId: record.userId,
      gameType: record.gameType,
      betAmount: parseFloat(record.betAmount),
      winAmount: parseFloat(record.winAmount),
      multiplier: parseFloat(record.multiplier),
      won: record.won === 1,
      duration: record.duration,
      timestamp: record.timestamp,
      details: record.details ? JSON.parse(record.details) : undefined,
    }));
  } catch (error) {
    console.error("[Game History] Error getting game history:", error);
    return [];
  }
}

/**
 * Get game history statistics
 */
export async function getGameHistoryStats(
  userId: number,
  filter: GameHistoryFilter = {}
): Promise<GameHistoryStats> {
  const db = await getDb();
  if (!db) {
    return {
      totalGames: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      winRate: 0,
      averageBet: 0,
      averageWin: 0,
      largestWin: 0,
      largestLoss: 0,
      roi: 0,
      timeRange: {
        startDate: new Date(),
        endDate: new Date(),
      },
    };
  }

  try {
    let query = `
      SELECT 
        COUNT(*) as totalGames,
        SUM(betAmount) as totalWagered,
        SUM(CASE WHEN won = 1 THEN winAmount ELSE 0 END) as totalWon,
        SUM(CASE WHEN won = 0 THEN betAmount ELSE 0 END) as totalLost,
        AVG(betAmount) as averageBet,
        AVG(CASE WHEN won = 1 THEN winAmount ELSE 0 END) as averageWin,
        MAX(winAmount) as largestWin,
        MAX(CASE WHEN won = 0 THEN betAmount ELSE 0 END) as largestLoss,
        MIN(timestamp) as startDate,
        MAX(timestamp) as endDate
      FROM gameHistory
      WHERE userId = ?
    `;
    const params: any[] = [userId];

    if (filter.gameType) {
      query += ` AND gameType = ?`;
      params.push(filter.gameType);
    }

    if (filter.startDate) {
      query += ` AND timestamp >= ?`;
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      query += ` AND timestamp <= ?`;
      params.push(filter.endDate);
    }

    const result = await (await getDb()).execute(sql.raw(query, params));

    if (!result || result.length === 0) {
      return {
        totalGames: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        winRate: 0,
        averageBet: 0,
        averageWin: 0,
        largestWin: 0,
        largestLoss: 0,
        roi: 0,
        timeRange: {
          startDate: new Date(),
          endDate: new Date(),
        },
      };
    }

    const stats = result[0];
    const totalGames = parseInt(stats.totalGames || 0);
    const totalWagered = parseFloat(stats.totalWagered || 0);
    const totalWon = parseFloat(stats.totalWon || 0);
    const totalLost = parseFloat(stats.totalLost || 0);

    return {
      totalGames,
      totalWagered,
      totalWon,
      totalLost,
      winRate: totalGames > 0 ? (totalWon / totalGames) * 100 : 0,
      averageBet: parseFloat(stats.averageBet || 0),
      averageWin: parseFloat(stats.averageWin || 0),
      largestWin: parseFloat(stats.largestWin || 0),
      largestLoss: parseFloat(stats.largestLoss || 0),
      roi: totalWagered > 0 ? ((totalWon - totalLost) / totalWagered) * 100 : 0,
      timeRange: {
        startDate: stats.startDate,
        endDate: stats.endDate,
      },
    };
  } catch (error) {
    console.error("[Game History] Error getting game history stats:", error);
    return {
      totalGames: 0,
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      winRate: 0,
      averageBet: 0,
      averageWin: 0,
      largestWin: 0,
      largestLoss: 0,
      roi: 0,
      timeRange: {
        startDate: new Date(),
        endDate: new Date(),
      },
    };
  }
}

/**
 * Get game statistics by type
 */
export async function getGameStatsByType(userId: number): Promise<Record<string, GameHistoryStats>> {
  const db = await getDb();
  if (!db) return {};

  try {
    const result = await (await getDb()).execute(sql`
      SELECT 
        gameType,
        COUNT(*) as totalGames,
        SUM(betAmount) as totalWagered,
        SUM(CASE WHEN won = 1 THEN winAmount ELSE 0 END) as totalWon,
        SUM(CASE WHEN won = 0 THEN betAmount ELSE 0 END) as totalLost,
        AVG(betAmount) as averageBet,
        MAX(winAmount) as largestWin
      FROM gameHistory
      WHERE userId = ?
      GROUP BY gameType
      ORDER BY totalGames DESC
    `); // Params: userId

    const stats: Record<string, GameHistoryStats> = {};

    (result || []).forEach((row: any) => {
      const totalWagered = parseFloat(row.totalWagered || 0);
      const totalWon = parseFloat(row.totalWon || 0);
      const totalLost = parseFloat(row.totalLost || 0);
      const totalGames = parseInt(row.totalGames || 0);

      stats[row.gameType] = {
        totalGames,
        totalWagered,
        totalWon,
        totalLost,
        winRate: totalGames > 0 ? (totalWon / totalGames) * 100 : 0,
        averageBet: parseFloat(row.averageBet || 0),
        averageWin: totalGames > 0 ? totalWon / totalGames : 0,
        largestWin: parseFloat(row.largestWin || 0),
        largestLoss: 0,
        roi: totalWagered > 0 ? ((totalWon - totalLost) / totalWagered) * 100 : 0,
        timeRange: {
          startDate: new Date(),
          endDate: new Date(),
        },
      };
    });

    return stats;
  } catch (error) {
    console.error("[Game History] Error getting game stats by type:", error);
    return {};
  }
}

/**
 * Get recent wins
 */
export async function getRecentWins(userId: number, limit: number = 10): Promise<GameHistoryRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await (await getDb()).execute(sql`
      SELECT * FROM gameHistory
      WHERE userId = ? AND won = 1
      ORDER BY timestamp DESC
      LIMIT ?
    `); // Params: userId, limit

    return (result || []).map((record: any) => ({
      id: record.id,
      userId: record.userId,
      gameType: record.gameType,
      betAmount: parseFloat(record.betAmount),
      winAmount: parseFloat(record.winAmount),
      multiplier: parseFloat(record.multiplier),
      won: true,
      duration: record.duration,
      timestamp: record.timestamp,
      details: record.details ? JSON.parse(record.details) : undefined,
    }));
  } catch (error) {
    console.error("[Game History] Error getting recent wins:", error);
    return [];
  }
}

/**
 * Get biggest wins
 */
export async function getBiggestWins(userId: number, limit: number = 10): Promise<GameHistoryRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await (await getDb()).execute(sql`
      SELECT * FROM gameHistory
      WHERE userId = ? AND won = 1
      ORDER BY winAmount DESC
      LIMIT ?
    `); // Params: userId, limit

    return (result || []).map((record: any) => ({
      id: record.id,
      userId: record.userId,
      gameType: record.gameType,
      betAmount: parseFloat(record.betAmount),
      winAmount: parseFloat(record.winAmount),
      multiplier: parseFloat(record.multiplier),
      won: true,
      duration: record.duration,
      timestamp: record.timestamp,
      details: record.details ? JSON.parse(record.details) : undefined,
    }));
  } catch (error) {
    console.error("[Game History] Error getting biggest wins:", error);
    return [];
  }
}

/**
 * Export game history to CSV format
 */
export async function exportGameHistoryToCSV(userId: number): Promise<string> {
  const history = await getGameHistory(userId, { limit: 10000 });

  if (history.length === 0) {
    return "No game history found";
  }

  const headers = [
    "Game Type",
    "Bet Amount",
    "Win Amount",
    "Multiplier",
    "Result",
    "Duration (seconds)",
    "Timestamp",
  ];

  const rows = history.map((record) => [
    record.gameType,
    record.betAmount.toFixed(2),
    record.winAmount.toFixed(2),
    record.multiplier.toFixed(2),
    record.won ? "WIN" : "LOSS",
    record.duration,
    record.timestamp.toISOString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}
