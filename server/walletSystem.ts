/**
 * CloutScape Wallet System
 * Handles balance tracking, deposits, withdrawals, and transactions
 * Theme: Obsidian (#000000) with Gold (#FFD700) accents
 */

import { db } from "./db";
import { wallets, transactions, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

export interface WalletBalance {
  balance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  currency: string;
}

export interface DepositRequest {
  userId: number;
  amount: number;
  paymentMethod: "stripe" | "crypto" | "bank_transfer";
  currency: "USD" | "EUR" | "GBP";
}

export interface WithdrawRequest {
  userId: number;
  amount: number;
  withdrawalMethod: "stripe" | "crypto" | "bank_transfer";
  destination: string; // wallet address, bank account, etc.
}

export interface TransactionRecord {
  id: number;
  userId: number;
  type: "deposit" | "withdrawal" | "tip" | "game_win" | "game_loss";
  amount: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string | null;
  gameType: string | null;
  createdAt: Date;
}

/**
 * Wallet Service - Core wallet operations
 */
export class WalletService {
  /**
   * Get user's wallet balance
   */
  static async getBalance(userId: number): Promise<WalletBalance> {
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!wallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found for user",
      });
    }

    return {
      balance: wallet.balance.toString(),
      totalDeposited: wallet.totalDeposited.toString(),
      totalWithdrawn: wallet.totalWithdrawn.toString(),
      currency: "USD",
    };
  }

  /**
   * Create wallet for new user
   */
  static async createWallet(userId: number): Promise<void> {
    await db.insert(wallets).values({
      userId,
      balance: "0.00",
      totalDeposited: "0.00",
      totalWithdrawn: "0.00",
    });
  }

  /**
   * Process deposit
   */
  static async processDeposit(request: DepositRequest): Promise<string> {
    // Validate amount
    if (request.amount <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Deposit amount must be greater than 0",
      });
    }

    if (request.amount > 100000) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Deposit amount exceeds maximum limit",
      });
    }

    const transactionId = crypto.randomUUID();

    try {
      // Create transaction record
      await db.insert(transactions).values({
        id: undefined,
        userId: request.userId,
        type: "deposit",
        amount: request.amount.toString(),
        status: "pending",
        description: `Deposit via ${request.paymentMethod}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Process payment based on method
      switch (request.paymentMethod) {
        case "stripe":
          await this.processStripeDeposit(request, transactionId);
          break;
        case "crypto":
          await this.processCryptoDeposit(request, transactionId);
          break;
        case "bank_transfer":
          await this.processBankTransfer(request, transactionId);
          break;
      }

      return transactionId;
    } catch (error) {
      // Mark transaction as failed
      await db
        .update(transactions)
        .set({ status: "failed" })
        .where(eq(transactions.id, parseInt(transactionId)));

      throw error;
    }
  }

  /**
   * Process withdrawal
   */
  static async processWithdrawal(request: WithdrawRequest): Promise<string> {
    // Validate amount
    if (request.amount <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Withdrawal amount must be greater than 0",
      });
    }

    // Check balance
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, request.userId),
    });

    if (!wallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      });
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < request.amount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient balance for withdrawal",
      });
    }

    const transactionId = crypto.randomUUID();

    try {
      // Deduct from balance
      const newBalance = currentBalance - request.amount;
      await db
        .update(wallets)
        .set({
          balance: newBalance.toString(),
          totalWithdrawn: (
            parseFloat(wallet.totalWithdrawn.toString()) + request.amount
          ).toString(),
        })
        .where(eq(wallets.userId, request.userId));

      // Create transaction record
      await db.insert(transactions).values({
        id: undefined,
        userId: request.userId,
        type: "withdrawal",
        amount: request.amount.toString(),
        status: "pending",
        description: `Withdrawal via ${request.withdrawalMethod}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Process withdrawal based on method
      switch (request.withdrawalMethod) {
        case "stripe":
          await this.processStripePayout(request, transactionId);
          break;
        case "crypto":
          await this.processCryptoPayout(request, transactionId);
          break;
        case "bank_transfer":
          await this.processBankTransferPayout(request, transactionId);
          break;
      }

      return transactionId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add funds to wallet (for game wins, bonuses, etc.)
   */
  static async addFunds(
    userId: number,
    amount: number,
    reason: string
  ): Promise<void> {
    if (amount <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Amount must be greater than 0",
      });
    }

    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!wallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      });
    }

    const newBalance = parseFloat(wallet.balance.toString()) + amount;

    await db
      .update(wallets)
      .set({ balance: newBalance.toString() })
      .where(eq(wallets.userId, userId));

    // Log transaction
    await db.insert(transactions).values({
      id: undefined,
      userId,
      type: "game_win",
      amount: amount.toString(),
      status: "completed",
      description: reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Deduct funds from wallet (for game losses, fees, etc.)
   */
  static async deductFunds(
    userId: number,
    amount: number,
    reason: string
  ): Promise<void> {
    if (amount <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Amount must be greater than 0",
      });
    }

    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!wallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      });
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < amount) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient balance",
      });
    }

    const newBalance = currentBalance - amount;

    await db
      .update(wallets)
      .set({ balance: newBalance.toString() })
      .where(eq(wallets.userId, userId));

    // Log transaction
    await db.insert(transactions).values({
      id: undefined,
      userId,
      type: "game_loss",
      amount: amount.toString(),
      status: "completed",
      description: reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    userId: number,
    limit: number = 50
  ): Promise<TransactionRecord[]> {
    const txns = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      limit,
      orderBy: (t) => t.createdAt,
    });

    return txns as TransactionRecord[];
  }

  /**
   * Private methods for payment processing
   */

  private static async processStripeDeposit(
    request: DepositRequest,
    transactionId: string
  ): Promise<void> {
    // TODO: Integrate with Stripe API
    // For now, simulate successful deposit
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, request.userId),
    });

    if (wallet) {
      const newBalance =
        parseFloat(wallet.balance.toString()) + request.amount;
      const newDeposited =
        parseFloat(wallet.totalDeposited.toString()) + request.amount;

      await db
        .update(wallets)
        .set({
          balance: newBalance.toString(),
          totalDeposited: newDeposited.toString(),
        })
        .where(eq(wallets.userId, request.userId));

      // Mark transaction as completed
      await db
        .update(transactions)
        .set({ status: "completed" })
        .where(eq(transactions.id, parseInt(transactionId)));
    }
  }

  private static async processCryptoDeposit(
    request: DepositRequest,
    transactionId: string
  ): Promise<void> {
    // TODO: Integrate with crypto payment processor
    // For now, simulate pending deposit
    console.log(`Processing crypto deposit: ${request.amount} ${request.currency}`);
  }

  private static async processBankTransfer(
    request: DepositRequest,
    transactionId: string
  ): Promise<void> {
    // TODO: Integrate with bank transfer API
    console.log(`Processing bank transfer: ${request.amount} ${request.currency}`);
  }

  private static async processStripePayout(
    request: WithdrawRequest,
    transactionId: string
  ): Promise<void> {
    // TODO: Integrate with Stripe payout API
    console.log(`Processing Stripe payout: ${request.amount}`);
  }

  private static async processCryptoPayout(
    request: WithdrawRequest,
    transactionId: string
  ): Promise<void> {
    // TODO: Integrate with crypto payout processor
    console.log(`Processing crypto payout to ${request.destination}`);
  }

  private static async processBankTransferPayout(
    request: WithdrawRequest,
    transactionId: string
  ): Promise<void> {
    // TODO: Integrate with bank transfer API
    console.log(`Processing bank transfer payout to ${request.destination}`);
  }
}

export default WalletService;
