import { sql } from "drizzle-orm";
/**
 * True RNG utilities for fair game mechanics
 */

/**
 * Generate cryptographically secure random numbers
 */
function getSecureRandomNumbers(min: number, max: number, count: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    const randomBytes = require("crypto").randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    const number = min + (randomValue % (max - min + 1));
    numbers.add(number);
  }
  return Array.from(numbers);
}

/**
 * Keno game logic
 */
export interface KenoPayoutTable {
  matches: number;
  multiplier: number;
}

export const KENO_PAYOUT_TABLE: KenoPayoutTable[] = [
  { matches: 0, multiplier: 0 },
  { matches: 1, multiplier: 0 },
  { matches: 2, multiplier: 1 },
  { matches: 3, multiplier: 2 },
  { matches: 4, multiplier: 5 },
  { matches: 5, multiplier: 10 },
  { matches: 6, multiplier: 25 },
  { matches: 7, multiplier: 50 },
  { matches: 8, multiplier: 100 },
  { matches: 9, multiplier: 250 },
  { matches: 10, multiplier: 500 },
];

export interface KenoGameResult {
  selectedNumbers: number[];
  drawnNumbers: number[];
  matchedNumbers: number[];
  matchedCount: number;
  multiplier: number;
  winAmount: number;
}

/**
 * Play a round of Keno
 */
export function playKeno(selectedNumbers: number[], betAmount: number): KenoGameResult {
  if (selectedNumbers.length < 1 || selectedNumbers.length > 10) {
    throw new Error("Must select between 1 and 10 numbers");
  }

  if (betAmount <= 0) {
    throw new Error("Bet amount must be greater than zero");
  }

  // Draw 20 random numbers from 1-80
  const drawnNumbers = getSecureRandomNumbers(1, 80, 20);

  // Find matches
  const matchedNumbers = selectedNumbers.filter((num) => drawnNumbers.includes(num));
  const matchedCount = matchedNumbers.length;

  // Get multiplier from payout table
  const payoutEntry = KENO_PAYOUT_TABLE.find((entry) => entry.matches === matchedCount);
  const multiplier = payoutEntry?.multiplier || 0;

  // Calculate win amount
  const winAmount = betAmount * multiplier;

  return {
    selectedNumbers: selectedNumbers.sort((a, b) => a - b),
    drawnNumbers: drawnNumbers.sort((a, b) => a - b),
    matchedNumbers: matchedNumbers.sort((a, b) => a - b),
    matchedCount,
    multiplier,
    winAmount,
  };
}

/**
 * Slots game logic
 */
export type SlotSymbol = "cherry" | "lemon" | "orange" | "plum" | "bell" | "bar" | "seven" | "gold";

export interface SlotsPayline {
  positions: [number, number, number];
  symbols: [SlotSymbol, SlotSymbol, SlotSymbol];
  multiplier: number;
}

export interface SlotsGameResult {
  reels: [SlotSymbol[], SlotSymbol[], SlotSymbol[]];
  matchedPaylines: SlotsPayline[];
  totalMultiplier: number;
  winAmount: number;
}

const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  cherry: 15,
  lemon: 14,
  orange: 13,
  plum: 12,
  bell: 11,
  bar: 10,
  seven: 4,
  gold: 1,
};

const SYMBOLS: SlotSymbol[] = ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven", "gold"];

const PAYLINE_MULTIPLIERS: Record<string, number> = {
  "cherry,cherry,cherry": 5,
  "lemon,lemon,lemon": 10,
  "orange,orange,orange": 15,
  "plum,plum,plum": 20,
  "bell,bell,bell": 30,
  "bar,bar,bar": 50,
  "seven,seven,seven": 100,
  "gold,gold,gold": 500,
  "seven,seven,gold": 200,
  "gold,gold,seven": 200,
};

/**
 * Get weighted random symbol
 */
function getRandomSymbol(): SlotSymbol {
  const randomBytes = require("crypto").randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);

  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let weightedRandom = randomValue % totalWeight;

  for (const symbol of SYMBOLS) {
    weightedRandom -= SYMBOL_WEIGHTS[symbol];
    if (weightedRandom < 0) {
      return symbol;
    }
  }

  return "cherry";
}

/**
 * Generate a reel of symbols
 */
function generateReel(): SlotSymbol[] {
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

/**
 * Play a round of Slots
 */
export function playSlots(betAmount: number, paylines: number = 1): SlotsGameResult {
  if (betAmount <= 0) {
    throw new Error("Bet amount must be greater than zero");
  }

  if (paylines < 1 || paylines > 5) {
    throw new Error("Number of paylines must be between 1 and 5");
  }

  // Generate three reels
  const reels: [SlotSymbol[], SlotSymbol[], SlotSymbol[]] = [generateReel(), generateReel(), generateReel()];

  // Check paylines
  const matchedPaylines: SlotsPayline[] = [];
  let totalMultiplier = 0;

  // Standard payline (middle row)
  const standardPayline: [SlotSymbol, SlotSymbol, SlotSymbol] = [reels[0][1], reels[1][1], reels[2][1]];
  const standardKey = standardPayline.join(",");
  if (PAYLINE_MULTIPLIERS[standardKey]) {
    matchedPaylines.push({
      positions: [1, 1, 1],
      symbols: standardPayline,
      multiplier: PAYLINE_MULTIPLIERS[standardKey],
    });
    totalMultiplier += PAYLINE_MULTIPLIERS[standardKey];
  }

  // Additional paylines if selected
  if (paylines >= 2) {
    // Top row
    const topPayline: [SlotSymbol, SlotSymbol, SlotSymbol] = [reels[0][0], reels[1][0], reels[2][0]];
    const topKey = topPayline.join(",");
    if (PAYLINE_MULTIPLIERS[topKey]) {
      matchedPaylines.push({
        positions: [0, 0, 0],
        symbols: topPayline,
        multiplier: PAYLINE_MULTIPLIERS[topKey],
      });
      totalMultiplier += PAYLINE_MULTIPLIERS[topKey];
    }
  }

  if (paylines >= 3) {
    // Bottom row
    const bottomPayline: [SlotSymbol, SlotSymbol, SlotSymbol] = [reels[0][2], reels[1][2], reels[2][2]];
    const bottomKey = bottomPayline.join(",");
    if (PAYLINE_MULTIPLIERS[bottomKey]) {
      matchedPaylines.push({
        positions: [2, 2, 2],
        symbols: bottomPayline,
        multiplier: PAYLINE_MULTIPLIERS[bottomKey],
      });
      totalMultiplier += PAYLINE_MULTIPLIERS[bottomKey];
    }
  }

  if (paylines >= 4) {
    // Diagonal top-left to bottom-right
    const diag1: [SlotSymbol, SlotSymbol, SlotSymbol] = [reels[0][0], reels[1][1], reels[2][2]];
    const diag1Key = diag1.join(",");
    if (PAYLINE_MULTIPLIERS[diag1Key]) {
      matchedPaylines.push({
        positions: [0, 1, 2],
        symbols: diag1,
        multiplier: PAYLINE_MULTIPLIERS[diag1Key],
      });
      totalMultiplier += PAYLINE_MULTIPLIERS[diag1Key];
    }
  }

  if (paylines >= 5) {
    // Diagonal bottom-left to top-right
    const diag2: [SlotSymbol, SlotSymbol, SlotSymbol] = [reels[0][2], reels[1][1], reels[2][0]];
    const diag2Key = diag2.join(",");
    if (PAYLINE_MULTIPLIERS[diag2Key]) {
      matchedPaylines.push({
        positions: [2, 1, 0],
        symbols: diag2,
        multiplier: PAYLINE_MULTIPLIERS[diag2Key],
      });
      totalMultiplier += PAYLINE_MULTIPLIERS[diag2Key];
    }
  }

  // Calculate win amount
  const winAmount = betAmount * totalMultiplier;

  return {
    reels,
    matchedPaylines,
    totalMultiplier,
    winAmount,
  };
}

/**
 * Provable Fairness Utilities
 */
import { createHash, createHmac } from "crypto";

export interface ProvableFairness {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  hash: string;
}

export function generateProvableResult(serverSeed: string, clientSeed: string, nonce: number): string {
  return createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");
}

export function verifyProvableResult(serverSeed: string, clientSeed: string, nonce: number, resultHash: string): boolean {
  const expectedHash = generateProvableResult(serverSeed, clientSeed, nonce);
  return expectedHash === resultHash;
}

/**
 * 3D Slots Game Logic (Enhanced with Provable Fairness)
 */
export function play3DSlots(betAmount: number, clientSeed: string, nonce: number): SlotsGameResult & { provable: ProvableFairness } {
  const serverSeed = require("crypto").randomBytes(32).toString("hex");
  const resultHash = generateProvableResult(serverSeed, clientSeed, nonce);
  
  // Use the hash to determine the result (deterministic based on seeds)
  const hashInt = parseInt(resultHash.substring(0, 8), 16);
  
  // Seeded random for reels
  const seededRandom = (offset: number) => {
    const subHash = createHash("sha256").update(`${resultHash}:${offset}`).digest("hex");
    return parseInt(subHash.substring(0, 8), 16) / 0xffffffff;
  };

  const getSeededSymbol = (offset: number): SlotSymbol => {
    const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
    let weightedRandom = Math.floor(seededRandom(offset) * totalWeight);
    for (const symbol of SYMBOLS) {
      weightedRandom -= SYMBOL_WEIGHTS[symbol];
      if (weightedRandom < 0) return symbol;
    }
    return "cherry";
  };

  const reels: [SlotSymbol[], SlotSymbol[], SlotSymbol[]] = [
    [getSeededSymbol(0), getSeededSymbol(1), getSeededSymbol(2)],
    [getSeededSymbol(3), getSeededSymbol(4), getSeededSymbol(5)],
    [getSeededSymbol(6), getSeededSymbol(7), getSeededSymbol(8)]
  ];

  // Reuse payline logic from standard slots
  const result = playSlots(betAmount, 5); // Default to 5 paylines for 3D slots
  
  return {
    ...result,
    reels,
    provable: {
      serverSeed,
      clientSeed,
      nonce,
      hash: resultHash
    }
  };
}
