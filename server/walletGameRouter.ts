/**
 * CloutScape Wallet & Game tRPC Router
 * Provides API endpoints for wallet operations and game play
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import WalletService from "./walletSystem";
import {
  DiceGame,
  CrashGame,
  SlotsGame,
  BlackjackGame,
  RouletteGame,
  KenoGame,
  PokerGame,
  ProvablyFairRNG,
} from "./gameEngineAdvanced";
import { TRPCError } from "@trpc/server";

/**
 * Wallet Router
 */
export const walletRouter = router({
  /**
   * Get user's wallet balance
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    try {
      const balance = await WalletService.getBalance(ctx.user.id);
      return balance;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch wallet balance",
      });
    }
  }),

  /**
   * Initiate deposit
   */
  deposit: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive().max(100000),
        paymentMethod: z.enum(["stripe", "crypto", "bank_transfer"]),
        currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const transactionId = await WalletService.processDeposit({
          userId: ctx.user.id,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          currency: input.currency,
        });

        return {
          success: true,
          transactionId,
          message: "Deposit initiated successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Deposit failed",
        });
      }
    }),

  /**
   * Initiate withdrawal
   */
  withdraw: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive().max(100000),
        withdrawalMethod: z.enum(["stripe", "crypto", "bank_transfer"]),
        destination: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const transactionId = await WalletService.processWithdrawal({
          userId: ctx.user.id,
          amount: input.amount,
          withdrawalMethod: input.withdrawalMethod,
          destination: input.destination,
        });

        return {
          success: true,
          transactionId,
          message: "Withdrawal initiated successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Withdrawal failed",
        });
      }
    }),

  /**
   * Get transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().max(100).default(50) }))
    .query(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const transactions = await WalletService.getTransactionHistory(
          ctx.user.id,
          input.limit
        );
        return transactions;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transaction history",
        });
      }
    }),
});

/**
 * Games Router
 */
export const gamesRouter = router({
  /**
   * Play Dice Game
   */
  playDice: protectedProcedure
    .input(
      z.object({
        betAmount: z.number().positive(),
        prediction: z.enum(["high", "low"]),
        clientSeed: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        // Check balance
        const wallet = await WalletService.getBalance(ctx.user.id);
        if (parseFloat(wallet.balance) < input.betAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance",
          });
        }

        // Deduct bet
        await WalletService.deductFunds(
          ctx.user.id,
          input.betAmount,
          "Dice game bet"
        );

        // Generate seed and play
        const seed = ProvablyFairRNG.generateSeed();
        const result = DiceGame.play(
          input.betAmount,
          input.prediction,
          seed,
          input.clientSeed
        );

        // Add winnings if won
        if (result.won) {
          await WalletService.addFunds(
            ctx.user.id,
            result.payout,
            "Dice game win"
          );
        }

        return {
          ...result,
          seed,
          clientSeed: input.clientSeed,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Game failed",
        });
      }
    }),

  /**
   * Play Crash Game
   */
  playCrash: protectedProcedure
    .input(
      z.object({
        betAmount: z.number().positive(),
        cashOutAt: z.number().positive(),
        clientSeed: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const wallet = await WalletService.getBalance(ctx.user.id);
        if (parseFloat(wallet.balance) < input.betAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance",
          });
        }

        await WalletService.deductFunds(
          ctx.user.id,
          input.betAmount,
          "Crash game bet"
        );

        const seed = ProvablyFairRNG.generateSeed();
        const crashPoint = CrashGame.generateCrashPoint(seed, input.clientSeed);
        const payout = CrashGame.calculatePayout(
          input.betAmount,
          crashPoint,
          input.cashOutAt
        );

        if (payout > 0) {
          await WalletService.addFunds(
            ctx.user.id,
            payout,
            "Crash game win"
          );
        }

        return {
          crashPoint,
          cashOutAt: input.cashOutAt,
          payout,
          won: payout > 0,
          seed,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Game failed",
        });
      }
    }),

  /**
   * Play Slots Game
   */
  playSlots: protectedProcedure
    .input(
      z.object({
        betAmount: z.number().positive(),
        clientSeed: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const wallet = await WalletService.getBalance(ctx.user.id);
        if (parseFloat(wallet.balance) < input.betAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance",
          });
        }

        await WalletService.deductFunds(
          ctx.user.id,
          input.betAmount,
          "Slots game bet"
        );

        const seed = ProvablyFairRNG.generateSeed();
        const result = SlotsGame.spin(input.betAmount, seed, input.clientSeed);

        if (result.won) {
          await WalletService.addFunds(
            ctx.user.id,
            result.payout,
            "Slots game win"
          );
        }

        return {
          ...result,
          seed,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Game failed",
        });
      }
    }),

  /**
   * Play Roulette Game
   */
  playRoulette: protectedProcedure
    .input(
      z.object({
        betAmount: z.number().positive(),
        betType: z.enum(["number", "color", "odd_even"]),
        betValue: z.union([z.string(), z.number()]),
        clientSeed: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const wallet = await WalletService.getBalance(ctx.user.id);
        if (parseFloat(wallet.balance) < input.betAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance",
          });
        }

        await WalletService.deductFunds(
          ctx.user.id,
          input.betAmount,
          "Roulette game bet"
        );

        const seed = ProvablyFairRNG.generateSeed();
        const result = RouletteGame.spin(
          input.betAmount,
          input.betType as "number" | "color" | "odd_even",
          input.betValue,
          seed,
          input.clientSeed
        );

        if (result.won) {
          await WalletService.addFunds(
            ctx.user.id,
            result.payout,
            "Roulette game win"
          );
        }

        return {
          ...result,
          seed,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Game failed",
        });
      }
    }),

  /**
   * Play Keno Game
   */
  playKeno: protectedProcedure
    .input(
      z.object({
        betAmount: z.number().positive(),
        selectedNumbers: z.array(z.number().min(1).max(80)).min(1).max(10),
        clientSeed: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      try {
        const wallet = await WalletService.getBalance(ctx.user.id);
        if (parseFloat(wallet.balance) < input.betAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance",
          });
        }

        await WalletService.deductFunds(
          ctx.user.id,
          input.betAmount,
          "Keno game bet"
        );

        const seed = ProvablyFairRNG.generateSeed();
        const result = KenoGame.play(
          input.betAmount,
          input.selectedNumbers,
          seed,
          input.clientSeed
        );

        if (result.payout > 0) {
          await WalletService.addFunds(
            ctx.user.id,
            result.payout,
            "Keno game win"
          );
        }

        return {
          ...result,
          seed,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Game failed",
        });
      }
    }),

  /**
   * Verify game fairness
   */
  verifyFairness: publicProcedure
    .input(
      z.object({
        seed: z.string(),
        clientSeed: z.string(),
        result: z.number(),
        min: z.number(),
        max: z.number(),
      })
    )
    .query(({ input }: { input: any }) => {
      const isValid = ProvablyFairRNG.verifyFairness(
        input.seed,
        input.clientSeed,
        input.result,
        input.min,
        input.max
      );

      return {
        isValid,
        message: isValid
          ? "Game result verified as fair"
          : "Game result verification failed",
      };
    }),
});

export default {
  walletRouter,
  gamesRouter,
};
