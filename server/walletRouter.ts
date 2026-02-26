/**
 * Wallet Router
 * Handles all wallet-related operations including deposits, withdrawals, and OSRS transactions
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getUserWallet, depositFunds, withdrawFunds, tipPlayer } from "./wallet";
import { processOSRSDeposit, processOSRSWithdraw, getDepositInstructions, getWithdrawalInstructions } from "./osrsDepositWithdraw";
import { convertCurrency, formatCurrency, validateDepositAmount, validateWithdrawAmount } from "./currencyExchange";

export const walletRouter = router({
  // Get current wallet balance
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getUserWallet(ctx.user.id);
    return {
      balance: wallet?.balance || "0.00",
      totalDeposited: wallet?.totalDeposited || "0.00",
      totalWithdrawn: wallet?.totalWithdrawn || "0.00",
      currency: "USD",
    };
  }),

  // Deposit fiat currency (USD/CAD)
  depositFiat: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive("Amount must be positive"),
        currency: z.enum(["USD", "CAD"]),
        paymentMethod: z.enum(["credit_card", "bank_transfer", "paypal"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate deposit amount
      const validation = validateDepositAmount(input.amount, input.currency);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Convert to USD if CAD
      const amountUSD = input.currency === "CAD" ? convertCurrency(input.amount, "CAD", "USD") : input.amount;

      // Process deposit
      const result = await depositFunds(ctx.user.id, amountUSD, `Fiat deposit via ${input.paymentMethod}`);

      return {
        success: result.success,
        message: result.message,
        amountDeposited: input.amount,
        amountInUSD: amountUSD,
        currency: input.currency,
      };
    }),

  // Withdraw fiat currency (USD/CAD)
  withdrawFiat: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive("Amount must be positive"),
        currency: z.enum(["USD", "CAD"]),
        bankAccount: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate withdrawal amount
      const validation = validateWithdrawAmount(input.amount, input.currency);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Convert to USD if CAD
      const amountUSD = input.currency === "CAD" ? convertCurrency(input.amount, "CAD", "USD") : input.amount;

      // Process withdrawal
      const result = await withdrawFunds(ctx.user.id, amountUSD, `Fiat withdrawal to ${input.bankAccount || "registered account"}`);

      return {
        success: result.success,
        message: result.message,
        amountWithdrawn: input.amount,
        amountInUSD: amountUSD,
        currency: input.currency,
      };
    }),

  // Deposit OSRS GP
  depositOSRSGP: protectedProcedure
    .input(
      z.object({
        amountGP: z.number().positive("Amount must be positive"),
        trustWalletAddress: z.string().min(1, "Wallet address required"),
        transactionHash: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await processOSRSDeposit({
        userId: ctx.user.id,
        amountGP: input.amountGP,
        trustWalletAddress: input.trustWalletAddress,
        transactionHash: input.transactionHash,
      });

      return result;
    }),

  // Withdraw OSRS GP
  withdrawOSRSGP: protectedProcedure
    .input(
      z.object({
        amountGP: z.number().positive("Amount must be positive"),
        trustWalletAddress: z.string().min(1, "Wallet address required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await processOSRSWithdraw({
        userId: ctx.user.id,
        amountGP: input.amountGP,
        trustWalletAddress: input.trustWalletAddress,
      });

      return result;
    }),

  // Get currency conversion rates
  getExchangeRates: protectedProcedure.query(() => {
    return {
      USD_to_CAD: convertCurrency(1, "USD", "CAD"),
      CAD_to_USD: convertCurrency(1, "CAD", "USD"),
      USD_to_OSRS_GP: convertCurrency(1, "USD", "OSRS_GP"),
      OSRS_GP_to_USD: convertCurrency(1000000, "OSRS_GP", "USD"), // 1 Million GP
      CAD_to_OSRS_GP: convertCurrency(1, "CAD", "OSRS_GP"),
      OSRS_GP_to_CAD: convertCurrency(1000000, "OSRS_GP", "CAD"), // 1 Million GP
    };
  }),

  // Get deposit instructions
  getDepositInstructions: protectedProcedure.query(() => {
    return {
      fiatInstructions: "Contact support for fiat deposit instructions",
      osrsInstructions: getDepositInstructions(),
    };
  }),

  // Get withdrawal instructions
  getWithdrawalInstructions: protectedProcedure.query(() => {
    return {
      fiatInstructions: "Contact support for fiat withdrawal instructions",
      osrsInstructions: getWithdrawalInstructions(),
    };
  }),

  // Tip another player
  tipPlayer: protectedProcedure
    .input(
      z.object({
        toUsername: z.string(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await tipPlayer(ctx.user.id, 0, input.amount); // Note: toUserId needs to be fetched from username first
      return result;
    }),

  // Get transaction history
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      // This would fetch from the transactions table
      // Implementation depends on your database schema
      return {
        transactions: [],
        total: 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  // Format currency for display
  formatCurrency: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        currency: z.enum(["USD", "CAD", "OSRS_GP"]),
      })
    )
    .query(({ input }) => {
      return {
        formatted: formatCurrency(input.amount, input.currency),
        symbol: input.currency === "USD" ? "$" : input.currency === "CAD" ? "C$" : "GP",
      };
    }),
});
