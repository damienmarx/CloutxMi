/**
 * OSRS Deposit/Withdraw System
 * Handles OSRS GP deposits and withdrawals with secure transaction logging
 * Integrates with Trust Wallet and currency exchange system
 */

import { getDb } from "./db";
import { convertCurrency, formatCurrency, validateDepositAmount, validateWithdrawAmount } from "./currencyExchange";
import { sql } from "drizzle-orm";
import { transactions, wallets, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface OSRSDepositRequest {
  userId: number;
  amountGP: number; // Amount in OSRS GP (Mils)
  trustWalletAddress: string;
  transactionHash?: string; // Blockchain transaction hash for verification
}

export interface OSRSWithdrawRequest {
  userId: number;
  amountGP: number; // Amount in OSRS GP (Mils)
  trustWalletAddress: string;
}

export interface DepositResponse {
  success: boolean;
  message: string;
  depositId?: string;
  amountUSD?: number;
  amountCAD?: number;
  newBalance?: number;
  error?: string;
}

export interface WithdrawResponse {
  success: boolean;
  message: string;
  withdrawId?: string;
  amountUSD?: number;
  amountCAD?: number;
  newBalance?: number;
  error?: string;
}

/**
 * Process OSRS deposit
 * Converts OSRS GP to USD and credits player wallet
 */
export async function processOSRSDeposit(request: OSRSDepositRequest): Promise<DepositResponse> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database unavailable", error: "DB_ERROR" };
  }

  try {
    // Validate deposit amount
    const validation = validateDepositAmount(request.amountGP, "OSRS_GP");
    if (!validation.valid) {
      return { success: false, message: validation.error || "Invalid deposit amount", error: "INVALID_AMOUNT" };
    }

    // Convert OSRS GP to USD
    const amountUSD = convertCurrency(request.amountGP, "OSRS_GP", "USD");
    const amountCAD = convertCurrency(request.amountGP, "OSRS_GP", "CAD");

    // Get user wallet
    const walletResult = await db.select().from(wallets).where(eq(wallets.userId, request.userId)).execute();
    if (!walletResult || walletResult.length === 0) {
      return { success: false, message: "User wallet not found", error: "WALLET_NOT_FOUND" };
    }

    const wallet = walletResult[0];
    const currentBalance = parseFloat(wallet.balance);
    const newBalance = currentBalance + amountUSD;

    // Update wallet balance
    await db
      .update(wallets)
      .set({
        balance: newBalance.toFixed(2),
        totalDeposited: (parseFloat(wallet.totalDeposited) + amountUSD).toFixed(2),
      })
      .where(eq(wallets.userId, request.userId))
      .execute();

    // Record transaction
    const depositId = `OSRS_DEPOSIT_${Date.now()}`;
    await db
      .insert(transactions)
      .values({
        userId: request.userId,
        type: "osrs_deposit",
        amount: amountUSD,
        description: `OSRS GP Deposit: ${formatCurrency(request.amountGP, "OSRS_GP")} (${formatCurrency(amountUSD, "USD")})`,
        status: "completed",
        currency: "USD",
        metadata: JSON.stringify({
          osrsAmount: request.amountGP,
          trustWalletAddress: request.trustWalletAddress,
          transactionHash: request.transactionHash,
          convertedToUSD: amountUSD,
          convertedToCAD: amountCAD,
        }),
      })
      .execute();

    return {
      success: true,
      message: "OSRS deposit successful",
      depositId,
      amountUSD,
      amountCAD,
      newBalance,
    };
  } catch (error) {
    console.error("[OSRS Deposit] Error:", error);
    return {
      success: false,
      message: "Failed to process OSRS deposit",
      error: "PROCESSING_ERROR",
    };
  }
}

/**
 * Process OSRS withdrawal
 * Converts USD balance to OSRS GP and initiates withdrawal
 */
export async function processOSRSWithdraw(request: OSRSWithdrawRequest): Promise<WithdrawResponse> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database unavailable", error: "DB_ERROR" };
  }

  try {
    // Validate withdrawal amount
    const validation = validateWithdrawAmount(request.amountGP, "OSRS_GP");
    if (!validation.valid) {
      return { success: false, message: validation.error || "Invalid withdrawal amount", error: "INVALID_AMOUNT" };
    }

    // Convert OSRS GP to USD
    const amountUSD = convertCurrency(request.amountGP, "OSRS_GP", "USD");
    const amountCAD = convertCurrency(request.amountGP, "OSRS_GP", "CAD");

    // Get user wallet
    const walletResult = await db.select().from(wallets).where(eq(wallets.userId, request.userId)).execute();
    if (!walletResult || walletResult.length === 0) {
      return { success: false, message: "User wallet not found", error: "WALLET_NOT_FOUND" };
    }

    const wallet = walletResult[0];
    const currentBalance = parseFloat(wallet.balance);

    // Check sufficient balance
    if (currentBalance < amountUSD) {
      return {
        success: false,
        message: `Insufficient balance. Required: ${formatCurrency(amountUSD, "USD")}, Available: ${formatCurrency(currentBalance, "USD")}`,
        error: "INSUFFICIENT_BALANCE",
      };
    }

    const newBalance = currentBalance - amountUSD;

    // Update wallet balance
    await db
      .update(wallets)
      .set({
        balance: newBalance.toFixed(2),
        totalWithdrawn: (parseFloat(wallet.totalWithdrawn) + amountUSD).toFixed(2),
      })
      .where(eq(wallets.userId, request.userId))
      .execute();

    // Record transaction
    const withdrawId = `OSRS_WITHDRAW_${Date.now()}`;
    await db
      .insert(transactions)
      .values({
        userId: request.userId,
        type: "osrs_withdrawal",
        amount: amountUSD,
        description: `OSRS GP Withdrawal: ${formatCurrency(request.amountGP, "OSRS_GP")} (${formatCurrency(amountUSD, "USD")})`,
        status: "pending", // Will be updated to "completed" once blockchain confirms
        currency: "USD",
        metadata: JSON.stringify({
          osrsAmount: request.amountGP,
          trustWalletAddress: request.trustWalletAddress,
          convertedToUSD: amountUSD,
          convertedToCAD: amountCAD,
        }),
      })
      .execute();

    return {
      success: true,
      message: "OSRS withdrawal initiated. Please allow 24-48 hours for processing.",
      withdrawId,
      amountUSD,
      amountCAD,
      newBalance,
    };
  } catch (error) {
    console.error("[OSRS Withdraw] Error:", error);
    return {
      success: false,
      message: "Failed to process OSRS withdrawal",
      error: "PROCESSING_ERROR",
    };
  }
}

/**
 * Get deposit instructions for player
 */
export function getDepositInstructions(): string {
  return `
    OSRS GP Deposit Instructions:
    
    1. Open Trust Wallet or your preferred OSRS wallet
    2. Navigate to the send/transfer section
    3. Enter the deposit address provided below
    4. Enter the amount of OSRS GP you wish to deposit
    5. Confirm the transaction
    6. Your casino wallet will be credited within 5-10 minutes
    
    Exchange Rate: 1 USD = 1,000,000 OSRS GP
    
    Note: Deposits are non-reversible. Ensure you enter the correct amount.
  `;
}

/**
 * Get withdrawal instructions for player
 */
export function getWithdrawalInstructions(): string {
  return `
    OSRS GP Withdrawal Instructions:
    
    1. Enter your Trust Wallet address (where you want to receive GP)
    2. Enter the amount of OSRS GP you wish to withdraw
    3. Review the conversion to USD/CAD
    4. Confirm the withdrawal request
    5. Our system will process your withdrawal within 24-48 hours
    6. You will receive a confirmation email with transaction details
    
    Exchange Rate: 1 USD = 1,000,000 OSRS GP
    
    Note: Withdrawals may take up to 48 hours to process.
    You will receive an email confirmation once your withdrawal is complete.
  `;
}
