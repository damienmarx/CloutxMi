/**
 * CloutScape / Degens Den - Dual Currency Wallet System
 * Supports Crypto (goatgang@trust) and OSRS GP (Goat7Gang)
 */

import { db } from './db';
import { users, wallets, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface WalletBalance {
  userId: number;
  cryptoBalance: number;      // USD value in crypto
  osrsGpBalance: number;       // OSRS GP amount
  totalBalanceUsd: number;     // Combined USD value
  displayCurrency: 'USD' | 'EUR' | 'GBP' | 'CRYPTO' | 'GP';
}

export interface DepositInfo {
  crypto: {
    address: 'goatgang@trust';
    networks: string[];
    qrCode?: string;
  };
  osrs: {
    username: 'Goat7Gang';
    world: 'Any world';
    instructions: string;
  };
}

// Live conversion rates
const OSRS_GP_TO_USD = 0.00035; // $0.35 per 1000 GP (adjust based on market)
const CRYPTO_NETWORKS = ['Bitcoin', 'Ethereum', 'BSC', 'Polygon', 'Solana'];

/**
 * Get wallet balance with dual currency support
 */
export async function getWalletBalance(userId: number): Promise<WalletBalance | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { wallet: true }
    });

    if (!user || !user.wallet) {
      return null;
    }

    // Parse stored balance (format: "crypto:1000.50|gp:50000000")
    const balanceData = user.wallet.balance;
    let cryptoBalance = 0;
    let osrsGpBalance = 0;

    if (balanceData.includes('|')) {
      const parts = balanceData.split('|');
      const cryptoPart = parts.find(p => p.startsWith('crypto:'));
      const gpPart = parts.find(p => p.startsWith('gp:'));
      
      cryptoBalance = cryptoPart ? parseFloat(cryptoPart.split(':')[1]) : 0;
      osrsGpBalance = gpPart ? parseFloat(gpPart.split(':')[1]) : 0;
    } else {
      // Legacy format - treat as crypto USD
      cryptoBalance = parseFloat(balanceData) || 0;
    }

    const totalBalanceUsd = cryptoBalance + (osrsGpBalance * OSRS_GP_TO_USD);

    return {
      userId,
      cryptoBalance,
      osrsGpBalance,
      totalBalanceUsd,
      displayCurrency: 'USD' // Default, can be user preference
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return null;
  }
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  userId: number,
  cryptoAmount: number,
  gpAmount: number
): Promise<boolean> {
  try {
    const balance = `crypto:${cryptoAmount.toFixed(2)}|gp:${Math.floor(gpAmount)}`;
    
    await db.update(wallets)
      .set({ balance })
      .where(eq(wallets.userId, userId));

    return true;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    return false;
  }
}

/**
 * Get deposit information
 */
export function getDepositInfo(): DepositInfo {
  return {
    crypto: {
      address: 'goatgang@trust',
      networks: CRYPTO_NETWORKS,
      qrCode: undefined // TODO: Generate QR code
    },
    osrs: {
      username: 'Goat7Gang',
      world: 'Any world',
      instructions: `
1. Log into Old School RuneScape
2. Find "Goat7Gang" in-game (any world)
3. Trade your GP
4. Send us your OSRS username via Discord/Email
5. We'll credit your account within 5 minutes
      `.trim()
    }
  };
}

/**
 * Process deposit (manual verification required)
 */
export async function processDeposit(
  userId: number,
  amount: number,
  currency: 'crypto' | 'gp',
  txHash?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const wallet = await getWalletBalance(userId);
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }

    const newCryptoBalance = currency === 'crypto' 
      ? wallet.cryptoBalance + amount 
      : wallet.cryptoBalance;
    
    const newGpBalance = currency === 'gp'
      ? wallet.osrsGpBalance + amount
      : wallet.osrsGpBalance;

    await updateWalletBalance(userId, newCryptoBalance, newGpBalance);

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type: 'deposit',
      amount: amount.toString(),
      status: 'completed',
      description: `Deposit: ${currency === 'crypto' ? '$' + amount : amount + ' GP'}${txHash ? ' - TX: ' + txHash : ''}`
    });

    return {
      success: true,
      message: `Deposited ${currency === 'crypto' ? '$' + amount : amount + ' GP'} successfully`
    };
  } catch (error) {
    console.error('Error processing deposit:', error);
    return { success: false, message: 'Failed to process deposit' };
  }
}

/**
 * Process withdrawal
 */
export async function processWithdrawal(
  userId: number,
  amount: number,
  currency: 'crypto' | 'gp',
  destination: string
): Promise<{ success: boolean; message: string }> {
  try {
    const wallet = await getWalletBalance(userId);
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }

    // Check balance
    const availableBalance = currency === 'crypto' 
      ? wallet.cryptoBalance 
      : wallet.osrsGpBalance;

    if (availableBalance < amount) {
      return { 
        success: false, 
        message: `Insufficient ${currency === 'crypto' ? 'crypto' : 'GP'} balance` 
      };
    }

    // Deduct from balance
    const newCryptoBalance = currency === 'crypto' 
      ? wallet.cryptoBalance - amount 
      : wallet.cryptoBalance;
    
    const newGpBalance = currency === 'gp'
      ? wallet.osrsGpBalance - amount
      : wallet.osrsGpBalance;

    await updateWalletBalance(userId, newCryptoBalance, newGpBalance);

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type: 'withdrawal',
      amount: (-amount).toString(),
      status: 'pending',
      description: `Withdrawal: ${currency === 'crypto' ? '$' + amount : amount + ' GP'} to ${destination}`
    });

    return {
      success: true,
      message: `Withdrawal of ${currency === 'crypto' ? '$' + amount : amount + ' GP'} initiated. Processing within 24h.`
    };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return { success: false, message: 'Failed to process withdrawal' };
  }
}

/**
 * Swap between crypto and OSRS GP
 */
export async function swapCurrency(
  userId: number,
  fromCurrency: 'crypto' | 'gp',
  amount: number
): Promise<{ success: boolean; message: string; newBalances?: any }> {
  try {
    const wallet = await getWalletBalance(userId);
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }

    // Check source balance
    const sourceBalance = fromCurrency === 'crypto' 
      ? wallet.cryptoBalance 
      : wallet.osrsGpBalance;

    if (sourceBalance < amount) {
      return { 
        success: false, 
        message: `Insufficient ${fromCurrency === 'crypto' ? 'crypto' : 'GP'} balance` 
      };
    }

    // Calculate swap with 2% fee
    const swapFee = 0.02;
    let newCryptoBalance = wallet.cryptoBalance;
    let newGpBalance = wallet.osrsGpBalance;
    let receivedAmount = 0;

    if (fromCurrency === 'crypto') {
      // Crypto → GP
      const amountAfterFee = amount * (1 - swapFee);
      receivedAmount = Math.floor(amountAfterFee / OSRS_GP_TO_USD);
      newCryptoBalance -= amount;
      newGpBalance += receivedAmount;
    } else {
      // GP → Crypto
      const usdValue = amount * OSRS_GP_TO_USD;
      receivedAmount = usdValue * (1 - swapFee);
      newGpBalance -= amount;
      newCryptoBalance += receivedAmount;
    }

    await updateWalletBalance(userId, newCryptoBalance, newGpBalance);

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type: 'swap',
      amount: '0',
      status: 'completed',
      description: `Swapped ${fromCurrency === 'crypto' ? '$' + amount + ' → ' + receivedAmount + ' GP' : amount + ' GP → $' + receivedAmount.toFixed(2)}`
    });

    return {
      success: true,
      message: `Swapped successfully! Received ${fromCurrency === 'crypto' ? receivedAmount + ' GP' : '$' + receivedAmount.toFixed(2)}`,
      newBalances: {
        crypto: newCryptoBalance,
        gp: newGpBalance
      }
    };
  } catch (error) {
    console.error('Error swapping currency:', error);
    return { success: false, message: 'Failed to swap currency' };
  }
}

/**
 * Deduct bet from wallet (supports both currencies)
 */
export async function deductBet(
  userId: number,
  amount: number,
  currency: 'crypto' | 'gp'
): Promise<{ success: boolean; newBalance: any }> {
  try {
    const wallet = await getWalletBalance(userId);
    if (!wallet) {
      return { success: false, newBalance: null };
    }

    const availableBalance = currency === 'crypto' 
      ? wallet.cryptoBalance 
      : wallet.osrsGpBalance;

    if (availableBalance < amount) {
      return { success: false, newBalance: wallet };
    }

    const newCryptoBalance = currency === 'crypto' 
      ? wallet.cryptoBalance - amount 
      : wallet.cryptoBalance;
    
    const newGpBalance = currency === 'gp'
      ? wallet.osrsGpBalance - amount
      : wallet.osrsGpBalance;

    await updateWalletBalance(userId, newCryptoBalance, newGpBalance);

    return {
      success: true,
      newBalance: {
        cryptoBalance: newCryptoBalance,
        osrsGpBalance: newGpBalance,
        totalBalanceUsd: newCryptoBalance + (newGpBalance * OSRS_GP_TO_USD)
      }
    };
  } catch (error) {
    console.error('Error deducting bet:', error);
    return { success: false, newBalance: null };
  }
}

/**
 * Add winnings to wallet
 */
export async function addWinnings(
  userId: number,
  amount: number,
  currency: 'crypto' | 'gp'
): Promise<boolean> {
  try {
    const wallet = await getWalletBalance(userId);
    if (!wallet) {
      return false;
    }

    const newCryptoBalance = currency === 'crypto' 
      ? wallet.cryptoBalance + amount 
      : wallet.cryptoBalance;
    
    const newGpBalance = currency === 'gp'
      ? wallet.osrsGpBalance + amount
      : wallet.osrsGpBalance;

    await updateWalletBalance(userId, newCryptoBalance, newGpBalance);
    return true;
  } catch (error) {
    console.error('Error adding winnings:', error);
    return false;
  }
}

export default {
  getWalletBalance,
  updateWalletBalance,
  getDepositInfo,
  processDeposit,
  processWithdrawal,
  swapCurrency,
  deductBet,
  addWinnings,
  OSRS_GP_TO_USD,
  CRYPTO_NETWORKS
};
