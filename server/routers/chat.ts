import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { chatMessages, rainPool, rainPoolParticipants } from "../../drizzle/chatSchema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Chat Router
 * Handles all chat-related operations including:
 * - Message history retrieval
 * - Chat eligibility checking
 * - Rain pool management
 */

export const chatRouter = router({
  /**
   * Get chat eligibility for current user
   * Checks: $10 deposit + 10x wager requirement
   */
  checkChatEligibility: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    try {
      // Get wallet info
      const walletResult = await db.query.wallets.findFirst({
        where: (wallets, { eq }) => eq(wallets.userId, ctx.userId),
      });

      if (!walletResult || parseFloat(walletResult.totalDeposited) < 10) {
        return {
          canChat: false,
          reason: "Minimum $10 deposit required",
          depositAmount: walletResult?.totalDeposited || 0,
          wagerAmount: 0,
          requiredWager: 0,
        };
      }

      // Get user stats
      const statsResult = await db.query.userStats.findFirst({
        where: (stats, { eq }) => eq(stats.userId, ctx.userId),
      });

      if (!statsResult) {
        return {
          canChat: false,
          reason: "No wagering history found",
          depositAmount: walletResult.totalDeposited,
          wagerAmount: 0,
          requiredWager: parseFloat(walletResult.totalDeposited) * 10,
        };
      }

      const totalWagered = parseFloat(statsResult.totalWagered);
      const totalDeposited = parseFloat(walletResult.totalDeposited);
      const requiredWager = totalDeposited * 10;

      return {
        canChat: totalWagered >= requiredWager,
        reason: totalWagered >= requiredWager ? "Eligible" : "Wager requirement not met",
        depositAmount: totalDeposited,
        wagerAmount: totalWagered,
        requiredWager,
      };
    } catch (error) {
      console.error("[Chat] Error checking eligibility:", error);
      throw new Error("Failed to check chat eligibility");
    }
  }),

  /**
   * Get recent chat messages
   */
  getMessages: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const messages = await db
          .select()
          .from(chatMessages)
          .orderBy(desc(chatMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return messages.reverse(); // Return in chronological order
      } catch (error) {
        console.error("[Chat] Error fetching messages:", error);
        throw new Error("Failed to fetch messages");
      }
    }),

  /**
   * Get current rain pool status
   */
  getRainPoolStatus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    try {
      const currentPool = await db.query.rainPool.findFirst({
        where: (pool, { eq }) => eq(pool.status, "accumulating"),
        orderBy: (pool, { desc }) => desc(pool.createdAt),
      });

      if (!currentPool) {
        return {
          id: null,
          amount: 0,
          maxAmount: 10000,
          participantCount: 0,
          status: "accumulating",
          fillPercentage: 0,
        };
      }

      return {
        id: currentPool.id,
        amount: parseFloat(currentPool.amount),
        maxAmount: parseFloat(currentPool.maxAmount),
        participantCount: currentPool.participantCount,
        status: currentPool.status,
        fillPercentage: (parseFloat(currentPool.amount) / parseFloat(currentPool.maxAmount)) * 100,
      };
    } catch (error) {
      console.error("[Chat] Error fetching rain pool status:", error);
      throw new Error("Failed to fetch rain pool status");
    }
  }),

  /**
   * Join rain pool (authenticated users only)
   */
  joinRainPool: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    try {
      // Get or create current rain pool
      let currentPool = await db.query.rainPool.findFirst({
        where: (pool, { eq }) => eq(pool.status, "accumulating"),
        orderBy: (pool, { desc }) => desc(pool.createdAt),
      });

      if (!currentPool) {
        // Create new rain pool
        const result = await db.insert(rainPool).values({
          amount: "0",
          maxAmount: "10000",
          participantCount: 0,
          status: "accumulating",
        });

        currentPool = await db.query.rainPool.findFirst({
          where: (pool, { eq }) => eq(pool.id, Number(result.insertId)),
        });
      }

      if (!currentPool) throw new Error("Failed to create rain pool");

      // Check if user already joined
      const existingParticipant = await db.query.rainPoolParticipants.findFirst({
        where: (participants, { and, eq }) =>
          and(eq(participants.rainPoolId, currentPool!.id), eq(participants.userId, ctx.userId)),
      });

      if (existingParticipant) {
        return { success: true, message: "Already participating in rain pool" };
      }

      // Add user to rain pool
      await db.insert(rainPoolParticipants).values({
        rainPoolId: currentPool.id,
        userId: ctx.userId,
        shareAmount: "0",
      });

      return { success: true, message: "Joined rain pool" };
    } catch (error) {
      console.error("[Chat] Error joining rain pool:", error);
      throw new Error("Failed to join rain pool");
    }
  }),

  /**
   * Get rain pool history
   */
  getRainPoolHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const history = await db
          .select()
          .from(rainPool)
          .where((pool, { eq }) => eq(pool.status, "completed"))
          .orderBy(desc(rainPool.completedAt))
          .limit(input.limit);

        return history.map((pool) => ({
          id: pool.id,
          amount: parseFloat(pool.amount),
          participantCount: pool.participantCount,
          completedAt: pool.completedAt,
        }));
      } catch (error) {
        console.error("[Chat] Error fetching rain pool history:", error);
        throw new Error("Failed to fetch rain pool history");
      }
    }),

  /**
   * Get user's rain pool earnings
   */
  getUserRainEarnings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    try {
      const earnings = await db
        .select({
          totalEarnings: sql<string>`SUM(shareAmount)`,
          participationCount: sql<number>`COUNT(*)`,
        })
        .from(rainPoolParticipants)
        .where((participants, { eq }) => eq(participants.userId, ctx.userId));

      return {
        totalEarnings: parseFloat(earnings[0]?.totalEarnings || "0"),
        participationCount: earnings[0]?.participationCount || 0,
      };
    } catch (error) {
      console.error("[Chat] Error fetching user rain earnings:", error);
      throw new Error("Failed to fetch rain earnings");
    }
  }),
});
