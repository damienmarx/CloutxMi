/**
 * Degens¤Den / Degens Den - Core Game Engine
 * Handles betting, provably fair RNG, payouts, and Discord notifications
 */

import { db } from './db';
import { users, wallets, transactions, gameSessions } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { 
  generateProvablyFairResult, 
  createSeedPair, 
  hashServerSeed,
  generateDiceRoll,
  generateCrashMultiplier,
  generateKenoNumbers
} from './provablyFairEngine';
import { getDiscordBot } from './discordBot';

export interface GameResult {
  success: boolean;
  win: boolean;
  winAmount: number;
  result: any;
  multiplier: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  newBalance: number;
  message: string;
}

export interface BetRequest {
  userId: number;
  gameType: 'dice' | 'crash' | 'keno' | 'plinko' | 'slots' | 'blackjack' | 'roulette';
  betAmount: number;
  gameData: any; // Game-specific data (e.g., dice prediction, keno numbers)
}

/**
 * Process a bet - core function for all games
 */
export async function processBet(request: BetRequest): Promise<GameResult> {
  const { userId, gameType, betAmount, gameData } = request;

  try {
    // 1. Validate bet amount
    if (betAmount <= 0 || betAmount > 10000) {
      return {
        success: false,
        win: false,
        winAmount: 0,
        result: null,
        multiplier: 0,
        serverSeed: '',
        serverSeedHash: '',
        clientSeed: '',
        nonce: 0,
        newBalance: 0,
        message: 'Invalid bet amount (min: $0.01, max: $10,000)'
      };
    }

    // 2. Get user and wallet
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { wallet: true }
    });

    if (!user || !user.wallet) {
      return {
        success: false,
        win: false,
        winAmount: 0,
        result: null,
        multiplier: 0,
        serverSeed: '',
        serverSeedHash: '',
        clientSeed: '',
        nonce: 0,
        newBalance: 0,
        message: 'User or wallet not found'
      };
    }

    const currentBalance = parseFloat(user.wallet.balance);
    
    // 3. Check balance
    if (currentBalance < betAmount) {
      return {
        success: false,
        win: false,
        winAmount: 0,
        result: null,
        multiplier: 0,
        serverSeed: '',
        serverSeedHash: '',
        clientSeed: '',
        nonce: 0,
        newBalance: currentBalance,
        message: `Insufficient balance. Current: $${currentBalance.toFixed(2)}`
      };
    }

    // 4. Generate provably fair seeds
    const seedPair = createSeedPair();
    const nonce = Math.floor(Math.random() * 1000000);

    // 5. Deduct bet from balance
    const newBalance = currentBalance - betAmount;
    await db.update(wallets)
      .set({ balance: newBalance.toString() })
      .where(eq(wallets.userId, userId));

    // 6. Play game based on type
    let gameResult: any;
    let multiplier = 0;
    let win = false;
    let winAmount = 0;

    switch (gameType) {
      case 'dice':
        gameResult = await playDice(seedPair, nonce, gameData);
        multiplier = gameResult.multiplier;
        win = gameResult.win;
        break;
      
      case 'crash':
        gameResult = await playCrash(seedPair, nonce, gameData);
        multiplier = gameResult.multiplier;
        win = gameResult.win;
        break;
      
      case 'keno':
        gameResult = await playKeno(seedPair, nonce, gameData);
        multiplier = gameResult.multiplier;
        win = gameResult.win;
        break;
      
      case 'plinko':
        gameResult = await playPlinko(seedPair, nonce, gameData);
        multiplier = gameResult.multiplier;
        win = gameResult.win;
        break;

      default:
        throw new Error(`Game type ${gameType} not implemented`);
    }

    // 7. Calculate winnings
    if (win) {
      winAmount = betAmount * multiplier;
      const finalBalance = newBalance + winAmount;
      
      await db.update(wallets)
        .set({ balance: finalBalance.toString() })
        .where(eq(wallets.userId, userId));
      
      // Notify big wins on Discord
      if (winAmount >= 500) {
        const discordBot = getDiscordBot();
        if (discordBot) {
          await discordBot.notifyBigWin(
            user.username,
            gameType.toUpperCase(),
            betAmount,
            winAmount,
            multiplier
          );
        }
      }
    }

    // 8. Record transaction
    await db.insert(transactions).values({
      userId,
      type: win ? 'win' : 'loss',
      amount: win ? winAmount.toString() : (-betAmount).toString(),
      status: 'completed',
      description: `${gameType.toUpperCase()}: ${win ? 'WIN' : 'LOSS'} - ${multiplier}x`
    });

    // 9. Return result
    return {
      success: true,
      win,
      winAmount,
      result: gameResult.result,
      multiplier,
      serverSeed: seedPair.serverSeed,
      serverSeedHash: seedPair.serverSeedHash,
      clientSeed: seedPair.clientSeed,
      nonce,
      newBalance: win ? newBalance + winAmount : newBalance,
      message: win ? `You won $${winAmount.toFixed(2)}!` : 'Better luck next time!'
    };

  } catch (error) {
    console.error('Error processing bet:', error);
    return {
      success: false,
      win: false,
      winAmount: 0,
      result: null,
      multiplier: 0,
      serverSeed: '',
      serverSeedHash: '',
      clientSeed: '',
      nonce: 0,
      newBalance: 0,
      message: 'Error processing bet'
    };
  }
}

/**
 * DICE GAME - High/Low/Mid with provably fair
 */
async function playDice(seedPair: any, nonce: number, gameData: any) {
  const { prediction, target } = gameData; // prediction: 'high', 'low', 'mid', 'exact'
  
  const roll = generateDiceRoll(seedPair.serverSeed, seedPair.clientSeed, nonce);
  
  let win = false;
  let multiplier = 0;

  if (prediction === 'high') {
    // Roll > 50: 1.98x
    win = roll > 50;
    multiplier = win ? 1.98 : 0;
  } else if (prediction === 'low') {
    // Roll < 50: 1.98x
    win = roll < 50;
    multiplier = win ? 1.98 : 0;
  } else if (prediction === 'mid') {
    // Roll 45-55: 9.0x
    win = roll >= 45 && roll <= 55;
    multiplier = win ? 9.0 : 0;
  } else if (prediction === 'exact') {
    // Exact number: 100x
    win = roll === target;
    multiplier = win ? 100 : 0;
  }

  return {
    result: { roll, prediction, target },
    multiplier,
    win
  };
}

/**
 * CRASH GAME - Provably fair crash point
 */
async function playCrash(seedPair: any, nonce: number, gameData: any) {
  const { cashoutAt } = gameData; // User's cashout multiplier
  
  const crashPoint = generateCrashMultiplier(seedPair.serverSeed, seedPair.clientSeed, nonce);
  
  const win = cashoutAt <= crashPoint;
  const multiplier = win ? cashoutAt : 0;

  return {
    result: { crashPoint, cashoutAt },
    multiplier,
    win
  };
}

/**
 * KENO GAME - Pick numbers from 40, match wins
 * Professional 40-number Keno with optimized payouts
 */
async function playKeno(seedPair: any, nonce: number, gameData: any) {
  const { pickedNumbers } = gameData; // Array of user's picked numbers (2-10 numbers)
  
  // Generate 10 drawn numbers from 1-40 (instead of 20 from 80)
  const allNumbers = Array.from({ length: 40 }, (_, i) => i + 1);
  const drawnNumbers: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    const index = generateProvablyFairResult(
      seedPair.serverSeed,
      seedPair.clientSeed,
      nonce + i,
      allNumbers.length
    );
    drawnNumbers.push(allNumbers[index]);
    allNumbers.splice(index, 1);
  }
  
  const matches = pickedNumbers.filter((num: number) => drawnNumbers.includes(num)).length;
  const totalPicked = pickedNumbers.length;
  
  // Professional Keno payout table (40 numbers, 10 drawn)
  // Optimized for better player experience and house edge
  const payoutTable: { [key: string]: { [key: number]: number } } = {
    '2': { 1: 0, 2: 3.5 },
    '3': { 1: 0, 2: 1.5, 3: 12 },
    '4': { 1: 0, 2: 0.5, 3: 3, 4: 25 },
    '5': { 2: 0.5, 3: 2, 4: 10, 5: 60 },
    '6': { 2: 0, 3: 1, 4: 5, 5: 25, 6: 120 },
    '7': { 3: 0.5, 4: 2, 5: 10, 6: 50, 7: 250 },
    '8': { 3: 0, 4: 1, 5: 5, 6: 20, 7: 100, 8: 500 },
    '9': { 4: 0.5, 5: 2, 6: 10, 7: 50, 8: 200, 9: 1000 },
    '10': { 4: 0, 5: 1, 6: 5, 7: 25, 8: 100, 9: 400, 10: 2500 }
  };

  const multiplier = payoutTable[totalPicked]?.[matches] || 0;
  const win = multiplier > 0;

  return {
    result: { drawnNumbers, pickedNumbers, matches, totalNumbers: 40 },
    multiplier,
    win
  };
}

/**
 * PLINKO GAME - Drop ball, multiply
 */
async function playPlinko(seedPair: any, nonce: number, gameData: any) {
  const { risk } = gameData; // 'low', 'medium', 'high'
  
  // Generate 16 random drops (left=0, right=1)
  const drops: number[] = [];
  for (let i = 0; i < 16; i++) {
    const result = generateProvablyFairResult(
      seedPair.serverSeed,
      seedPair.clientSeed,
      nonce + i,
      2
    );
    drops.push(result);
  }
  
  // Count right drops (determines final bucket)
  const rightDrops = drops.filter(d => d === 1).length;
  
  // Plinko multiplier tables (16 buckets)
  const multiplierTables = {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [33, 11, 4, 2, 1.5, 1.3, 1.1, 1, 0.3, 1, 1.1, 1.3, 1.5, 2, 4, 11, 33],
    high: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  };
  
  const multiplier = multiplierTables[risk][rightDrops];
  const win = multiplier >= 1;

  return {
    result: { drops, bucket: rightDrops, risk },
    multiplier,
    win
  };
}

export default {
  processBet,
  playDice,
  playCrash,
  playKeno,
  playPlinko
};
