import { sql } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getTopWagerersAllTime,
  getTopWinRateAllTime,
  getTopWinnersAllTime,
  getTopGamesPlayedAllTime,
  getUserLeaderboardPositions,
} from "./leaderboardSystem";

export const leaderboardRouter = router({
  /**
   * Get top wagers leaderboard
   */
  getTopWagers: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(1000).optional() }))
    .query(async ({ input }) => {
      const limit = input.limit || 100;
      const entries = await getTopWagerersAllTime(limit);
      return {
        success: true,
        leaderboard: entries,
        period: "allTime",
        metric: "totalWagered",
      };
    }),

  /**
   * Get top win rate leaderboard
   */
  getTopWinRate: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(1000).optional(),
        minGames: z.number().int().min(1).optional(),
      })
    )
    .query(async ({ input }) => {
      const limit = input.limit || 100;
      const minGames = input.minGames || 10;
      const entries = await getTopWinRateAllTime(limit, minGames);
      return {
        success: true,
        leaderboard: entries,
        period: "allTime",
        metric: "winRate",
        minGames,
      };
    }),

  /**
   * Get top winners leaderboard
   */
  getTopWinners: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(1000).optional() }))
    .query(async ({ input }) => {
      const limit = input.limit || 100;
      const entries = await getTopWinnersAllTime(limit);
      return {
        success: true,
        leaderboard: entries,
        period: "allTime",
        metric: "totalWon",
      };
    }),

  /**
   * Get top games played leaderboard
   */
  getTopGamesPlayed: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(1000).optional() }))
    .query(async ({ input }) => {
      const limit = input.limit || 100;
      const entries = await getTopGamesPlayedAllTime(limit);
      return {
        success: true,
        leaderboard: entries,
        period: "allTime",
        metric: "gamesPlayed",
      };
    }),

  /**
   * Get user's position in all leaderboards
   */
  getUserPositions: protectedProcedure.query(async ({ ctx }) => {
    const positions = await getUserLeaderboardPositions(ctx.user.id);
    return {
      success: true,
      userId: ctx.user.id,
      positions,
    };
  }),

  /**
   * Get user's position in a specific leaderboard
   */
  getUserPosition: protectedProcedure
    .input(
      z.object({
        leaderboard: z.enum(["wagers", "winRate", "winners", "gamesPlayed"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const positions = await getUserLeaderboardPositions(ctx.user.id);
      
      let rank: number | null = null;
      let metric: string = "";

      switch (input.leaderboard) {
        case "wagers":
          rank = positions.wagerRank;
          metric = "totalWagered";
          break;
        case "winRate":
          rank = positions.winRateRank;
          metric = "winRate";
          break;
        case "winners":
          rank = positions.winningsRank;
          metric = "totalWon";
          break;
        case "gamesPlayed":
          rank = positions.gamesPlayedRank;
          metric = "gamesPlayed";
          break;
      }

      return {
        success: true,
        userId: ctx.user.id,
        leaderboard: input.leaderboard,
        rank,
        metric,
      };
    }),
});
