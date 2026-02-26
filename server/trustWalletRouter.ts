import { sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  TRUST_WALLET_CONFIG,
  getDepositAddress,
  getDepositInstructions,
  validateDepositAmount,
  getWithdrawalFee,
  getProcessingTime,
} from "./trustWalletConfig";
import {
  generateWalletQRCode,
  generatePaymentQRCode,
  createPaymentRequest,
} from "./qrcodeSystem";

export const trustWalletRouter = router({
  /**
   * Get Trust Wallet configuration and supported networks/assets
   */
  getConfig: publicProcedure.query(async () => {
    return {
      success: true,
      config: {
        primaryWallet: TRUST_WALLET_CONFIG.primaryWallet,
        supportedNetworks: Object.keys(TRUST_WALLET_CONFIG.supportedNetworks),
        supportedAssets: Object.keys(TRUST_WALLET_CONFIG.supportedAssets),
        depositFee: TRUST_WALLET_CONFIG.feeConfig.depositFee,
        support: TRUST_WALLET_CONFIG.support,
      },
    };
  }),

  /**
   * Get deposit address for user
   */
  getDepositAddress: protectedProcedure
    .input(z.object({ network: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const address = getDepositAddress(ctx.user.id, input.network);
        return {
          success: true,
          address,
          network: input.network,
          primaryWallet: TRUST_WALLET_CONFIG.primaryWallet,
        };
      } catch (error) {
        console.error("[Trust Wallet] Get deposit address error:", error);
        return {
          success: false,
          error: "Failed to get deposit address",
        };
      }
    }),

  /**
   * Get deposit instructions for a network
   */
  getDepositInstructions: publicProcedure
    .input(z.object({ network: z.string() }))
    .query(async ({ input }) => {
      try {
        const instructions = getDepositInstructions(input.network);
        const networkConfig = TRUST_WALLET_CONFIG.supportedNetworks[input.network as keyof typeof TRUST_WALLET_CONFIG.supportedNetworks];

        return {
          success: true,
          network: input.network,
          instructions,
          networkInfo: networkConfig,
        };
      } catch (error) {
        console.error("[Trust Wallet] Get deposit instructions error:", error);
        return {
          success: false,
          error: "Failed to get deposit instructions",
        };
      }
    }),

  /**
   * Generate deposit QR code with Trust Wallet address
   */
  generateDepositQRCode: protectedProcedure
    .input(
      z.object({
        network: z.string(),
        asset: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const address = getDepositAddress(ctx.user.id, input.network);

        // Generate QR code for wallet address
        const qrCodeDataUrl = await generateWalletQRCode(
          ctx.user.id,
          address,
          input.network,
          input.asset
        );

        return {
          success: true,
          qrCode: qrCodeDataUrl,
          walletAddress: address,
          network: input.network,
          asset: input.asset,
          instructions: getDepositInstructions(input.network),
        };
      } catch (error) {
        console.error("[Trust Wallet] Generate deposit QR code error:", error);
        return {
          success: false,
          error: "Failed to generate QR code",
        };
      }
    }),

  /**
   * Generate payment request with QR code
   */
  generatePaymentRequest: protectedProcedure
    .input(
      z.object({
        amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount format"),
        asset: z.string(),
        network: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const address = getDepositAddress(ctx.user.id, input.network);

        // Validate deposit amount
        const validation = validateDepositAmount(
          parseFloat(input.amount),
          input.network,
          input.asset
        );

        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
          };
        }

        // Generate payment QR code
        const qrCodeDataUrl = await generatePaymentQRCode(
          ctx.user.id,
          address,
          input.amount,
          input.asset,
          input.network
        );

        // Create payment request
        const paymentRequest = await createPaymentRequest(
          ctx.user.id,
          address,
          input.amount,
          input.asset,
          input.network,
          input.description || `Degens♧Den Deposit - ${input.asset.toUpperCase()}`
        );

        return {
          success: true,
          paymentRequest,
          qrCode: qrCodeDataUrl,
          walletAddress: address,
          amount: input.amount,
          asset: input.asset,
          network: input.network,
        };
      } catch (error) {
        console.error("[Trust Wallet] Generate payment request error:", error);
        return {
          success: false,
          error: "Failed to generate payment request",
        };
      }
    }),

  /**
   * Get supported networks with details
   */
  getSupportedNetworks: publicProcedure.query(async () => {
    return {
      success: true,
      networks: TRUST_WALLET_CONFIG.supportedNetworks,
    };
  }),

  /**
   * Get supported assets with details
   */
  getSupportedAssets: publicProcedure.query(async () => {
    return {
      success: true,
      assets: TRUST_WALLET_CONFIG.supportedAssets,
    };
  }),

  /**
   * Validate deposit amount
   */
  validateDepositAmount: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        network: z.string(),
        asset: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const validation = validateDepositAmount(input.amount, input.network, input.asset);

        return {
          success: validation.valid,
          valid: validation.valid,
          error: validation.error,
          amount: input.amount,
          network: input.network,
          asset: input.asset,
        };
      } catch (error) {
        console.error("[Trust Wallet] Validate deposit amount error:", error);
        return {
          success: false,
          valid: false,
          error: "Failed to validate deposit amount",
        };
      }
    }),

  /**
   * Get withdrawal information
   */
  getWithdrawalInfo: publicProcedure
    .input(z.object({ network: z.string() }))
    .query(async ({ input }) => {
      try {
        const fee = getWithdrawalFee(input.network);
        const processingTime = getProcessingTime(input.network);
        const networkConfig = TRUST_WALLET_CONFIG.supportedNetworks[input.network as keyof typeof TRUST_WALLET_CONFIG.supportedNetworks];

        return {
          success: true,
          network: input.network,
          fee,
          processingTime,
          networkInfo: networkConfig,
        };
      } catch (error) {
        console.error("[Trust Wallet] Get withdrawal info error:", error);
        return {
          success: false,
          error: "Failed to get withdrawal information",
        };
      }
    }),

  /**
   * Get support contact information
   */
  getSupport: publicProcedure.query(async () => {
    return {
      success: true,
      support: TRUST_WALLET_CONFIG.support,
    };
  }),

  /**
   * Get primary wallet address (goatgang@trust)
   */
  getPrimaryWallet: publicProcedure.query(async () => {
    return {
      success: true,
      primaryWallet: TRUST_WALLET_CONFIG.primaryWallet,
      description: "Primary Trust Wallet for Degens♧Den deposits",
    };
  }),
});
