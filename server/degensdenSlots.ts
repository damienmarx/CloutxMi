import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";

/**
 * Degens♧Den Slots Game Engine
 * High-volatility slots game with bonus features
 */

export interface DegensDenSpinResult {
  spinId: string;
  userId: number;
  betAmount: number;
  paylines: number;
  reels: number[][];
  matchedLines: number[];
  totalWin: number;
  totalMultiplier: number;
  bonusTriggered: boolean;
  freeSpinsAwarded: number;
  rngSeed: string;
}

export interface DegensDenStats {
  totalSpins: number;
  totalBet: number;
  totalWon: number;
  avgMultiplier: number;
  largestWin: number;
  bonusTriggered: number;
  roi: number;
}

// Symbol values for Degens♧Den
const SYMBOLS = {
  WILD: 5,
  SCATTER: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

// Payline configurations
const PAYLINES = [
  [0, 0, 0], // Line 1
  [1, 1, 1], // Line 2
  [2, 2, 2], // Line 3
  [0, 1, 2], // Line 4
  [2, 1, 0], // Line 5
  [0, 1, 0], // Line 6
  [2, 1, 2], // Line 7
  [1, 0, 1], // Line 8
  [1, 2, 1], // Line 9
  [0, 0, 1], // Line 10
];

/**
 * Generate random reels
 */
function generateReels(): number[][] {
  const reels: number[][] = [];
  for (let i = 0; i < 3; i++) {
    const reel: number[] = [];
    for (let j = 0; j < 3; j++) {
      reel.push(Math.floor(Math.random() * 6)); // 0-5 symbols
    }
    reels.push(reel);
  }
  return reels;
}

/**
 * Check matching paylines
 */
function checkPaylines(reels: number[][], paylines: number): { matchedLines: number[]; multiplier: number } {
  const matchedLines: number[] = [];
  let totalMultiplier = 1;

  for (let i = 0; i < Math.min(paylines, PAYLINES.length); i++) {
    const payline = PAYLINES[i];
    const symbol = reels[0][payline[0]];

    if (
      symbol === reels[1][payline[1]] &&
      symbol === reels[2][payline[2]]
    ) {
      matchedLines.push(i);
      // Calculate multiplier based on symbol
      const baseMultiplier = symbol === SYMBOLS.WILD ? 5 : symbol === SYMBOLS.SCATTER ? 3 : symbol;
      totalMultiplier *= baseMultiplier;
    }
  }

  return { matchedLines, multiplier: totalMultiplier };
}

/**
 * Execute a Degens♧Den spin
 */
export async function executeDegensDenSpin(
  userId: number,
  betAmount: number,
  paylines: number
): Promise<DegensDenSpinResult> {
  const spinId = nanoid();
  const reels = generateReels();
  const { matchedLines, multiplier } = checkPaylines(reels, paylines);

  // Calculate win
  let totalWin = 0;
  let bonusTriggered = false;
  let freeSpinsAwarded = 0;

  if (matchedLines.length > 0) {
    totalWin = betAmount * multiplier * matchedLines.length;

    // Bonus trigger: 3 scatter symbols
    const scatterCount = reels.flat().filter((s) => s === SYMBOLS.SCATTER).length;
    if (scatterCount >= 3) {
      bonusTriggered = true;
      freeSpinsAwarded = 10;
      totalWin += betAmount * 5; // Bonus multiplier
    }
  }

  const spinResult: DegensDenSpinResult = {
    spinId,
    userId,
    betAmount,
    paylines,
    reels,
    matchedLines,
    totalWin,
    totalMultiplier: multiplier,
    bonusTriggered,
    freeSpinsAwarded,
    rngSeed: Math.random().toString(),
  };

  // Store spin result
  await storeSpinResult(spinResult);

  return spinResult;
}

/**
 * Store spin result in database
 */
async function storeSpinResult(spinResult: DegensDenSpinResult): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    await db.execute(sql`INSERT INTO degensDenSpins 
       (spinId, userId, betAmount, paylines, reels, matchedLines, totalWin, totalMultiplier, bonusTriggered, freeSpinsAwarded, rngSeed) 
       VALUES (${spinResult.spinId}, ${spinResult.userId}, ${spinResult.betAmount}, ${spinResult.paylines}, ${JSON.stringify(spinResult.reels)}, ${JSON.stringify(spinResult.matchedLines)}, ${spinResult.totalWin}, ${spinResult.totalMultiplier}, ${spinResult.bonusTriggered ? 1 : 0}, ${spinResult.freeSpinsAwarded}, ${spinResult.rngSeed})`);
  } catch (error) {
    console.error("[Degens♧Den] Error storing spin:", error);
    throw error;
  }
}

/**
 * Get spin history for a user
 */
export async function getUserSpinHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`SELECT * FROM degensDenSpins WHERE userId = ${userId} ORDER BY createdAt DESC LIMIT ${limit}`);
    const rows = result[0] as unknown as any[];

    return (rows || []).map((spin: any) => ({
      spinId: spin.spinId,
      userId: spin.userId,
      betAmount: parseFloat(spin.betAmount),
      paylines: spin.paylines,
      reels: typeof spin.reels === 'string' ? JSON.parse(spin.reels) : spin.reels,
      matchedLines: typeof spin.matchedLines === 'string' ? JSON.parse(spin.matchedLines) : spin.matchedLines,
      totalWin: parseFloat(spin.totalWin),
      totalMultiplier: spin.totalMultiplier,
      bonusTriggered: spin.bonusTriggered === 1,
      freeSpinsAwarded: spin.freeSpinsAwarded,
      timestamp: spin.createdAt,
    }));
  } catch (error) {
    console.error("[Degens♧Den] Error getting spin history:", error);
    return [];
  }
}

/**
 * Get Degens♧Den statistics
 */
export async function getDegensDenStats(userId: number): Promise<DegensDenStats> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql`SELECT 
        COUNT(*) as totalSpins,
        SUM(betAmount) as totalBet,
        SUM(totalWin) as totalWon,
        AVG(totalMultiplier) as avgMultiplier,
        MAX(totalWin) as largestWin,
        SUM(CASE WHEN bonusTriggered = 1 THEN 1 ELSE 0 END) as bonusTriggered
       FROM degensDenSpins 
       WHERE userId = ${userId}`);
    
    const rows = result[0] as unknown as any[];

    if (rows && rows.length > 0) {
      const stats = rows[0];
      const totalBet = parseFloat(stats.totalBet || 0);
      const totalWon = parseFloat(stats.totalWon || 0);
      
      return {
        totalSpins: stats.totalSpins || 0,
        totalBet,
        totalWon,
        avgMultiplier: parseFloat(stats.avgMultiplier || 0),
        largestWin: parseFloat(stats.largestWin || 0),
        bonusTriggered: stats.bonusTriggered || 0,
        roi: totalBet > 0 ? ((totalWon - totalBet) / totalBet) * 100 : 0,
      };
    }

    return {
      totalSpins: 0,
      totalBet: 0,
      totalWon: 0,
      avgMultiplier: 0,
      largestWin: 0,
      bonusTriggered: 0,
      roi: 0,
    };
  } catch (error) {
    console.error("[Degens♧Den] Error getting stats:", error);
    return {
      totalSpins: 0,
      totalBet: 0,
      totalWon: 0,
      avgMultiplier: 0,
      largestWin: 0,
      bonusTriggered: 0,
      roi: 0,
    };
  }
}
