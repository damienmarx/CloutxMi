import { sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getOrCreateWallet,
  connectTrustWallet,
  getTrustWalletConnection,
  getUserWallets,
  recordCryptoTransaction,
  getWalletTransactionHistory,
  generateDepositAddress,
  verifyWalletOwnership,
  getWalletBalance,
  NETWORK_CONFIG,
  ASSET_CONFIG,
} from "./cryptoWalletSystem";
import {
  generateWalletQRCode,
  generatePaymentQRCode,
  createQRCodeRecord,
  createPaymentRequest,
  getQRCodeRecord,
  getPaymentRequest,
  markPaymentRequestAsPaid,
  generateWalletQRCodeSVG,
} from "./qrcodeSystem";

export const cryptoWalletRouter = router({
  /**
   * Connect Trust Wallet to user account
   */
  connectTrustWallet: protectedProcedure
    .input(
      z.object({
        trustWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        networks: z.array(z.enum(["bitcoin", "ethereum", "bsc", "polygon", "arbitrum"])),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const connection = await connectTrustWallet(
          ctx.user.id,
          input.trustWalletAddress,
          input.networks
        );

        return {
          success: true,
          message: "Trust Wallet connected successfully",
          connection,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Trust Wallet connection error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to connect Trust Wallet",
        };
      }
    }),

  /**
   * Get Trust Wallet connection status
   */
  getTrustWalletStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const connection = await getTrustWalletConnection(ctx.user.id);
      return {
        success: true,
        connected: connection !== null,
        connection,
      };
    } catch (error) {
      console.error("[Crypto Wallet] Get Trust Wallet status error:", error);
      return {
        success: false,
        error: "Failed to fetch Trust Wallet status",
        connected: false,
      };
    }
  }),

  /**
   * Create or get a wallet for a specific network/asset
   */
  createWallet: protectedProcedure
    .input(
      z.object({
        network: z.enum(["bitcoin", "ethereum", "bsc", "polygon", "arbitrum"]),
        asset: z.enum(["btc", "eth", "usdc", "usdt", "bnb", "matic"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate a deposit address
        const depositAddress = generateDepositAddress(ctx.user.id, input.network);

        // Create or retrieve wallet
        const wallet = await getOrCreateWallet(
          ctx.user.id,
          input.network,
          input.asset,
          depositAddress
        );

        return {
          success: true,
          wallet,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Create wallet error:", error);
        return {
          success: false,
          error: "Failed to create wallet",
        };
      }
    }),

  /**
   * Get all user wallets
   */
  getUserWallets: protectedProcedure.query(async ({ ctx }) => {
    try {
      const wallets = await getUserWallets(ctx.user.id);
      return {
        success: true,
        wallets,
      };
    } catch (error) {
      console.error("[Crypto Wallet] Get user wallets error:", error);
      return {
        success: false,
        error: "Failed to fetch wallets",
        wallets: [],
      };
    }
  }),

  /**
   * Generate QR code for wallet address
   */
  generateWalletQRCode: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        network: z.enum(["bitcoin", "ethereum", "bsc", "polygon", "arbitrum"]),
        asset: z.enum(["btc", "eth", "usdc", "usdt", "bnb", "matic"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate QR code
        const qrCodeDataUrl = await generateWalletQRCode(
          ctx.user.id,
          input.walletAddress,
          input.network,
          input.asset
        );

        // Store QR code record
        const qrRecord = await createQRCodeRecord(
          ctx.user.id,
          input.walletAddress,
          input.network,
          input.asset,
          qrCodeDataUrl
        );

        return {
          success: true,
          qrCode: qrCodeDataUrl,
          qrRecord,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Generate QR code error:", error);
        return {
          success: false,
          error: "Failed to generate QR code",
        };
      }
    }),

  /**
   * Generate payment QR code with amount
   */
  generatePaymentQRCode: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount format"),
        asset: z.enum(["btc", "eth", "usdc", "usdt", "bnb", "matic"]),
        network: z.enum(["bitcoin", "ethereum", "bsc", "polygon", "arbitrum"]),
        usdValue: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate payment QR code
        const qrCodeDataUrl = await generatePaymentQRCode(
          ctx.user.id,
          input.walletAddress,
          input.amount,
          input.asset,
          input.network
        );

        // Store QR code record
        const qrRecord = await createQRCodeRecord(
          ctx.user.id,
          input.walletAddress,
          input.network,
          input.asset,
          qrCodeDataUrl,
          input.amount,
          input.usdValue
        );

        return {
          success: true,
          qrCode: qrCodeDataUrl,
          qrRecord,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Generate payment QR code error:", error);
        return {
          success: false,
          error: "Failed to generate payment QR code",
        };
      }
    }),

  /**
   * Create a payment request
   */
  createPaymentRequest: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount format"),
        asset: z.enum(["btc", "eth", "usdc", "usdt", "bnb", "matic"]),
        network: z.enum(["bitcoin", "ethereum", "bsc", "polygon", "arbitrum"]),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const paymentRequest = await createPaymentRequest(
          ctx.user.id,
          input.walletAddress,
          input.amount,
          input.asset,
          input.network,
          input.description || "Degens♧Den Deposit"
        );

        return {
          success: true,
          paymentRequest,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Create payment request error:", error);
        return {
          success: false,
          error: "Failed to create payment request",
        };
      }
    }),

  /**
   * Get payment request
   */
  getPaymentRequest: publicProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      try {
        const paymentRequest = await getPaymentRequest(input.requestId);

        if (!paymentRequest) {
          return {
            success: false,
            error: "Payment request not found",
          };
        }

        return {
          success: true,
          paymentRequest,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Get payment request error:", error);
        return {
          success: false,
          error: "Failed to fetch payment request",
        };
      }
    }),

  /**
   * Record a crypto transaction
   */
  recordTransaction: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        type: z.enum(["deposit", "withdrawal", "transfer"]),
        amount: z.string(),
        usdValue: z.string(),
        txHash: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const transaction = await recordCryptoTransaction(
          ctx.user.id,
          input.walletId,
          input.type,
          input.amount,
          input.usdValue,
          input.txHash
        );

        return {
          success: true,
          transaction,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Record transaction error:", error);
        return {
          success: false,
          error: "Failed to record transaction",
        };
      }
    }),

  /**
   * Get wallet transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(z.object({ walletId: z.string(), limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      try {
        const limit = input.limit || 50;
        const transactions = await getWalletTransactionHistory(input.walletId, limit);

        return {
          success: true,
          transactions,
        };
      } catch (error) {
        console.error("[Crypto Wallet] Get transaction history error:", error);
        return {
          success: false,
          error: "Failed to fetch transaction history",
          transactions: [],
        };
      }
    }),

  /**
   * Get network configuration
   */
  getNetworkConfig: publicProcedure
    .input(z.object({ network: z.enum(["bitcoin", "ethereum", "bsc", "polygon", "arbitrum"]) }))
    .query(async ({ input }) => {
      return {
        success: true,
        config: NETWORK_CONFIG[input.network],
      };
    }),

  /**
   * Get asset configuration
   */
  getAssetConfig: publicProcedure
    .input(z.object({ asset: z.enum(["btc", "eth", "usdc", "usdt", "bnb", "matic"]) }))
    .query(async ({ input }) => {
      return {
        success: true,
        config: ASSET_CONFIG[input.asset],
      };
    }),

  /**
   * Get all supported networks and assets
   */
  getSupportedNetworksAndAssets: publicProcedure.query(async () => {
    return {
      success: true,
      networks: Object.keys(NETWORK_CONFIG),
      assets: Object.keys(ASSET_CONFIG),
      networkConfig: NETWORK_CONFIG,
      assetConfig: ASSET_CONFIG,
    };
  }),
});
