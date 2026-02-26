import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, wallets, transactions } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export const adminRouter = router({
  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(users).$dynamic();

      if (input.search) {
        query = query.where(sql`lower(${users.username}) LIKE ${'%' + input.search.toLowerCase() + '%'}`);
      }

      const allUsers = await query.limit(input.limit).offset(input.offset).execute();
      return allUsers;
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        isMuted: z.boolean().optional(),
        role: z.enum(["user", "mod", "admin"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { userId, ...updateData } = input;
      await db.update(users).set(updateData).where(eq(users.id, userId)).execute();
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(users).where(eq(users.id, input.userId)).execute();
      return { success: true };
    }),

  adjustUserBalance: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        currency: z.enum(["USD", "OSRS_GP"]),
        amount: z.number(), // Positive for deposit, negative for withdrawal
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const wallet = await db.select().from(wallets).where(eq(wallets.userId, input.userId)).execute();
      if (!wallet || wallet.length === 0) {
        throw new Error("User wallet not found");
      }

      const currentBalance = parseFloat(wallet[0].balance);
      const newBalance = currentBalance + input.amount;

      await db.update(wallets).set({ balance: newBalance.toFixed(2) }).where(eq(wallets.userId, input.userId)).execute();

      // Record transaction
      await db.insert(transactions).values({
        userId: input.userId,
        type: input.amount > 0 ? "admin_deposit" : "admin_withdrawal",
        amount: Math.abs(input.amount),
        description: input.reason || `Admin adjustment: ${input.amount > 0 ? 'deposit' : 'withdrawal'} of ${input.amount} ${input.currency}`,
        status: "completed",
        currency: input.currency,
      }).execute();

      return { success: true };
    }),

  getTransactions: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        userId: z.number().optional(),
        type: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(transactions).$dynamic();

      if (input.userId) {
        query = query.where(eq(transactions.userId, input.userId));
      }
      if (input.type) {
        query = query.where(eq(transactions.type, input.type));
      }

      const allTransactions = await query.limit(input.limit).offset(input.offset).execute();
      return allTransactions;
    }),

  // Placeholder for game configuration. Requires more detailed game schema.
  configureGame: adminProcedure
    .input(
      z.object({
        gameId: z.number(),
        config: z.record(z.string(), z.any()), // Flexible config object
      })
    )
    .mutation(async ({ input }) => {
      // Logic to update game configuration in DB
      console.log(`Configuring game ${input.gameId} with:`, input.config);
      return { success: true, message: "Game configuration updated (placeholder)" };
    }),

  // Placeholder for game pause/resume. Requires game state management.
  setGameStatus: adminProcedure
    .input(
      z.object({
        gameId: z.number(),
        status: z.enum(["active", "paused", "maintenance"]),
      })
    )
    .mutation(async ({ input }) => {
      // Logic to update game status in DB
      console.log(`Setting game ${input.gameId} status to: ${input.status}`);
      return { success: true, message: "Game status updated (placeholder)" };
    }),
});
