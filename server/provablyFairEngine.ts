import crypto from 'crypto';
import { nanoid } from 'nanoid';

/**
 * Degens¤Den Provably Fair System
 * Implements industry-standard provably fair gaming with client/server seeds
 */

export interface FairGameResult {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: number;
  isVerified: boolean;
}

export interface SeedPair {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

/**
 * Generate a cryptographically secure server seed
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate SHA-256 hash of server seed
 */
export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

/**
 * Generate a default client seed (user can customize)
 */
export function generateClientSeed(): string {
  return nanoid(32);
}

/**
 * Create a new seed pair for a user
 */
export function createSeedPair(): SeedPair {
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const clientSeed = generateClientSeed();
  
  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce: 0
  };
}

/**
 * Generate provably fair result using HMAC-SHA256
 * @param serverSeed - Secret server seed
 * @param clientSeed - Public client seed
 * @param nonce - Incrementing counter
 * @param max - Maximum value (exclusive)
 * @returns Number between 0 and max-1
 */
export function generateProvablyFairResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  max: number = 100
): number {
  // Create HMAC with server seed as key
  const hmac = crypto.createHmac('sha256', serverSeed);
  
  // Update with client seed and nonce
  const message = `${clientSeed}:${nonce}`;
  hmac.update(message);
  
  // Get hex digest
  const hash = hmac.digest('hex');
  
  // Convert first 8 characters to integer
  const hashInt = parseInt(hash.substring(0, 8), 16);
  
  // Apply modulo to get result in range
  return hashInt % max;
}

/**
 * Generate multiple provably fair results (for games like Keno)
 */
export function generateMultipleResults(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
  max: number = 100
): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push(generateProvablyFairResult(serverSeed, clientSeed, nonce + i, max));
  }
  
  return results;
}

/**
 * Verify a game result
 */
export function verifyGameResult(
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number,
  claimedResult: number,
  max: number = 100
): FairGameResult {
  // Verify server seed hash matches
  const computedHash = hashServerSeed(serverSeed);
  const hashMatches = computedHash === serverSeedHash;
  
  // Recompute result
  const computedResult = generateProvablyFairResult(serverSeed, clientSeed, nonce, max);
  const resultMatches = computedResult === claimedResult;
  
  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    result: computedResult,
    isVerified: hashMatches && resultMatches
  };
}

/**
 * Generate crash game multiplier (provably fair)
 * Uses exponential distribution for realistic crash points
 */
export function generateCrashMultiplier(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  // Generate a number between 0 and 10000
  const result = generateProvablyFairResult(serverSeed, clientSeed, nonce, 10000);
  
  // House edge 2%
  const houseEdge = 0.02;
  const adjustedResult = result * (1 - houseEdge);
  
  // Convert to multiplier using exponential distribution
  // This creates realistic crash points (mostly low, occasionally high)
  const multiplier = Math.floor((10000 / (10000 - adjustedResult)) * 100) / 100;
  
  // Cap at 100x for safety
  return Math.min(multiplier, 100);
}

/**
 * Generate dice roll (1-100)
 */
export function generateDiceRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  return generateProvablyFairResult(serverSeed, clientSeed, nonce, 100) + 1;
}

/**
 * Generate roulette number (0-36)
 */
export function generateRouletteNumber(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  return generateProvablyFairResult(serverSeed, clientSeed, nonce, 37);
}

/**
 * Generate Keno numbers (pick count from 1-80)
 */
export function generateKenoNumbers(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number = 20
): number[] {
  const numbers: number[] = [];
  const available = Array.from({ length: 80 }, (_, i) => i + 1);
  
  for (let i = 0; i < count; i++) {
    const index = generateProvablyFairResult(serverSeed, clientSeed, nonce + i, available.length);
    numbers.push(available[index]);
    available.splice(index, 1);
  }
  
  return numbers.sort((a, b) => a - b);
}

/**
 * Generate slot symbols (using weighted distribution)
 */
export function generateSlotReels(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  reels: number = 5
): string[][] {
  const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎'];
  const weights = [30, 25, 20, 15, 5, 3, 2]; // Weighted distribution
  
  const results: string[][] = [];
  
  for (let reel = 0; reel < reels; reel++) {
    const reelSymbols: string[] = [];
    
    for (let row = 0; row < 3; row++) {
      const rand = generateProvablyFairResult(serverSeed, clientSeed, nonce + reel * 3 + row, 100);
      
      let cumulative = 0;
      for (let i = 0; i < symbols.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) {
          reelSymbols.push(symbols[i]);
          break;
        }
      }
    }
    
    results.push(reelSymbols);
  }
  
  return results;
}

/**
 * Generate card deck shuffle (Fisher-Yates with provably fair seed)
 */
export function generateShuffledDeck(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): string[] {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  // Create deck
  const deck: string[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}${suit}`);
    }
  }
  
  // Fisher-Yates shuffle with provably fair randomness
  for (let i = deck.length - 1; i > 0; i--) {
    const j = generateProvablyFairResult(serverSeed, clientSeed, nonce + i, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

/**
 * Export verification tools for frontend
 */
export const ProvablyFairTools = {
  hashServerSeed,
  verifyGameResult,
  generateProvablyFairResult,
  generateCrashMultiplier,
  generateDiceRoll,
  generateRouletteNumber,
  generateKenoNumbers,
  generateSlotReels,
  generateShuffledDeck
};

export default {
  createSeedPair,
  generateServerSeed,
  hashServerSeed,
  generateClientSeed,
  generateProvablyFairResult,
  generateMultipleResults,
  verifyGameResult,
  generateCrashMultiplier,
  generateDiceRoll,
  generateRouletteNumber,
  generateKenoNumbers,
  generateSlotReels,
  generateShuffledDeck,
  ProvablyFairTools
};
