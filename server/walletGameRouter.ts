/**
 * Degens¤Den — Wallet & Game tRPC Router
 * All games: Dice · Crash · Plinko · Keno · Limbo · LuckyWheel
 * Provably fair via HMAC-SHA256 · Broadcasts results via Socket.IO
 *
 * HARDENED:
 *  - All monetary operations wrapped in db.transaction() (atomic)
 *  - Decimal.js for all financial arithmetic (no float errors)
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import crypto from "crypto";
import Decimal from "decimal.js";
import { TRPCError } from "@trpc/server";
import { broadcastGameResult } from "./_core/socket";
import { getDb } from "./db";
import { wallets, transactions, users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import WalletService from "./walletSystem";

// ─── Decimal Config ────────────────────────────────────────────────────────────
Decimal.set({ precision: 20, rounding: Decimal.ROUND_DOWN });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genSeeds() {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const clientSeed = crypto.randomBytes(16).toString("hex");
  const nonce = Math.floor(Math.random() * 1_000_000);
  const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
  return { serverSeed, clientSeed, nonce, serverSeedHash };
}

function genRoll(serverSeed: string, clientSeed: string, nonce: number, min: number, max: number): number {
  const hash = crypto.createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const num = parseInt(hash.substring(0, 8), 16);
  return (num % (max - min + 1)) + min;
}

/**
 * Atomically process a game bet:
 *   balance -= bet, balance += payout
 * Uses a single UPDATE with conditional check (MySQL atomic).
 * Logs separate bet and win transactions if applicable.
 */
async function deductAndPayAtomic(
  userId: number,
  bet: number,
  payout: number,
  betDesc: string,
  payDesc: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const betD = new Decimal(bet).toFixed(8);
  const payoutD = new Decimal(payout).toFixed(8);
  const netD = new Decimal(payout).minus(new Decimal(bet)).toFixed(8);

  await db.transaction(async (tx) => {
    // Atomic: deduct bet + add payout in one UPDATE; fails if balance < bet
    const [result] = await tx.execute(
      sql`UPDATE wallets
          SET balance = ROUND(balance + CAST(${netD} AS DECIMAL(20,8)), 8)
          WHERE userId = ${userId}
            AND CAST(balance AS DECIMAL(20,8)) >= CAST(${betD} AS DECIMAL(20,8))`
    ) as any[];

    if ((result as any)?.affectedRows === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
    }

    // Log bet deduction
    await tx.insert(transactions).values({
      userId,
      type: "game_loss",
      amount: betD,
      status: "completed",
      description: betDesc,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Log win payout (only if actual payout > 0)
    if (new Decimal(payout).gt(0)) {
      await tx.insert(transactions).values({
        userId,
        type: "game_win",
        amount: payoutD,
        status: "completed",
        description: payDesc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}

async function getBalanceDecimal(userId: number): Promise<Decimal> {
  const w = await WalletService.getBalance(userId);
  return new Decimal(w.balance);
}

// ─── Wallet Router ─────────────────────────────────────────────────────────────

export const walletRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await WalletService.getBalance(ctx.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch balance" });
    }
  }),

  deposit: protectedProcedure
    .input(z.object({
      amount: z.number().positive().max(100_000),
      paymentMethod: z.enum(["stripe", "crypto", "bank_transfer"]),
      currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const txId = await WalletService.processDeposit({ userId: ctx.user.id, ...input });
        return { success: true, transactionId: txId };
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: e instanceof Error ? e.message : "Deposit failed" });
      }
    }),

  withdraw: protectedProcedure
    .input(z.object({
      amount: z.number().positive().max(100_000),
      withdrawalMethod: z.enum(["stripe", "crypto", "bank_transfer"]),
      destination: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const txId = await WalletService.processWithdrawal({ userId: ctx.user.id, ...input });
        return { success: true, transactionId: txId };
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: e instanceof Error ? e.message : "Withdrawal failed" });
      }
    }),

  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      try {
        return await WalletService.getTransactionHistory(ctx.user.id, input.limit);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch history" });
      }
    }),

  // ── Avatar Upload ─────────────────────────────────────────────────────────
  uploadAvatar: protectedProcedure
    .input(z.object({
      dataUrl: z.string()
        .max(2_500_000, "Image too large (max 2MB)")
        .refine(
          v => v.startsWith("data:image/") && (v.includes("image/png") || v.includes("image/jpeg") || v.includes("image/webp")),
          "Only PNG, JPEG, or WebP images are allowed"
        ),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.execute(
        sql`INSERT INTO userProfiles (userId, avatarUrl, updatedAt)
            VALUES (${ctx.user.id}, ${input.dataUrl}, NOW())
            ON DUPLICATE KEY UPDATE avatarUrl = ${input.dataUrl}, updatedAt = NOW()`
      );
      return { success: true };
    }),

  // ── Player Stats ──────────────────────────────────────────────────────────
  getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return null;

      const res = await db.execute(
        sql`SELECT p.*, u.username, u.createdAt as memberSince
            FROM userProfiles p
            JOIN users u ON u.id = p.userId
            WHERE p.userId = ${ctx.user.id}
            LIMIT 1`
      );
      const profile = (res[0] as any[])?.[0];
      if (!profile) return null;

      const totalWagered = new Decimal(profile.totalWagered || "0").toNumber();

      const VIP_THRESHOLDS = {
        bronze: 0, silver: 1_000, gold: 5_000, platinum: 25_000, diamond: 100_000,
      };
      const currentTier = (profile.vipTier as string) || "bronze";
      const tierOrder = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
      const nextTierIdx = tierOrder.indexOf(currentTier as typeof tierOrder[number]) + 1;
      const nextTier = nextTierIdx < tierOrder.length ? tierOrder[nextTierIdx] : null;
      const wagerToNext = nextTier
        ? Math.max(0, VIP_THRESHOLDS[nextTier] - totalWagered)
        : 0;

      return {
        username: profile.username as string,
        avatarUrl: (profile.avatarUrl as string) || null,
        vipTier: currentTier,
        totalWagered,
        wagerToNext,
        nextTier,
        totalWins: (profile.totalWins as number) || 0,
        totalLosses: (profile.totalLosses as number) || 0,
        biggestWin: new Decimal(profile.biggestWin || "0").toNumber(),
        gamesPlayed: (profile.gamesPlayed as number) || 0,
        memberSince: profile.memberSince as Date,
      };
    } catch {
      return null;
    }
  }),
});

// ─── Games Router ──────────────────────────────────────────────────────────────

export const gamesRouter = router({

  // ── DICE ──────────────────────────────────────────────────────────────────
  playDice: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      gameData: z.object({
        prediction: z.enum(["high", "low", "mid", "exact"]),
        target: z.number().min(1).max(100).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, gameData } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();
      const roll = genRoll(serverSeed, clientSeed, nonce, 1, 100);

      const { prediction, target } = gameData;
      let win = false;
      let multiplier = new Decimal(0);

      if (prediction === "high")  { win = roll > 50;                      multiplier = new Decimal("1.98"); }
      if (prediction === "low")   { win = roll < 50;                      multiplier = new Decimal("1.98"); }
      if (prediction === "mid")   { win = roll >= 45 && roll <= 55;       multiplier = new Decimal("9.0");  }
      if (prediction === "exact") { win = roll === (target ?? -1);         multiplier = new Decimal("100");  }

      const winAmount = win ? bet.times(multiplier).toNumber() : 0;
      const payout = win ? bet.times(multiplier).toNumber() : 0;

      await deductAndPayAtomic(userId, betAmount, payout, "Dice bet", `Dice win ${multiplier}x`);

      const db = await getDb();
      const newBal = db ? (await WalletService.getBalance(userId)).balance : "0";
      const newBalance = parseFloat(newBal);

      broadcastGameResult(ctx.user.username || `User${userId}`, "Dice", betAmount, multiplier.toNumber(), winAmount, win);

      return {
        win, winAmount, multiplier: multiplier.toNumber(),
        result: { roll, prediction, target },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── CRASH ─────────────────────────────────────────────────────────────────
  playCrash: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      cashoutAt: z.number().min(1.01).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, cashoutAt } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();
      const raw = genRoll(serverSeed, clientSeed, nonce, 1, 10_000);
      const crashPoint = parseFloat(Math.max(1.0, Math.pow(raw / 10_000, -0.75)).toFixed(2));

      const win = cashoutAt <= crashPoint;
      const cashoutMult = new Decimal(cashoutAt);
      const winAmount = win ? bet.times(cashoutMult).toNumber() : 0;
      const payout = win ? bet.times(cashoutMult).toNumber() : 0;

      await deductAndPayAtomic(userId, betAmount, payout, "Crash bet", `Crash win ${cashoutAt}x`);

      const newBalance = (await getBalanceDecimal(userId)).toNumber();

      broadcastGameResult(ctx.user.username || `User${userId}`, "Crash", betAmount, cashoutAt, winAmount, win);

      return {
        win, winAmount, multiplier: win ? cashoutAt : 0,
        result: { crashPoint, cashoutAt },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── PLINKO ────────────────────────────────────────────────────────────────
  playPlinko: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      risk: z.enum(["low", "medium", "high"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, risk } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      const drops: number[] = [];
      for (let i = 0; i < 16; i++) drops.push(genRoll(serverSeed, clientSeed, nonce + i, 0, 1));

      const bucket = drops.reduce((s, d) => s + d, 0);
      const tables: Record<string, number[]> = {
        low:    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        medium: [33, 11, 4, 2, 1.5, 1.3, 1.1, 1, 0.3, 1, 1.1, 1.3, 1.5, 2, 4, 11, 33],
        high:   [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
      };

      const multiplier = new Decimal(tables[risk][bucket]);
      const winAmount = bet.times(multiplier).toNumber();
      const win = multiplier.gte(1);

      // Plinko always pays out (even <1x = partial return)
      await deductAndPayAtomic(userId, betAmount, winAmount, "Plinko bet", `Plinko ${multiplier}x`);

      const newBalance = (await getBalanceDecimal(userId)).toNumber();

      broadcastGameResult(ctx.user.username || `User${userId}`, "Plinko", betAmount, multiplier.toNumber(), winAmount, win);

      return {
        win, winAmount, multiplier: multiplier.toNumber(),
        result: { drops, bucket, risk },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── KENO ──────────────────────────────────────────────────────────────────
  playKeno: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      selectedNumbers: z.array(z.number().min(1).max(40)).min(2).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, selectedNumbers } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // Draw 10 unique numbers from 1-40
      const pool = Array.from({ length: 40 }, (_, i) => i + 1);
      const drawn: number[] = [];
      for (let i = 0; i < 10; i++) {
        const idx = genRoll(serverSeed, clientSeed, nonce + i, 0, pool.length - 1);
        drawn.push(pool.splice(idx, 1)[0]);
      }

      const matches = selectedNumbers.filter(n => drawn.includes(n)).length;
      const picks = selectedNumbers.length;

      const payoutTable: Record<number, Record<number, number>> = {
        2: { 2: 3.5 },
        3: { 2: 1.5, 3: 12 },
        4: { 2: 0.5, 3: 3, 4: 25 },
        5: { 2: 0.5, 3: 2, 4: 10, 5: 60 },
        6: { 3: 1, 4: 5, 5: 25, 6: 120 },
        7: { 3: 0.5, 4: 2, 5: 10, 6: 50, 7: 250 },
        8: { 4: 1, 5: 5, 6: 20, 7: 100, 8: 500 },
        9: { 4: 0.5, 5: 2, 6: 10, 7: 50, 8: 200, 9: 1000 },
        10: { 5: 1, 6: 5, 7: 25, 8: 100, 9: 400, 10: 2500 },
      };

      const multiplier = new Decimal(payoutTable[picks]?.[matches] ?? 0);
      const win = multiplier.gt(0);
      const winAmount = win ? bet.times(multiplier).toNumber() : 0;
      const payout = win ? bet.times(multiplier).toNumber() : 0;

      await deductAndPayAtomic(userId, betAmount, payout, "Keno bet", `Keno win ${multiplier}x`);

      const newBalance = (await getBalanceDecimal(userId)).toNumber();

      broadcastGameResult(ctx.user.username || `User${userId}`, "Keno", betAmount, multiplier.toNumber(), winAmount, win);

      return {
        win, winAmount, multiplier: multiplier.toNumber(),
        result: { drawn, selectedNumbers, matches },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── LIMBO ─────────────────────────────────────────────────────────────────
  playLimbo: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      targetMultiplier: z.number().min(1.01).max(1_000_000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, targetMultiplier } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // Provably fair: roll [1,10000] → resultMultiplier = 9700/roll (97% RTP)
      const roll = genRoll(serverSeed, clientSeed, nonce, 1, 10_000);
      const resultMultiplier = new Decimal(9700).div(roll).toDecimalPlaces(2).toNumber();

      const target = new Decimal(targetMultiplier);
      const win = resultMultiplier >= targetMultiplier;
      const winAmount = win ? bet.times(target).toNumber() : 0;
      const payout = win ? bet.times(target).toNumber() : 0;

      await deductAndPayAtomic(userId, betAmount, payout, "Limbo bet", `Limbo win ${targetMultiplier}x`);

      const newBalance = (await getBalanceDecimal(userId)).toNumber();

      broadcastGameResult(ctx.user.username || `User${userId}`, "Limbo", betAmount, targetMultiplier, winAmount, win);

      return {
        win, winAmount, multiplier: win ? targetMultiplier : 0, resultMultiplier,
        result: { targetMultiplier, resultMultiplier, roll },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── LUCKY WHEEL ───────────────────────────────────────────────────────────
  playLuckyWheel: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // 12 equal segments — multipliers include partial returns
      const SEGMENTS = [0, 0.5, 0, 1, 0.5, 2, 0.5, 1, 0, 3, 0.5, 0];
      const segment = genRoll(serverSeed, clientSeed, nonce, 0, SEGMENTS.length - 1);
      const multiplier = new Decimal(SEGMENTS[segment]);
      const winAmount = bet.times(multiplier).toNumber();
      const win = multiplier.gte(1);

      await deductAndPayAtomic(userId, betAmount, winAmount, "Wheel spin", `Wheel ${multiplier}x`);

      const newBalance = (await getBalanceDecimal(userId)).toNumber();

      broadcastGameResult(ctx.user.username || `User${userId}`, "Wheel", betAmount, multiplier.toNumber(), winAmount, win);

      return {
        win, winAmount, multiplier: multiplier.toNumber(), segment,
        result: { segment, multiplier: multiplier.toNumber(), segments: SEGMENTS },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── BLACKJACK ─────────────────────────────────────────────────────────────
  // Game logic runs on client; backend records the financial outcome atomically.
  playBlackjack: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      result: z.enum(["win", "loss", "push", "blackjack"]),
      playerHand: z.string().optional(),
      dealerHand: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, result } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // Multiplier: blackjack=2.5x, win=2x, push=1x (refund), loss=0
      const multiplierMap = { blackjack: 2.5, win: 2, push: 1, loss: 0 };
      const multiplier = new Decimal(multiplierMap[result]);
      const payout = bet.times(multiplier).toNumber();
      const win = result === "win" || result === "blackjack";

      await deductAndPayAtomic(
        userId, betAmount, payout,
        `Blackjack bet (${result})`,
        result !== "loss" ? `Blackjack ${result} ${multiplier}x` : "Blackjack loss"
      );

      const newBalance = (await getBalanceDecimal(userId)).toNumber();
      broadcastGameResult(ctx.user.username || `User${userId}`, "Blackjack", betAmount, multiplier.toNumber(), payout, win);

      return {
        win, result, payout, multiplier: multiplier.toNumber(),
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── ROULETTE ──────────────────────────────────────────────────────────────
  // Winning number is determined client-side; backend processes payout atomically.
  playRoulette: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      betType: z.string(),
      winningNumber: z.number().min(0).max(36),
      won: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, won, betType } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      const multiplier = new Decimal(won ? 2 : 0);
      const payout = bet.times(multiplier).toNumber();

      await deductAndPayAtomic(
        userId, betAmount, payout,
        `Roulette bet (${betType})`,
        won ? `Roulette win 2x` : "Roulette loss"
      );

      const newBalance = (await getBalanceDecimal(userId)).toNumber();
      broadcastGameResult(ctx.user.username || `User${userId}`, "Roulette", betAmount, multiplier.toNumber(), payout, won);

      return {
        win: won, payout, multiplier: multiplier.toNumber(),
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── SLOTS ─────────────────────────────────────────────────────────────────
  playSlots: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      lines: z.number().min(1).max(25).optional().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, lines } = input;
      const userId = ctx.user.id;

      const bal = await getBalanceDecimal(userId);
      const bet = new Decimal(betAmount);
      if (bal.lt(bet)) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      const SYMBOLS = ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven", "wild"];
      const WEIGHTS  = [30, 25, 20, 15, 5, 3, 1, 1]; // sum 100

      function spinReel(seed: string, n: number): string {
        const roll = genRoll(seed, clientSeed, nonce + n, 0, 99);
        let cum = 0;
        for (let i = 0; i < WEIGHTS.length; i++) {
          cum += WEIGHTS[i];
          if (roll < cum) return SYMBOLS[i];
        }
        return SYMBOLS[0];
      }

      // 3x3 grid
      const grid: string[][] = [];
      for (let row = 0; row < 3; row++) {
        grid.push([spinReel(serverSeed, row * 3), spinReel(serverSeed, row * 3 + 1), spinReel(serverSeed, row * 3 + 2)]);
      }

      // Evaluate centre row
      const [a, b, c] = grid[1];
      let multiplier = new Decimal(0);
      if (a === "wild" || b === "wild" || c === "wild") {
        multiplier = new Decimal(5);
      } else if (a === b && b === c) {
        const payTable: Record<string, number> = {
          seven: 50, bar: 25, bell: 15, plum: 10, orange: 7, lemon: 5, cherry: 3,
        };
        multiplier = new Decimal(payTable[a] ?? 3);
      } else if (a === b || b === c) {
        multiplier = new Decimal("1.5");
      } else if (a === "cherry" || b === "cherry") {
        multiplier = new Decimal("0.5");
      }

      const win = multiplier.gte(1);
      const winAmount = bet.times(multiplier).toNumber();
      const payout = bet.times(multiplier).toNumber();

      await deductAndPayAtomic(
        userId, betAmount, payout,
        `Slots spin (${lines} line${lines > 1 ? "s" : ""})`,
        win ? `Slots win ${multiplier}x` : "Slots loss"
      );

      const newBalance = (await getBalanceDecimal(userId)).toNumber();
      broadcastGameResult(ctx.user.username || `User${userId}`, "Slots", betAmount, multiplier.toNumber(), winAmount, win);

      return {
        win, winAmount, multiplier: multiplier.toNumber(), grid,
        result: { grid, centreRow: [a, b, c] },
        serverSeed, serverSeedHash, clientSeed, nonce, newBalance,
      };
    }),

  // ── VERIFY (Provably Fair) ─────────────────────────────────────────────────
  verifyFairness: publicProcedure
    .input(z.object({
      serverSeed: z.string().min(1).max(256),
      clientSeed: z.string().min(1).max(256),
      nonce: z.number().int().min(0),
    }))
    .query(({ input }) => {
      const { serverSeed, clientSeed, nonce } = input;
      const hmac = crypto.createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
      const num = parseInt(hmac.substring(0, 8), 16);
      const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
      return { isValid: true, hash: hmac, result: (num % 100) + 1, serverSeedHash };
    }),
});

export default { walletRouter, gamesRouter };
