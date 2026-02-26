import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  executeDegensDenSpin,
  getUserSpinHistory,
  getDegensDenStats,
} from "./degensdenSlots";
import { recordGameResult } from "./wallet";
import { updateUserStatsAfterGame } from "./userStatsSystem";

/**
 * Degens♧Den Slots Router
 * Handles all degens den game operations
 */

export const degensDenRouter = router({
  /**
   * Execute a spin with full error handling
   */
  spin: protectedProcedure
    .input(
      z.object({
        betAmount: z.number().positive("Bet must be greater than zero"),
        paylines: z.number().int().min(1).max(10).default(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate bet amount
        if (input.betAmount < 0.01) {
          return {
            success: false,
            error: "Minimum bet is $0.01",
          };
        }

        if (input.betAmount > 10000) {
          return {
            success: false,
            error: "Maximum bet is $10,000",
          };
        }

        // Execute spin
        const spinResult = await executeDegensDenSpin(
          ctx.user.id,
          input.betAmount,
          input.paylines
        );

        // Record game result in wallet
        const won = spinResult.totalWin > input.betAmount;
        await recordGameResult(
          ctx.user.id,
          "dragons_den",
          input.betAmount,
          spinResult.totalWin,
          won
        );

        // Update user stats
        await updateUserStatsAfterGame(
          ctx.user.id,
          "dragons_den",
          input.betAmount,
          spinResult.totalWin,
          won
        );

        return {
          success: true,
          data: spinResult,
        };
      } catch (error) {
        console.error("[Degens Den] Spin error:", error);
        return {
          success: false,
          error: "Failed to execute spin",
        };
      }
    }),

  /**
   * Get user's spin history
   */
  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const history = await getUserSpinHistory(ctx.user.id, input.limit);
        return {
          success: true,
          data: history,
        };
      } catch (error) {
        console.error("[Degens Den] History error:", error);
        return {
          success: false,
          error: "Failed to fetch spin history",
        };
      }
    }),

  /**
   * Get user's degens den stats
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await getDegensDenStats(ctx.user.id);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("[Degens Den] Stats error:", error);
      return {
        success: false,
        error: "Failed to fetch stats",
      };
    }
  }),
});
