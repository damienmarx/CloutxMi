import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { VIP_TIERS } from "./wagerSystem";

export interface VipProgressInfo {
  currentTier: string;
  currentTierInfo: {
    tier: string;
    minWagered: number;
    maxWagered?: number;
    cashbackPercentage?: number;
    bonusMultiplier?: number;
    benefits?: string[];
  };
  nextTier: string | null;
  nextTierInfo: {
    tier: string;
    minWagered: number;
    maxWagered?: number;
    cashbackPercentage?: number;
    bonusMultiplier?: number;
    benefits?: string[];
  } | null;
  totalWagered: number;
  progressToNextTier: number; // 0-100 percentage
  amountNeededForNextTier: number;
  estimatedGamesForNextTier: number; // Based on average bet of $10
}

/**
 * Get comprehensive VIP progress information for a user
 */
export async function getUserVipProgress(userId: number): Promise<VipProgressInfo> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get user stats
    const result = await db.execute(sql` SELECT totalWagered FROM userStats WHERE userId = ${userId} `);
    const rows = result[0] as unknown as any[];
    const totalWagered = rows && rows.length > 0 ? parseFloat(rows[0].totalWagered) : 0;

    // Determine current tier based on VIP_TIERS array
    let currentTierIndex = 0;
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (totalWagered >= VIP_TIERS[i].requirement) {
        currentTierIndex = i;
        break;
      }
    }
    const currentTier = VIP_TIERS[currentTierIndex];

    // Determine next tier
    let nextTier = null;
    let nextTierIndex = currentTierIndex + 1;
    if (nextTierIndex < VIP_TIERS.length) {
      nextTier = VIP_TIERS[nextTierIndex];
    }

    // Calculate progress
    let progressToNextTier = 100;
    let amountNeededForNextTier = 0;
    let estimatedGamesForNextTier = 0;

    if (nextTier) {
      const currentTierMin = currentTier.requirement;
      const nextTierMin = nextTier.requirement;
      const tierRange = nextTierMin - currentTierMin;
      const currentProgress = totalWagered - currentTierMin;

      progressToNextTier = Math.min((currentProgress / tierRange) * 100, 100);
      amountNeededForNextTier = Math.max(nextTierMin - totalWagered, 0);
      estimatedGamesForNextTier = Math.ceil(amountNeededForNextTier / 10); // Assuming $10 average bet
    }

    return {
      currentTier: currentTier.name,
      currentTierInfo: {
        tier: currentTier.name,
        minWagered: currentTier.requirement,
        cashbackPercentage: currentTier.cashback,
      },
      nextTier: nextTier ? nextTier.name : null,
      nextTierInfo: nextTier ? {
        tier: nextTier.name,
        minWagered: nextTier.requirement,
        cashbackPercentage: nextTier.cashback,
      } : null,
      totalWagered,
      progressToNextTier,
      amountNeededForNextTier,
      estimatedGamesForNextTier,
    };
  } catch (error) {
    console.error("[VIP Progress] Error getting user VIP progress:", error);
    throw error;
  }
}

/**
 * Update user VIP tier based on total wagered
 */
export async function updateUserVipTier(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get user stats
    const result = await db.execute(sql` SELECT totalWagered FROM userStats WHERE userId = ${userId} `);
    const rows = result[0] as unknown as any[];
    const totalWagered = rows && rows.length > 0 ? parseFloat(rows[0].totalWagered) : 0;

    // Determine new tier
    let newTierIndex = 0;
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (totalWagered >= VIP_TIERS[i].requirement) {
        newTierIndex = i;
        break;
      }
    }
    const newTier = VIP_TIERS[newTierIndex].name;
    const tierInfo = VIP_TIERS[newTierIndex];

    // Update or insert VIP tier record
    const existingResult = await db.execute(sql` SELECT * FROM vipTiers WHERE userId = ${userId} `);
    const existingRows = existingResult[0] as unknown as any[];

    if (existingRows && existingRows.length > 0) {
      // Update existing
      await db.execute(sql` UPDATE vipTiers SET tier = ${newTier}, totalWagered = ${totalWagered.toString()}, cashbackPercentage = ${tierInfo.cashback.toString()}, bonusMultiplier = ${tierInfo.cashback.toString()}, updatedAt = NOW() WHERE userId = ${userId} `);
    } else {
      // Insert new
      await db.execute(sql` INSERT INTO vipTiers (userId, tier, totalWagered, cashbackPercentage, bonusMultiplier) VALUES (${userId}, ${newTier}, ${totalWagered.toString()}, ${tierInfo.cashback.toString()}, ${tierInfo.cashback.toString()}) `);
    }

    return newTier;
  } catch (error) {
    console.error("[VIP Progress] Error updating user VIP tier:", error);
    throw error;
  }
}

/**
 * Get cashback amount for a user based on their tier and winnings
 */
export async function calculateUserCashback(userId: number, winAmount: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql` SELECT cashbackPercentage FROM vipTiers WHERE userId = ${userId} `);
    const rows = result[0] as unknown as any[];

    const cashbackPercentage = rows && rows.length > 0 
      ? parseFloat(rows[0].cashbackPercentage) 
      : 1; // Default to bronze tier (1%)

    return (winAmount * cashbackPercentage) / 100;
  } catch (error) {
    console.error("[VIP Progress] Error calculating cashback:", error);
    return 0;
  }
}

/**
 * Get bonus multiplier for a user based on their tier
 */
export async function getUserBonusMultiplier(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await db.execute(sql` SELECT bonusMultiplier FROM vipTiers WHERE userId = ${userId} `);
    const rows = result[0] as unknown as any[];

    return rows && rows.length > 0 
      ? parseFloat(rows[0].bonusMultiplier) 
      : 1.0; // Default to bronze tier (1.0x)
  } catch (error) {
    console.error("[VIP Progress] Error getting bonus multiplier:", error);
    return 1.0;
  }
}

/**
 * Get all VIP tier information
 */
export function getAllVipTiers() {
  return VIP_TIERS.map((tier) => ({
    name: tier.name,
    requirement: tier.requirement,
    cashback: tier.cashback,
  }));
}

/**
 * Get tier by name
 */
export function getVipTierByName(tierName: string) {
  return VIP_TIERS.find(tier => tier.name.toLowerCase() === tierName.toLowerCase()) || null;
}

/**
 * Check if user tier has been upgraded
 */
export async function checkAndProcessTierUpgrade(userId: number): Promise<{
  upgraded: boolean;
  previousTier: string | null;
  newTier: string;
  tierUpgradeBonus?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Get current tier
    const currentResult = await db.execute(sql` SELECT tier FROM vipTiers WHERE userId = ${userId} `);
    const currentRows = currentResult[0] as unknown as any[];

    const previousTier = currentRows && currentRows.length > 0 
      ? currentRows[0].tier 
      : "Bronze";

    // Update tier
    const newTier = await updateUserVipTier(userId);

    // Check if upgraded
    const tierHierarchy = VIP_TIERS.map(t => t.name);
    const upgraded = tierHierarchy.indexOf(newTier) > tierHierarchy.indexOf(previousTier);

    // Calculate tier upgrade bonus (5% of total wagered)
    let tierUpgradeBonus = undefined;
    if (upgraded) {
      const statsResult = await db.execute(sql` SELECT totalWagered FROM userStats WHERE userId = ${userId} `);
      const statsRows = statsResult[0] as unknown as any[];
      const totalWagered = statsRows && statsRows.length > 0 ? parseFloat(statsRows[0].totalWagered) : 0;
      tierUpgradeBonus = totalWagered * 0.05; // 5% bonus
    }

    return {
      upgraded,
      previousTier,
      newTier,
      tierUpgradeBonus,
    };
  } catch (error) {
    console.error("[VIP Progress] Error checking tier upgrade:", error);
    throw error;
  }
}
