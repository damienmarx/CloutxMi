import { sql } from "drizzle-orm";
import { getDb, getWalletByUserId, createWallet, getUserById } from "./db";
import { wallets, transactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type TransactionType = "deposit" | "withdrawal" | "tip" | "game_win" | "game_loss";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface WalletOperationResult {
  success: boolean;
  message: string;
  balance?: string;
  transactionId?: number;
}

/**
 * Get user wallet with balance
 */
export async function getUserWallet(userId: number) {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) {
    // Create wallet if it doesn't exist
    await createWallet(userId);
    return await getWalletByUserId(userId);
  }
  return wallet;
}

/**
 * Deposit funds to user wallet
 */
export async function depositFunds(
  userId: number,
  amount: number,
  description?: string
): Promise<WalletOperationResult> {
  if (amount <= 0) {
    return {
      success: false,
      message: "Deposit amount must be greater than zero",
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
    };
  }

  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return {
        success: false,
        message: "Wallet not found",
      };
    }

    const currentBalance = parseFloat(wallet.balance);
    const newBalance = (currentBalance + amount).toFixed(2);
    const totalDeposited = (parseFloat(wallet.totalDeposited) + amount).toFixed(2);

    // Update wallet
    await db
      .update(wallets)
      .set({
        balance: newBalance,
        totalDeposited,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record transaction
    const result = await db.insert(transactions).values({
      userId,
      type: "deposit",
      amount: amount.toString(),
      status: "completed",
      description: description || "Deposit",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Deposit successful",
      balance: newBalance,
      transactionId: (result as any).insertId,
    };
  } catch (error) {
    console.error("[Wallet] Deposit error:", error);
    return {
      success: false,
      message: "Deposit failed. Please try again.",
    };
  }
}

/**
 * Withdraw funds from user wallet
 */
export async function withdrawFunds(
  userId: number,
  amount: number,
  description?: string
): Promise<WalletOperationResult> {
  if (amount <= 0) {
    return {
      success: false,
      message: "Withdrawal amount must be greater than zero",
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
    };
  }

  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return {
        success: false,
        message: "Wallet not found",
      };
    }

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < amount) {
      return {
        success: false,
        message: "Insufficient balance for withdrawal",
      };
    }

    const newBalance = (currentBalance - amount).toFixed(2);
    const totalWithdrawn = (parseFloat(wallet.totalWithdrawn) + amount).toFixed(2);

    // Update wallet
    await db
      .update(wallets)
      .set({
        balance: newBalance,
        totalWithdrawn,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record transaction
    const result = await db.insert(transactions).values({
      userId,
      type: "withdrawal",
      amount: amount.toString(),
      status: "completed",
      description: description || "Withdrawal",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Withdrawal successful",
      balance: newBalance,
      transactionId: (result as any).insertId,
    };
  } catch (error) {
    console.error("[Wallet] Withdrawal error:", error);
    return {
      success: false,
      message: "Withdrawal failed. Please try again.",
    };
  }
}

/**
 * Transfer funds between players (tip)
 */
export async function tipPlayer(
  fromUserId: number,
  toUserId: number,
  amount: number
): Promise<WalletOperationResult> {
  if (amount <= 0) {
    return {
      success: false,
      message: "Tip amount must be greater than zero",
    };
  }

  if (fromUserId === toUserId) {
    return {
      success: false,
      message: "Cannot tip yourself",
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
    };
  }

  try {
    // Check if recipient exists
    const recipient = await getUserById(toUserId);
    if (!recipient) {
      return {
        success: false,
        message: "Recipient not found",
      };
    }

    const senderWallet = await getUserWallet(fromUserId);
    if (!senderWallet) {
      return {
        success: false,
        message: "Sender wallet not found",
      };
    }

    const senderBalance = parseFloat(senderWallet.balance);
    if (senderBalance < amount) {
      return {
        success: false,
        message: "Insufficient balance for tip",
      };
    }

    const recipientWallet = await getUserWallet(toUserId);
    if (!recipientWallet) {
      return {
        success: false,
        message: "Recipient wallet not found",
      };
    }

    const senderNewBalance = (senderBalance - amount).toFixed(2);
    const recipientBalance = parseFloat(recipientWallet.balance);
    const recipientNewBalance = (recipientBalance + amount).toFixed(2);

    // Update sender wallet
    await db
      .update(wallets)
      .set({
        balance: senderNewBalance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, fromUserId));

    // Update recipient wallet
    await db
      .update(wallets)
      .set({
        balance: recipientNewBalance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, toUserId));

    // Record transaction for sender
    await db.insert(transactions).values({
      userId: fromUserId,
      type: "tip",
      amount: amount.toString(),
      status: "completed",
      relatedUserId: toUserId,
      description: `Tip to ${recipient.username}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Record transaction for recipient
    await db.insert(transactions).values({
      userId: toUserId,
      type: "tip",
      amount: amount.toString(),
      status: "completed",
      relatedUserId: fromUserId,
      description: `Tip from ${senderWallet.userId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Tip sent successfully",
      balance: senderNewBalance,
    };
  } catch (error) {
    console.error("[Wallet] Tip error:", error);
    return {
      success: false,
      message: "Tip failed. Please try again.",
    };
  }
}

/**
 * Record game result (win or loss)
 */
export async function recordGameResult(
  userId: number,
  gameType: string,
  gameId: string,
  amount: number,
  isWin: boolean
): Promise<WalletOperationResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection failed",
    };
  }

  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return {
        success: false,
        message: "Wallet not found",
      };
    }

    const currentBalance = parseFloat(wallet.balance);
    let newBalance: string;

    if (isWin) {
      newBalance = (currentBalance + amount).toFixed(2);
    } else {
      if (currentBalance < amount) {
        return {
          success: false,
          message: "Insufficient balance for game",
        };
      }
      newBalance = (currentBalance - amount).toFixed(2);
    }

    // Update wallet
    await db
      .update(wallets)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record transaction
    const result = await db.insert(transactions).values({
      userId,
      type: isWin ? "game_win" : "game_loss",
      amount: amount.toString(),
      status: "completed",
      gameType,
      gameId,
      description: isWin ? `Won ${amount} from ${gameType}` : `Lost ${amount} in ${gameType}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: isWin ? "Win recorded" : "Loss recorded",
      balance: newBalance,
      transactionId: (result as any).insertId,
    };
  } catch (error) {
    console.error("[Wallet] Game result error:", error);
    return {
      success: false,
      message: "Failed to record game result",
    };
  }
}
