import { sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getUserStats,
  getGameStats,
  getRecentTransactions,
  getUserAchievements,
  getUserDashboard,
} from "./userStatsSystem";
import { z } from "zod";
import { getUserById } from "./db";

export const userStatsRouter = router({
  /**
   * Get user's overall statistics
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await getUserStats(ctx.user.id);
      if (!stats) {
        return {
          success: false,
          error: "User stats not found",
        };
      }
      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("[User Stats Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch user stats",
      };
    }
  }),

  /**
   * Get game-specific statistics
   */
  getGameStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const gameStats = await getGameStats(ctx.user.id);
      return {
        success: true,
        gameStats,
      };
    } catch (error) {
      console.error("[User Stats Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch game stats",
      };
    }
  }),

  /**
   * Get recent transactions
   */
  getRecentTransactions: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const limit = input.limit || 10;
        const transactions = await getRecentTransactions(ctx.user.id, limit);
        return {
          success: true,
          transactions,
        };
      } catch (error) {
        console.error("[User Stats Router] Error:", error);
        return {
          success: false,
          error: "Failed to fetch transactions",
        };
      }
    }),

  /**
   * Get user achievements
   */
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    try {
      const achievements = await getUserAchievements(ctx.user.id);
      return {
        success: true,
        achievements,
      };
    } catch (error) {
      console.error("[User Stats Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch achievements",
      };
    }
  }),

  /**
   * Get complete dashboard data
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    try {
      const dashboard = await getUserDashboard(ctx.user.id);
      if (!dashboard) {
        return {
          success: false,
          error: "Dashboard data not found",
        };
      }
      return {
        success: true,
        dashboard,
      };
    } catch (error) {
      console.error("[User Stats Router] Error:", error);
      return {
        success: false,
        error: "Failed to fetch dashboard",
      };
    }
  }),

  /**
   * Get public user profile (limited stats)
   */
  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const user = await getUserById(input.userId);
        if (!user) {
          return {
            success: false,
            error: "User not found",
          };
        }

        const stats = await getUserStats(input.userId);
        if (!stats) {
          return {
            success: false,
            error: "User stats not found",
          };
        }

        // Return limited public info
        return {
          success: true,
          profile: {
            userId: stats.userId,
            username: stats.username,
            totalWagered: stats.totalWagered,
            totalWon: stats.totalWon,
            gamesPlayed: stats.gamesPlayed,
            winRate: stats.winRate,
            joinedDate: stats.joinedDate,
          },
        };
      } catch (error) {
        console.error("[User Stats Router] Error:", error);
        return {
          success: false,
          error: "Failed to fetch public profile",
        };
      }
    }),

  /**
   * Get user stats by username
   */
  getStatsByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      try {
        const user = await getUserById(0); // This won't work, need to get by username
        // For now, return error
        return {
          success: false,
          error: "Feature coming soon",
        };
      } catch (error) {
        console.error("[User Stats Router] Error:", error);
        return {
          success: false,
          error: "Failed to fetch stats",
        };
      }
    }),
});
