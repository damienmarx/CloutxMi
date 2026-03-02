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
import { mfaRouter } from "./mfaRouter";
import { walletRouter, gamesRouter } from "./walletGameRouter";
import { z } from "zod";
import * as s from "../shared/validation";
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
  return router({
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
    mfa: mfaRouter,
    wallet: walletRouter,
    games: gamesRouter,

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
        .input(s.RegisterSchema)
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
          const passwordHash = await hashPassword(input.password);

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
        .input(s.LoginSchema)
        .mutation(async ({ input, ctx }) => {
          const user = await getUserByUsername(input.username);

          if (!user || !user.passwordHash) {
            return {
              success: false,
              error: "Invalid username or password",
            };
          }

          if (!(await verifyPassword(input.password, user.passwordHash, user.id))) {
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
        .input(s.ForgotPasswordSchema)
        .mutation(async ({ input }) => {
          const { createPasswordResetRequest } = await import("./passwordReset");
          return await createPasswordResetRequest(input.email);
        }),

      resetPassword: publicProcedure
        .input(s.ResetPasswordSchema)
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
        .input(s.LinkDiscordSchema)
        .mutation(async ({ input, ctx }) => {
          await upsertUser({
            id: ctx.user.id,
            username: ctx.user.username,
            discordId: input.discordId,
          });
          return { success: true };
        }),

      linkTelegram: protectedProcedure
        .input(s.LinkTelegramSchema)
        .mutation(async ({ input, ctx }) => {
          await upsertUser({
            id: ctx.user.id,
            username: ctx.user.username,
            telegramId: input.telegramId,
          });
          return { success: true };
        }),

      verifyAge: protectedProcedure
        .input(s.AgeVerificationSchema)
        .mutation(async ({ input, ctx }) => {
          const eighteenYearsAgo = new Date();
          eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
          const dob = new Date(input.dateOfBirth);

          if (dob > eighteenYearsAgo) {
            return { success: false, error: "You must be at least 18 years old." };
          }

          await upsertUser({
            id: ctx.user.id,
            dateOfBirth: input.dateOfBirth,
            isAgeVerified: true,
          });
          return { success: true, message: "Age verified successfully." };
        }),

      selfExclude: protectedProcedure
        .input(s.SelfExclusionSchema)
        .mutation(async ({ input, ctx }) => {
          let selfExclusionUntil: Date | null = null;
          const now = new Date();

          switch (input.duration) {
            case "1_month":
              selfExclusionUntil = new Date(now.setMonth(now.getMonth() + 1));
              break;
            case "3_months":
              selfExclusionUntil = new Date(now.setMonth(now.getMonth() + 3));
              break;
            case "6_months":
              selfExclusionUntil = new Date(now.setMonth(now.getMonth() + 6));
              break;
            case "1_year":
              selfExclusionUntil = new Date(now.setFullYear(now.getFullYear() + 1));
              break;
            case "5_years":
              selfExclusionUntil = new Date(now.setFullYear(now.getFullYear() + 5));
              break;
            case "permanent":
              selfExclusionUntil = new Date("9999-12-31T23:59:59.999Z"); // Effectively permanent
              break;
          }

          await upsertUser({
            id: ctx.user.id,
            selfExclusionUntil: selfExclusionUntil,
          });
          return { success: true, message: "Self-exclusion period set." };
        }),
    }),
  });
};
