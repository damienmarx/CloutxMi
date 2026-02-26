import { sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getUserVipProgress,
  calculateUserCashback,
  getUserBonusMultiplier,
  getAllVipTiers,
  getVipTierByName,
  checkAndProcessTierUpgrade,
} from "./vipProgressSystem";
import { z } from "zod";

export const vipProgressRouter = router({
  /**
   * Get user's VIP progress information
   */
  getUserProgress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const progress = await getUserVipProgress(ctx.user.id);
      return {
        success: true,
        progress,
      };
    } catch (error) {
      console.error("[VIP Progress Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch VIP progress",
      };
    }
  }),

  /**
   * Get all VIP tier information
   */
  getAllTiers: publicProcedure.query(async () => {
    try {
      const tiers = getAllVipTiers();
      return {
        success: true,
        tiers,
      };
    } catch (error) {
      console.error("[VIP Progress Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch VIP tiers",
      };
    }
  }),

  /**
   * Get specific VIP tier information
   */
  getTierInfo: publicProcedure
    .input(z.object({ tierName: z.string() }))
    .query(async ({ input }) => {
      try {
        const tier = getVipTierByName(input.tierName);
        if (!tier) {
          return {
            success: false,
            error: "Tier not found",
          };
        }
        return {
          success: true,
          tier,
        };
      } catch (error) {
        console.error("[VIP Progress Router] Error:", error);
        return {
          success: false,
          error: "Failed to fetch tier info",
        };
      }
    }),

  /**
   * Get user's cashback amount for a win
   */
  calculateCashback: protectedProcedure
    .input(z.object({ winAmount: z.number().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const cashback = await calculateUserCashback(ctx.user.id, input.winAmount);
        return {
          success: true,
          winAmount: input.winAmount,
          cashback,
          totalAfterCashback: input.winAmount + cashback,
        };
      } catch (error) {
        console.error("[VIP Progress Router] Error:", error);
        return {
          success: false,
          error: "Failed to calculate cashback",
        };
      }
    }),

  /**
   * Get user's bonus multiplier
   */
  getBonusMultiplier: protectedProcedure.query(async ({ ctx }) => {
    try {
      const multiplier = await getUserBonusMultiplier(ctx.user.id);
      return {
        success: true,
        bonusMultiplier: multiplier,
      };
    } catch (error) {
      console.error("[VIP Progress Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch bonus multiplier",
      };
    }
  }),

  /**
   * Check and process tier upgrade
   */
  checkTierUpgrade: protectedProcedure.query(async ({ ctx }) => {
    try {
      const result = await checkAndProcessTierUpgrade(ctx.user.id);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error("[VIP Progress Router] Error:", error);
      return {
        success: false,
        error: "Failed to check tier upgrade",
      };
    }
  }),
});
