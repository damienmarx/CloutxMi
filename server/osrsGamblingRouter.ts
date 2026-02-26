import { sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getOsrsItemValue,
  createOsrsItemBet,
  getCryptoRate,
  convertCryptoToUsd,
  convertUsdToCrypto,
  createCryptoPayment,
  getUserCryptoWallets,
  awardOsrsCosmetic,
  getUserCosmetics,
  createClan,
  joinClan,
  OSRS_ITEM_VALUES,
  OSRS_COSMETICS,
} from "./osrsGamblingFeatures";

export const osrsGamblingRouter = router({
  /**
   * Get OSRS item value
   */
  getItemValue: publicProcedure
    .input(z.object({ itemName: z.string() }))
    .query(async ({ input }) => {
      const value = getOsrsItemValue(input.itemName);
      return {
        success: true,
        itemName: input.itemName,
        value,
      };
    }),

  /**
   * Get all OSRS item values
   */
  getAllItemValues: publicProcedure.query(async () => {
    return {
      success: true,
      items: OSRS_ITEM_VALUES,
    };
  }),

  /**
   * Create OSRS item bet
   */
  createItemBet: protectedProcedure
    .input(
      z.object({
        itemName: z.string(),
        gameType: z.string(),
        betAmount: z.number().positive(),
        won: z.boolean(),
        result: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const bet = await createOsrsItemBet(
          ctx.user.id,
          input.itemName,
          input.gameType,
          input.betAmount,
          input.won,
          input.result
        );
        return {
          success: true,
          bet,
        };
      } catch (error) {
        console.error("[OSRS Gambling] Error creating item bet:", error);
        return {
          success: false,
          error: "Failed to create item bet",
        };
      }
    }),

  /**
   * Get crypto exchange rates
   */
  getCryptoRates: publicProcedure.query(async () => {
    return {
      success: true,
      rates: {
        btc: getCryptoRate("btc"),
        eth: getCryptoRate("eth"),
        usdc: getCryptoRate("usdc"),
        osrs_gp: getCryptoRate("osrs_gp"),
      },
    };
  }),

  /**
   * Convert crypto to USD
   */
  convertToUsd: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        cryptoType: z.enum(["btc", "eth", "usdc", "osrs_gp"]),
      })
    )
    .query(async ({ input }) => {
      const usdValue = convertCryptoToUsd(input.amount, input.cryptoType);
      return {
        success: true,
        amount: input.amount,
        cryptoType: input.cryptoType,
        usdValue,
      };
    }),

  /**
   * Convert USD to crypto
   */
  convertToCrypto: publicProcedure
    .input(
      z.object({
        usdAmount: z.number().positive(),
        cryptoType: z.enum(["btc", "eth", "usdc", "osrs_gp"]),
      })
    )
    .query(async ({ input }) => {
      const cryptoAmount = convertUsdToCrypto(input.usdAmount, input.cryptoType);
      return {
        success: true,
        usdAmount: input.usdAmount,
        cryptoType: input.cryptoType,
        cryptoAmount,
      };
    }),

  /**
   * Create crypto payment
   */
  createCryptoPayment: protectedProcedure
    .input(
      z.object({
        cryptoType: z.enum(["btc", "eth", "usdc", "osrs_gp"]),
        amount: z.number().positive(),
        walletAddress: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const payment = await createCryptoPayment(
          ctx.user.id,
          input.cryptoType,
          input.amount,
          input.walletAddress
        );
        return {
          success: true,
          payment,
        };
      } catch (error) {
        console.error("[OSRS Gambling] Error creating crypto payment:", error);
        return {
          success: false,
          error: "Failed to create crypto payment",
        };
      }
    }),

  /**
   * Get user's crypto wallets
   */
  getUserCryptoWallets: protectedProcedure.query(async ({ ctx }) => {
    try {
      const wallets = await getUserCryptoWallets(ctx.user.id);
      return {
        success: true,
        wallets,
      };
    } catch (error) {
      console.error("[OSRS Gambling] Error getting crypto wallets:", error);
      return {
        success: false,
        error: "Failed to fetch crypto wallets",
      };
    }
  }),

  /**
   * Award OSRS cosmetic
   */
  awardCosmetic: protectedProcedure
    .input(
      z.object({
        cosmeticType: z.enum(["title", "pet", "cape"]),
        cosmeticName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await awardOsrsCosmetic(ctx.user.id, input.cosmeticType, input.cosmeticName);
        return {
          success: true,
          message: "Cosmetic awarded successfully",
        };
      } catch (error) {
        console.error("[OSRS Gambling] Error awarding cosmetic:", error);
        return {
          success: false,
          error: "Failed to award cosmetic",
        };
      }
    }),

  /**
   * Get user's cosmetics
   */
  getUserCosmetics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cosmetics = await getUserCosmetics(ctx.user.id);
      return {
        success: true,
        cosmetics,
      };
    } catch (error) {
      console.error("[OSRS Gambling] Error getting cosmetics:", error);
      return {
        success: false,
        error: "Failed to fetch cosmetics",
      };
    }
  }),

  /**
   * Get available cosmetics
   */
  getAvailableCosmetics: publicProcedure.query(async () => {
    return {
      success: true,
      cosmetics: OSRS_COSMETICS,
    };
  }),

  /**
   * Create clan
   */
  createClan: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(32),
        description: z.string().max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const clan = await createClan(input.name, ctx.user.id, input.description);
        return {
          success: true,
          clan,
        };
      } catch (error) {
        console.error("[OSRS Gambling] Error creating clan:", error);
        return {
          success: false,
          error: "Failed to create clan",
        };
      }
    }),

  /**
   * Join clan
   */
  joinClan: protectedProcedure
    .input(z.object({ clanId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await joinClan(ctx.user.id, input.clanId);
        return {
          success: true,
          message: "Joined clan successfully",
        };
      } catch (error) {
        console.error("[OSRS Gambling] Error joining clan:", error);
        return {
          success: false,
          error: "Failed to join clan",
        };
      }
    }),
});
