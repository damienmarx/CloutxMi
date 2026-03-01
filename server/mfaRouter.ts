
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { generateMfaSecret, enableMfa, verifyMfaToken, disableMfa } from "./mfa";

export const mfaRouter = router({
  generateSecret: protectedProcedure.mutation(async ({ ctx }) => {
    return await generateMfaSecret(ctx.user.id, ctx.user.username);
  }),

  enable: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await enableMfa(ctx.user.id, input.token);
    }),

  verify: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isValid = await verifyMfaToken(ctx.user.id, input.token);
      return { success: isValid };
    }),

  disable: protectedProcedure.mutation(async ({ ctx }) => {
    await disableMfa(ctx.user.id);
    return { success: true };
  }),
});
