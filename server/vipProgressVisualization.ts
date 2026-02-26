import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { calculateVipTier, getProgressToNextTier, VIP_TIERS } from "./wagerSystem";

/**
 * VIP Progress Visualization System
 * Provides visual representations of VIP tier progress
 */

export interface VipProgressBar {
  currentTier: string;
  nextTier: string | null;
  currentAmount: number;
  tierMinimum: number;
  tierMaximum: number;
  progressPercentage: number;
  amountNeeded: number;
  amountToNextTier: number;
  visualBar: string; // ASCII progress bar
}

export interface VipTierDisplay {
  tier: string;
  displayName: string;
  icon: string;
  minWagered: number;
  maxWagered?: number;
  cashbackPercentage?: number;
  bonusMultiplier?: number;
  benefits?: string[];
  isCurrentTier: boolean;
  isReached: boolean;
  progressPercentage: number;
}

export interface VipProgressSummary {
  currentTier: VipTierDisplay;
  nextTier: VipTierDisplay | null;
  allTiers: VipTierDisplay[];
  progressBar: VipProgressBar;
  estimatedTimeToNextTier: string; // e.g., "5 days at current pace"
}

/**
 * Get user's total wagered amount
 */
export async function getUserTotalWagered(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(betAmount), 0) as totalWagered
      FROM gameResults
      WHERE userId = ${userId}
    `);
    const rows = result[0] as unknown as any[];

    if (!rows || rows.length === 0) {
      return 0;
    }

    return parseFloat(rows[0].totalWagered || 0);
  } catch (error) {
    console.error("[VIP Progress] Error getting total wagered:", error);
    return 0;
  }
}

/**
 * Generate ASCII progress bar
 */
export function generateProgressBar(percentage: number, width: number = 20): string {
  const filledWidth = Math.round((percentage / 100) * width);
  const emptyWidth = width - filledWidth;
  const filled = "█".repeat(filledWidth);
  const empty = "░".repeat(emptyWidth);
  return `[${filled}${empty}] ${percentage.toFixed(1)}%`;
}

/**
 * Get VIP progress bar for user
 */
export async function getVipProgressBar(userId: number): Promise<VipProgressBar> {
  const totalWagered = await getUserTotalWagered(userId);
  const currentTier = calculateVipTier(totalWagered);
  const progress = getProgressToNextTier(totalWagered);

  const nextTierName = progress.nextTier ? progress.nextTier : null;
  const tierMaximum = progress.nextTier 
    ? VIP_TIERS.find(t => t.name === progress.nextTier)?.requirement || currentTier.requirement 
    : currentTier.requirement;

  return {
    currentTier: currentTier.name,
    nextTier: nextTierName,
    currentAmount: totalWagered,
    tierMinimum: currentTier.requirement,
    tierMaximum,
    progressPercentage: progress.progress,
    amountNeeded: progress.progress >= 100 ? 0 : (tierMaximum - totalWagered),
    amountToNextTier: progress.progress >= 100 ? 0 : (tierMaximum - totalWagered),
    visualBar: generateProgressBar(progress.progress),
  };
}

/**
 * Get tier display information
 */
export function getTierDisplay(tierName: string, currentTierName: string, totalWagered: number): VipTierDisplay {
  const tierInfo = VIP_TIERS.find(t => t.name === tierName);
  if (!tierInfo) {
    return {
      tier: tierName,
      displayName: "Unknown",
      icon: "❓",
      minWagered: 0,
      isCurrentTier: false,
      isReached: false,
      progressPercentage: 0,
    };
  }

  const tierIcons: Record<string, string> = {
    "Bronze": "🥉",
    "Silver": "🥈",
    "Gold": "🥇",
    "Platinum": "💎",
    "Diamond": "✨",
  };

  const tierDisplayNames: Record<string, string> = {
    "Bronze": "Bronze Member",
    "Silver": "Silver Member",
    "Gold": "Gold Member",
    "Platinum": "Platinum Member",
    "Diamond": "Diamond Member",
  };

  const isCurrentTier = tierName === currentTierName;
  const isReached = totalWagered >= tierInfo.requirement;
  const progressPercentage = isReached
    ? 100
    : (totalWagered / tierInfo.requirement) * 100;

  return {
    tier: tierName,
    displayName: tierDisplayNames[tierName] || tierName,
    icon: tierIcons[tierName] || "🎯",
    minWagered: tierInfo.requirement,
    cashbackPercentage: tierInfo.cashback,
    bonusMultiplier: tierInfo.cashback,
    isCurrentTier,
    isReached,
    progressPercentage,
  };
}

/**
 * Get complete VIP progress summary
 */
export async function getVipProgressSummary(userId: number): Promise<VipProgressSummary> {
  const totalWagered = await getUserTotalWagered(userId);
  const currentTier = calculateVipTier(totalWagered);
  const progress = getProgressToNextTier(totalWagered);
  const progressBar = await getVipProgressBar(userId);

  // Get all tier displays
  const allTiers = VIP_TIERS.map((tier) =>
    getTierDisplay(tier.name, currentTier.name, totalWagered)
  );

  // Get next tier display
  const nextTierDisplay = progress.nextTier
    ? getTierDisplay(progress.nextTier, currentTier.name, totalWagered)
    : null;

  // Estimate time to next tier
  let estimatedTimeToNextTier = "N/A";
  if (progress.nextTier && progress.progress < 100) {
    // Get average daily wager from last 7 days
    const db = await getDb();
    if (db) {
      try {
        const result = await db.execute(sql`
          SELECT COALESCE(SUM(betAmount), 0) as totalWagered
          FROM gameResults
          WHERE userId = ${userId} AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);
        const rows = result[0] as unknown as any[];

        if (rows && rows.length > 0) {
          const weeklyWagered = parseFloat(rows[0].totalWagered || 0);
          const dailyAverage = weeklyWagered / 7;

          if (dailyAverage > 0) {
            const amountNeeded = progressBar.amountNeeded;
            const daysNeeded = Math.ceil(amountNeeded / dailyAverage);
            estimatedTimeToNextTier = `${daysNeeded} days at current pace`;
          }
        }
      } catch (error) {
        console.error("[VIP Progress] Error calculating estimated time:", error);
      }
    }
  }

  return {
    currentTier: getTierDisplay(currentTier.name, currentTier.name, totalWagered),
    nextTier: nextTierDisplay,
    allTiers,
    progressBar,
    estimatedTimeToNextTier,
  };
}

/**
 * Get VIP tier comparison
 */
export function getVipTierComparison(): Record<string, VipTierDisplay> {
  const comparison: Record<string, VipTierDisplay> = {};

  VIP_TIERS.forEach((tier) => {
    comparison[tier.name] = getTierDisplay(tier.name, "", 0);
  });

  return comparison;
}

/**
 * Format VIP progress for display
 */
export function formatVipProgress(summary: VipProgressSummary): string {
  const lines: string[] = [];

  lines.push(`\n${"=".repeat(50)}`);
  lines.push(`VIP PROGRESS - ${summary.currentTier.displayName.toUpperCase()}`);
  lines.push(`${"=".repeat(50)}\n`);

  lines.push(`Current Tier: ${summary.currentTier.icon} ${summary.currentTier.displayName}`);
  lines.push(`Total Wagered: $${summary.progressBar.currentAmount.toLocaleString()}`);
  lines.push(`\nProgress to Next Tier:`);
  lines.push(summary.progressBar.visualBar);
  lines.push(`Amount Needed: $${summary.progressBar.amountNeeded.toLocaleString()}`);
  lines.push(`Estimated Time: ${summary.estimatedTimeToNextTier}`);

  if (summary.nextTier) {
    lines.push(`\nNext Tier: ${summary.nextTier.icon} ${summary.nextTier.displayName}`);
  }

  lines.push(`\n${"=".repeat(50)}\n`);

  return lines.join("\n");
}

/**
 * Get VIP tier milestones
 */
export function getVipMilestones(): Array<{ tier: string; amount: number; icon: string; displayName: string }> {
  return VIP_TIERS.map((tier) => ({
    tier: tier.name,
    amount: tier.requirement,
    icon: tier.name === "Bronze" ? "🥉" : tier.name === "Silver" ? "🥈" : tier.name === "Gold" ? "🥇" : tier.name === "Platinum" ? "💎" : "✨",
    displayName: tier.name,
  }));
}
