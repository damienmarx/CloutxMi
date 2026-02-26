import crypto from "crypto";

/**
 * Provably Fair RNG System
 * 
 * This system uses a server seed, client seed, and nonce to generate
 * verifiable random results for all games.
 */

export interface ProvableResult {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: number; // 0 to 1 float
  hash: string;
}

/**
 * Generate a new random server seed
 */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a server seed for public display before the game
 */
export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash("sha256").update(serverSeed).digest("hex");
}

/**
 * Generate a provably fair result
 * 
 * @param serverSeed The secret server seed
 * @param clientSeed The user-provided client seed
 * @param nonce The incrementing nonce for this seed pair
 * @returns A provable result object
 */
export function generateResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): ProvableResult {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = crypto.createHash("sha256").update(combined).digest("hex");
  
  // Convert first 8 characters of hash to a number between 0 and 1
  const hexValue = hash.substring(0, 8);
  const intValue = parseInt(hexValue, 16);
  const result = intValue / 0xffffffff;

  return {
    serverSeed,
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
    nonce,
    result,
    hash,
  };
}

/**
 * Verify a result given the original seeds
 */
export function verifyResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  providedHash: string
): boolean {
  const generated = generateResult(serverSeed, clientSeed, nonce);
  return generated.hash === providedHash;
}

/**
 * Game-specific result generators
 */
export const GameRNG = {
  // Slots: returns array of symbols based on weights
  slots: (provable: ProvableResult, reelCount: number = 3) => {
    const reels = [];
    for (let i = 0; i < reelCount; i++) {
      // Use different parts of the hash for each reel
      const subHash = crypto.createHash("sha256").update(`${provable.hash}:${i}`).digest("hex");
      const val = parseInt(subHash.substring(0, 8), 16) / 0xffffffff;
      reels.push(val);
    }
    return reels;
  },

  // Dice: returns number between 1 and 100
  dice: (provable: ProvableResult) => {
    return Math.floor(provable.result * 100) + 1;
  },

  // Roulette: returns number between 0 and 36
  roulette: (provable: ProvableResult) => {
    return Math.floor(provable.result * 37);
  },

  // Crash: returns multiplier (exponential distribution)
  crash: (provable: ProvableResult) => {
    const e = 2 ** 52;
    const h = parseInt(provable.hash.substring(0, 13), 16);
    if (h % 33 === 0) return 1.00;
    return Math.floor((100 * e - h) / (e - h)) / 100;
  }
};
