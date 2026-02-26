import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createEmailVerificationRequest,
  validateVerificationToken,
  verifyEmailWithToken,
  isEmailVerified,
  resendVerificationEmail,
} from "./emailVerification";

/**
 * Email Verification Router
 * Handles email verification endpoints
 */

export const emailVerificationRouter = router({
  /**
   * Send verification email to user
   */
  sendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await createEmailVerificationRequest(ctx.user.id, ctx.user.email);
      return {
        success: result.success,
        message: result.message,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      console.error("[Email Verification Router] Send verification email error:", error);
      return {
        success: false,
        message: "Failed to send verification email",
      };
    }
  }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyEmailWithToken(input.token);
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error("[Email Verification Router] Verify email error:", error);
        return {
          success: false,
          message: "Failed to verify email",
        };
      }
    }),

  /**
   * Validate verification token
   */
  validateToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await validateVerificationToken(input.token);
        return {
          valid: result.valid,
          error: result.error,
        };
      } catch (error) {
        console.error("[Email Verification Router] Validate token error:", error);
        return {
          valid: false,
          error: "Failed to validate token",
        };
      }
    }),

  /**
   * Check if user's email is verified
   */
  isVerified: protectedProcedure.query(async ({ ctx }) => {
    try {
      const verified = await isEmailVerified(ctx.user.id);
      return {
        success: true,
        verified,
      };
    } catch (error) {
      console.error("[Email Verification Router] Check verification status error:", error);
      return {
        success: false,
        verified: false,
      };
    }
  }),

  /**
   * Resend verification email
   */
  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await resendVerificationEmail(ctx.user.id);
      return {
        success: result.success,
        message: result.message,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      console.error("[Email Verification Router] Resend verification email error:", error);
      return {
        success: false,
        message: "Failed to resend verification email",
      };
    }
  }),
});
