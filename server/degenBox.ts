/**
 * CloutScape DEGEN BOX System
 * Fund locking and self-exclusion for responsible gambling
 */

import { db } from './db';
import { users, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface DegenBoxConfig {
  userId: number;
  lockedAmount: number;
  lockDuration: number; // hours
  lockReason: 'self_exclusion' | 'cool_down' | 'manual';
  unlockAt: Date;
  canWithdraw: boolean;
  canPlay: boolean;
}

export interface DegenBoxStatus {
  isActive: boolean;
  lockedAmount: number;
  unlockAt: Date | null;
  reason: string;
  hoursRemaining: number;
}

/**
 * Lock funds in DEGEN BOX
 */
export async function lockFunds(
  userId: number,
  amount: number,
  durationHours: number,
  reason: 'self_exclusion' | 'cool_down' | 'manual' = 'manual'
): Promise<{ success: boolean; message: string; unlockAt: Date }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { wallet: true }
    });

    if (!user || !user.wallet) {
      return { success: false, message: 'User not found', unlockAt: new Date() };
    }

    const balance = parseFloat(user.wallet.balance);
    if (balance < amount) {
      return {
        success: false,
        message: 'Insufficient balance',
        unlockAt: new Date()
      };
    }

    const unlockAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // Create DEGEN BOX record in database
    // TODO: Add degenBox table to schema
    // For now, use self_exclusion_until field
    await db.update(users)
      .set({
        selfExclusionUntil: unlockAt
      })
      .where(eq(users.id, userId));

    // Create transaction record
    await db.insert(transactions).values({
      userId,
      type: 'withdrawal',
      amount: amount.toString(),
      status: 'completed',
      description: `DEGEN BOX: Locked $${amount} until ${unlockAt.toISOString()}`
    });

    return {
      success: true,
      message: `Successfully locked $${amount} in DEGEN BOX until ${unlockAt.toLocaleString()}`,
      unlockAt
    };
  } catch (error) {
    console.error('Failed to lock funds:', error);
    return {
      success: false,
      message: 'Failed to lock funds',
      unlockAt: new Date()
    };
  }
}

/**
 * Unlock funds from DEGEN BOX
 */
export async function unlockFunds(
  userId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.selfExclusionUntil) {
      return { success: false, message: 'No active DEGEN BOX lock' };
    }

    const now = new Date();
    if (now < user.selfExclusionUntil) {
      const hoursRemaining = Math.ceil((user.selfExclusionUntil.getTime() - now.getTime()) / (60 * 60 * 1000));
      return {
        success: false,
        message: `DEGEN BOX unlocks in ${hoursRemaining} hours`
      };
    }

    // Unlock
    await db.update(users)
      .set({
        selfExclusionUntil: null
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'DEGEN BOX unlocked successfully'
    };
  } catch (error) {
    console.error('Failed to unlock funds:', error);
    return {
      success: false,
      message: 'Failed to unlock funds'
    };
  }
}

/**
 * Get DEGEN BOX status
 */
export async function getDegenBoxStatus(
  userId: number
): Promise<DegenBoxStatus> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.selfExclusionUntil) {
      return {
        isActive: false,
        lockedAmount: 0,
        unlockAt: null,
        reason: '',
        hoursRemaining: 0
      };
    }

    const now = new Date();
    const isActive = now < user.selfExclusionUntil;
    const hoursRemaining = isActive
      ? Math.ceil((user.selfExclusionUntil.getTime() - now.getTime()) / (60 * 60 * 1000))
      : 0;

    return {
      isActive,
      lockedAmount: 0, // TODO: Store locked amount separately
      unlockAt: user.selfExclusionUntil,
      reason: 'Self-exclusion',
      hoursRemaining
    };
  } catch (error) {
    console.error('Failed to get DEGEN BOX status:', error);
    return {
      isActive: false,
      lockedAmount: 0,
      unlockAt: null,
      reason: '',
      hoursRemaining: 0
    };
  }
}

/**
 * Check if user can play (not locked in DEGEN BOX)
 */
export async function canUserPlay(userId: number): Promise<boolean> {
  const status = await getDegenBoxStatus(userId);
  return !status.isActive;
}

/**
 * Emergency unlock (admin only)
 */
export async function adminUnlockDegenBox(
  userId: number,
  adminId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Verify adminId has admin role
    
    await db.update(users)
      .set({
        selfExclusionUntil: null
      })
      .where(eq(users.id, userId));

    // Log admin action
    await db.insert(transactions).values({
      userId,
      type: 'withdrawal',
      amount: '0',
      status: 'completed',
      description: `DEGEN BOX emergency unlock by admin ${adminId}`
    });

    return {
      success: true,
      message: 'DEGEN BOX unlocked by admin'
    };
  } catch (error) {
    console.error('Admin unlock failed:', error);
    return {
      success: false,
      message: 'Admin unlock failed'
    };
  }
}

export default {
  lockFunds,
  unlockFunds,
  getDegenBoxStatus,
  canUserPlay,
  adminUnlockDegenBox
};
