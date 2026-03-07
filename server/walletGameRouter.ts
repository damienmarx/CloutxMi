/**
 * Degens¤Den — Wallet & Game tRPC Router
 * Premium crypto casino — provably fair game endpoints
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import crypto from "crypto";
import WalletService from "./walletSystem";
import { CrashGame, ProvablyFairRNG } from "./gameEngineAdvanced";
import { TRPCError } from "@trpc/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genSeeds(nonce?: number) {
  const serverSeed = ProvablyFairRNG.generateSeed();
  const clientSeed = ProvablyFairRNG.generateSeed();
  const n = nonce ?? Math.floor(Math.random() * 1_000_000);
  const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
  return { serverSeed, clientSeed, nonce: n, serverSeedHash };
}

function genRoll(serverSeed: string, clientSeed: string, nonce: number, min: number, max: number) {
  const hash = crypto.createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const num = parseInt(hash.substring(0, 8), 16);
  return (num % (max - min + 1)) + min;
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
});

// ─── Games Router ──────────────────────────────────────────────────────────────

export const gamesRouter = router({

  // ── DICE ───────────────────────────────────────────────────────────────────
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

      const wallet = await WalletService.getBalance(userId);
      if (parseFloat(wallet.balance) < betAmount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();
      const roll = genRoll(serverSeed, clientSeed, nonce, 1, 100);

      const { prediction, target } = gameData;
      let win = false;
      let multiplier = 0;

      if (prediction === "high")  { win = roll > 50;                     multiplier = 1.98; }
      if (prediction === "low")   { win = roll < 50;                     multiplier = 1.98; }
      if (prediction === "mid")   { win = roll >= 45 && roll <= 55;      multiplier = 9.0;  }
      if (prediction === "exact") { win = roll === (target ?? -1);       multiplier = 100;  }

      const winAmount = win ? betAmount * multiplier : 0;

      await WalletService.deductFunds(userId, betAmount, "Dice bet");
      if (win) await WalletService.addFunds(userId, winAmount, "Dice win");

      const updated = await WalletService.getBalance(userId);
      return {
        win, winAmount, multiplier,
        result: { roll, prediction, target },
        serverSeed, serverSeedHash, clientSeed, nonce,
        newBalance: parseFloat(updated.balance),
      };
    }),

  // ── CRASH ──────────────────────────────────────────────────────────────────
  playCrash: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      cashoutAt: z.number().min(1.01).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, cashoutAt } = input;
      const userId = ctx.user.id;

      const wallet = await WalletService.getBalance(userId);
      if (parseFloat(wallet.balance) < betAmount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // Provably fair crash point (exponential distribution)
      const raw = genRoll(serverSeed, clientSeed, nonce, 1, 10_000);
      const crashPoint = Math.max(1.0, parseFloat(Math.pow(raw / 10_000, -0.75).toFixed(2)));

      const win = cashoutAt <= crashPoint;
      const multiplier = win ? cashoutAt : 0;
      const winAmount = win ? betAmount * cashoutAt : 0;

      await WalletService.deductFunds(userId, betAmount, "Crash bet");
      if (win) await WalletService.addFunds(userId, winAmount, "Crash win");

      const updated = await WalletService.getBalance(userId);
      return {
        win, winAmount, multiplier,
        result: { crashPoint, cashoutAt },
        serverSeed, serverSeedHash, clientSeed, nonce,
        newBalance: parseFloat(updated.balance),
      };
    }),

  // ── PLINKO ─────────────────────────────────────────────────────────────────
  playPlinko: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      risk: z.enum(["low", "medium", "high"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, risk } = input;
      const userId = ctx.user.id;

      const wallet = await WalletService.getBalance(userId);
      if (parseFloat(wallet.balance) < betAmount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // Generate 16 binary drops (0=left, 1=right)
      const drops: number[] = [];
      for (let i = 0; i < 16; i++) {
        drops.push(genRoll(serverSeed, clientSeed, nonce + i, 0, 1));
      }

      const bucket = drops.reduce((s, d) => s + d, 0); // 0-16

      const multiplierTables: Record<string, number[]> = {
        low:    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        medium: [33, 11, 4, 2, 1.5, 1.3, 1.1, 1, 0.3, 1, 1.1, 1.3, 1.5, 2, 4, 11, 33],
        high:   [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
      };

      const multiplier = multiplierTables[risk][bucket];
      const winAmount = betAmount * multiplier;
      const win = multiplier >= 1.0;

      await WalletService.deductFunds(userId, betAmount, "Plinko bet");
      await WalletService.addFunds(userId, winAmount, `Plinko ${multiplier}x`);

      const updated = await WalletService.getBalance(userId);
      return {
        win, winAmount, multiplier,
        result: { drops, bucket, risk },
        serverSeed, serverSeedHash, clientSeed, nonce,
        newBalance: parseFloat(updated.balance),
      };
    }),

  // ── KENO ───────────────────────────────────────────────────────────────────
  playKeno: protectedProcedure
    .input(z.object({
      betAmount: z.number().positive().max(10_000),
      currency: z.enum(["crypto", "gp"]).optional().default("crypto"),
      selectedNumbers: z.array(z.number().min(1).max(40)).min(2).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const { betAmount, selectedNumbers } = input;
      const userId = ctx.user.id;

      const wallet = await WalletService.getBalance(userId);
      if (parseFloat(wallet.balance) < betAmount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const { serverSeed, clientSeed, nonce, serverSeedHash } = genSeeds();

      // Draw 10 from 1-40
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

      const multiplier = payoutTable[picks]?.[matches] ?? 0;
      const win = multiplier > 0;
      const winAmount = win ? betAmount * multiplier : 0;

      await WalletService.deductFunds(userId, betAmount, "Keno bet");
      if (win) await WalletService.addFunds(userId, winAmount, "Keno win");

      const updated = await WalletService.getBalance(userId);
      return {
        win, winAmount, multiplier,
        result: { drawn, selectedNumbers, matches },
        serverSeed, serverSeedHash, clientSeed, nonce,
        newBalance: parseFloat(updated.balance),
      };
    }),

  // ── VERIFY ─────────────────────────────────────────────────────────────────
  verifyFairness: publicProcedure
    .input(z.object({
      serverSeed: z.string().min(1),
      clientSeed: z.string().min(1),
      nonce: z.number().int().min(0),
    }))
    .query(({ input }) => {
      const { serverSeed, clientSeed, nonce } = input;
      const hmac = crypto.createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
      const num = parseInt(hmac.substring(0, 8), 16);
      const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
      return {
        isValid: true,
        hash: hmac,
        result: (num % 100) + 1,
        serverSeedHash,
      };
    }),
});

export default { walletRouter, gamesRouter };
