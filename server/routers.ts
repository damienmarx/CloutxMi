import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./adminRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { leaderboardRouter } from "./leaderboardRouter";
import { vipProgressRouter } from "./vipProgressRouter";
import { userStatsRouter } from "./userStatsRouter";
import { osrsGamblingRouter } from "./osrsGamblingRouter";
import { degensDenRouter } from "./degensdenRouter";
import { cryptoWalletRouter } from "./cryptoWalletRouter";
import { trustWalletRouter } from "./trustWalletRouter";
import { liveRouter } from "./liveRouter";
import { z } from "zod";
import { getUserByUsername, getUserById, getWalletByUserId, createWallet, getTransactionHistory } from "./db";
import { hashPassword, verifyPassword, validateUsername, validatePasswordStrength, validateEmail } from "./auth";
import { upsertUser } from "./db";
import { depositFunds, withdrawFunds, tipPlayer, recordGameResult, getUserWallet } from "./wallet";
import { playKeno, playSlots } from "./gameLogic";
import { createPasswordResetRequest, resetPasswordWithToken, validateResetToken } from "./passwordReset";
import { kenoGames, slotsGames } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { getDb } from "./db";

export const createAppRouter = (pluginRouters: any[]) => {
  const baseRouter = router({
  system: systemRouter,
  admin: adminRouter,
  leaderboard: leaderboardRouter,
  vipProgress: vipProgressRouter,
  userStats: userStatsRouter,
  osrsGambling: osrsGamblingRouter,
  degensDen: degensDenRouter,
  cryptoWallet: cryptoWalletRouter,
  trustWallet: trustWalletRouter,
  live: liveRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    register: publicProcedure
      .input(
        z.object({
          username: z.string().min(3).max(64),
          email: z.string().email(),
          password: z.string().min(8),
          confirmPassword: z.string().min(8),
        })
      )
      .mutation(async ({ input }) => {
        // Validate inputs
        const usernameValidation = validateUsername(input.username);
        if (!usernameValidation.valid) {
          return {
            success: false,
            error: usernameValidation.errors[0],
          };
        }

        if (!validateEmail(input.email)) {
          return {
            success: false,
            error: "Invalid email format",
          };
        }

        if (input.password !== input.confirmPassword) {
          return {
            success: false,
            error: "Passwords do not match",
          };
        }

        const passwordValidation = validatePasswordStrength(input.password);
        if (!passwordValidation.valid) {
          return {
            success: false,
            error: passwordValidation.errors[0],
          };
        }

        // Check if user already exists
        const existingUser = await getUserByUsername(input.username);
        if (existingUser) {
          return {
            success: false,
            error: "Username already taken",
          };
        }

        // Hash password and create user
        const passwordHash = hashPassword(input.password);

        try {
          await upsertUser({
            username: input.username,
            email: input.email,
            passwordHash,
            loginMethod: "username",
            lastSignedIn: new Date(),
          });

          // Get the created user
          const newUser = await getUserByUsername(input.username);
          if (!newUser) {
            return {
              success: false,
              error: "Failed to create user",
            };
          }

          // Create wallet for new user
          await createWallet(newUser.id);

          return {
            success: true,
            message: "Registration successful",
            userId: newUser.id,
          };
        } catch (error) {
          console.error("[Auth] Registration error:", error);
          return {
            success: false,
            error: "Registration failed. Please try again.",
          };
        }
      }),

    login: publicProcedure
      .input(
        z.object({
          username: z.string(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByUsername(input.username);

        if (!user || !user.passwordHash) {
          return {
            success: false,
            error: "Invalid username or password",
          };
        }

        if (!verifyPassword(input.password, user.passwordHash)) {
          return {
            success: false,
            error: "Invalid username or password",
          };
        }

        // Update last signed in
        await upsertUser({
          username: user.username,
          lastSignedIn: new Date(),
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, user.openId || user.id.toString(), cookieOptions);

        return {
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        };
      }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { createPasswordResetRequest } = await import("./passwordReset");
        return await createPasswordResetRequest(input.email);
      }),

    resetPassword: publicProcedure
      .input(
        z.object({
          token: z.string(),
          newPassword: z.string().min(8),
          confirmPassword: z.string().min(8),
        })
      )
      .mutation(async ({ input }) => {
        const { resetPasswordWithToken } = await import("./passwordReset");
        return await resetPasswordWithToken(input.token, input.newPassword, input.confirmPassword);
      }),

    validateResetToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { validateResetToken } = await import("./passwordReset");
        const result = await validateResetToken(input.token);
        return {
          valid: result.valid,
          error: result.error,
        };
      }),

    linkDiscord: protectedProcedure
      .input(z.object({ discordId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await upsertUser({
          id: ctx.user.id,
          username: ctx.user.username,
          discordId: input.discordId,
        });
        return { success: true };
      }),

    linkTelegram: protectedProcedure
      .input(z.object({ telegramId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await upsertUser({
          id: ctx.user.id,
          username: ctx.user.username,
          telegramId: input.telegramId,
        });
        return { success: true };
      }),
  }),

  wallet: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const wallet = await getUserWallet(ctx.user.id);
      return {
        balance: wallet?.balance || "0.00",
        totalDeposited: wallet?.totalDeposited || "0.00",
        totalWithdrawn: wallet?.totalWithdrawn || "0.00",
      };
    }),

    deposit: protectedProcedure
      .input(z.object({ amount: z.number().positive() }))
      .mutation(async ({ input, ctx }) => {
        return await depositFunds(ctx.user.id, input.amount, "Deposit to casino wallet");
      }),

    withdraw: protectedProcedure
      .input(z.object({ amount: z.number().positive() }))
      .mutation(async ({ input, ctx }) => {
        return await withdrawFunds(ctx.user.id, input.amount, "Withdrawal from casino wallet");
      }),

    tip: protectedProcedure
      .input(
        z.object({
          toUsername: z.string(),
          amount: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const recipient = await getUserByUsername(input.toUsername);
        if (!recipient) {
          return {
            success: false,
            message: "Recipient not found",
          };
        }

        return await tipPlayer(ctx.user.id, recipient.id, input.amount);
      }),

    getTransactionHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().positive().max(100).optional() }))
      .query(async ({ input, ctx }) => {
        return await getTransactionHistory(ctx.user.id, input.limit || 50);
      }),
  }),

  games: router({
    ...Object.assign({}, ...pluginRouters),

    playKeno: protectedProcedure
      .input(
        z.object({
          selectedNumbers: z.array(z.number().int().min(1).max(80)).min(1).max(10),
          betAmount: z.number().positive(),
          turboMode: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // Verify sufficient balance
          const wallet = await getUserWallet(ctx.user.id);
          if (!wallet || parseFloat(wallet.balance) < input.betAmount) {
            return {
              success: false,
              error: "Insufficient balance",
            };
          }

          // Play Keno
          const gameResult = playKeno(input.selectedNumbers, input.betAmount);

          // Determine if player won
          const isWin = gameResult.winAmount > 0;

          // Record game result and update balance
          const balanceResult = await recordGameResult(
            ctx.user.id,
            "keno",
            nanoid(),
            isWin ? gameResult.winAmount : input.betAmount,
            isWin
          );

          if (!balanceResult.success) {
            return { success: false, error: balanceResult.error };
          }

          return {
            success: true,
            winAmount: gameResult.winAmount,
            newBalance: balanceResult.balance,
          };
        } catch (error) {
          console.error("[Games] Keno error:", error);
          return { success: false, error: "Game failed" };
        }
      }),

    playSlots: protectedProcedure
      .input(
        z.object({
          betAmount: z.number().positive(),
          paylines: z.number().int().min(1).max(5),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const wallet = await getUserWallet(ctx.user.id);
          if (!wallet || parseFloat(wallet.balance) < input.betAmount) {
            return { success: false, error: "Insufficient balance" };
          }

          const gameResult = playSlots(input.betAmount, input.paylines);

          const isWin = gameResult.winAmount > 0;

          const balanceResult = await recordGameResult(
            ctx.user.id,
            "slots",
            nanoid(),
            isWin ? gameResult.winAmount : input.betAmount,
            isWin
          );

          if (!balanceResult.success) {
            return { success: false, error: balanceResult.error };
          }

          return {
            success: true,
            winAmount: gameResult.winAmount,
            newBalance: balanceResult.balance,
          };
        } catch (error) {
          console.error("[Games] Slots error:", error);
          return { success: false, error: "Game failed" };
        }
      }),

    playBlackjack: protectedProcedure
      .input(
        z.object({
          betAmount: z.number().positive(),
          playerHand: z.array(z.string()),
          dealerHand: z.array(z.string()),
          result: z.enum(["win", "lose", "push"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const wallet = await getUserWallet(ctx.user.id);
          if (!wallet || parseFloat(wallet.balance) < input.betAmount) {
            return { success: false, error: "Insufficient balance" };
          }

          let winAmount = 0;
          if (input.result === "win") {
            winAmount = input.betAmount * 2; // Assuming 2x payout for blackjack win
          } else if (input.result === "push") {
            winAmount = input.betAmount; // Return bet on push
          }

          const balanceResult = await recordGameResult(
            ctx.user.id,
            "blackjack",
            nanoid(),
            winAmount,
            input.result === "win"
          );

          return {
            success: true,
            winAmount,
            newBalance: balanceResult.balance,
          };
        } catch (error) {
          console.error("[Games] Blackjack error:", error);
          return { success: false, error: "Game failed" };
        }
      }),

    playRoulette: protectedProcedure
      .input(
        z.object({
          betAmount: z.number().positive(),
          prediction: z.string(), // e.g., "red", "black", "0", "1-12"
          targetNumber: z.number().int().min(0).max(36).optional(),
          won: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const wallet = await getUserWallet(ctx.user.id);
          if (!wallet || parseFloat(wallet.balance) < input.betAmount) {
            return { success: false, error: "Insufficient balance" };
          }

          let winAmount = 0;
          if (input.won) {
            // Simplified payout logic for example
            if (input.prediction === "red" || input.prediction === "black") {
              winAmount = input.betAmount * 2;
            } else if (input.targetNumber !== undefined) {
              winAmount = input.betAmount * 36;
            } else {
              winAmount = input.betAmount * 3; // Example for dozens/columns
            }
          }

          const balanceResult = await recordGameResult(
            ctx.user.id,
            "roulette",
            nanoid(),
            winAmount,
            input.won
          );

          return {
            success: true,
            winAmount,
            newBalance: balanceResult.balance,
          };
        } catch (error) {
          console.error("[Games] Roulette error:", error);
          return { success: false, error: "Game failed" };
        }
      }),

    playDice: protectedProcedure
      .input(
        z.object({
          betAmount: z.number().positive(),
          prediction: z.enum(["over", "under", "exact"]),
          targetNumber: z.number().min(1).max(100),
          diceRoll: z.number().min(1).max(100),
          won: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const wallet = await getUserWallet(ctx.user.id);
          if (!wallet || parseFloat(wallet.balance) < input.betAmount) {
            return { success: false, error: "Insufficient balance" };
          }
          const multiplier = input.prediction === "exact" ? 100 : 1.98;
          const payout = input.won ? input.betAmount * multiplier : 0;
          const balanceResult = await recordGameResult(
            ctx.user.id,
            "dice",
            nanoid(),
            payout,
            input.won
          );
          return {
            success: true,
            payout,
            newBalance: balanceResult.balance,
          };
        } catch (error) {
          console.error("[Games] Dice error:", error);
          return { success: false, error: "Game failed" };
        }
      }),
  }),
});

export type AppRouter = ReturnType<typeof createAppRouter>;

  return baseRouter;
};
