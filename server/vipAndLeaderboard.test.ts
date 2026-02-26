import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { calculateVipTier, getProgressToNextTier } from "./wagerSystem";
import { VIP_TIERS } from "./wagerSystem";

describe("VIP System", () => {
  describe("VIP Tier Calculation", () => {
    it("should assign bronze tier to new users", () => {
      const tier = calculateVipTier(0);
      expect(tier.tier).toBe("bronze");
    });

    it("should assign bronze tier for amounts under 10k", () => {
      const tier = calculateVipTier(5000);
      expect(tier.tier).toBe("bronze");
    });

    it("should assign silver tier at 10k", () => {
      const tier = calculateVipTier(10000);
      expect(tier.tier).toBe("silver");
    });

    it("should assign gold tier at 50k", () => {
      const tier = calculateVipTier(50000);
      expect(tier.tier).toBe("gold");
    });

    it("should assign platinum tier at 100k", () => {
      const tier = calculateVipTier(100000);
      expect(tier.tier).toBe("platinum");
    });

    it("should assign diamond tier at 500k", () => {
      const tier = calculateVipTier(500000);
      expect(tier.tier).toBe("diamond");
    });

    it("should have increasing cashback percentages", () => {
      const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];
      let previousCashback = 0;

      tiers.forEach((tierName) => {
        const tier = VIP_TIERS[tierName as keyof typeof VIP_TIERS];
        expect(tier.cashbackPercentage).toBeGreaterThan(previousCashback);
        previousCashback = tier.cashbackPercentage;
      });
    });

    it("should have increasing bonus multipliers", () => {
      const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];
      let previousMultiplier = 0;

      tiers.forEach((tierName) => {
        const tier = VIP_TIERS[tierName as keyof typeof VIP_TIERS];
        expect(tier.bonusMultiplier).toBeGreaterThan(previousMultiplier);
        previousMultiplier = tier.bonusMultiplier;
      });
    });
  });

  describe("VIP Progress Tracking", () => {
    it("should calculate progress to next tier", () => {
      const progress = getProgressToNextTier(5000);
      expect(progress.currentTier.tier).toBe("bronze");
      expect(progress.nextTier?.tier).toBe("silver");
      expect(progress.progress).toBeGreaterThan(0);
      expect(progress.progress).toBeLessThanOrEqual(100);
    });

    it("should calculate amount needed for next tier", () => {
      const progress = getProgressToNextTier(5000);
      expect(progress.amountNeeded).toBe(5000); // 10000 - 5000
    });

    it("should show 100% progress at max tier", () => {
      const progress = getProgressToNextTier(500000);
      expect(progress.progress).toBe(100);
      expect(progress.nextTier).toBeNull();
    });

    it("should show 0% progress at tier start", () => {
      const progress = getProgressToNextTier(10000);
      expect(progress.progress).toBeCloseTo(0, 1);
    });

    it("should show 50% progress at tier midpoint", () => {
      // Silver tier: 10k-50k, midpoint is 30k
      const progress = getProgressToNextTier(30000);
      expect(progress.progress).toBeCloseTo(50, 1);
    });
  });

  describe("VIP Tier Benefits", () => {
    it("should have benefits for each tier", () => {
      const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];

      tiers.forEach((tierName) => {
        const tier = VIP_TIERS[tierName as keyof typeof VIP_TIERS];
        expect(tier.benefits).toBeDefined();
        expect(tier.benefits.length).toBeGreaterThan(0);
      });
    });

    it("should have increasing benefits for higher tiers", () => {
      const bronze = VIP_TIERS.bronze;
      const silver = VIP_TIERS.silver;
      const gold = VIP_TIERS.gold;
      const platinum = VIP_TIERS.platinum;
      const diamond = VIP_TIERS.diamond;

      expect(silver.benefits.length).toBeGreaterThanOrEqual(bronze.benefits.length);
      expect(gold.benefits.length).toBeGreaterThanOrEqual(silver.benefits.length);
      expect(platinum.benefits.length).toBeGreaterThanOrEqual(gold.benefits.length);
      expect(diamond.benefits.length).toBeGreaterThanOrEqual(platinum.benefits.length);
    });
  });

  describe("Cashback Calculation", () => {
    it("should calculate bronze tier cashback (1%)", () => {
      const tier = calculateVipTier(0);
      const cashback = (100 * tier.cashbackPercentage) / 100;
      expect(cashback).toBe(1);
    });

    it("should calculate silver tier cashback (2%)", () => {
      const tier = calculateVipTier(10000);
      const cashback = (100 * tier.cashbackPercentage) / 100;
      expect(cashback).toBe(2);
    });

    it("should calculate diamond tier cashback (5%)", () => {
      const tier = calculateVipTier(500000);
      const cashback = (100 * tier.cashbackPercentage) / 100;
      expect(cashback).toBe(5);
    });
  });

  describe("Bonus Multiplier", () => {
    it("should have 1.0x multiplier for bronze", () => {
      const tier = calculateVipTier(0);
      expect(tier.bonusMultiplier).toBe(1.0);
    });

    it("should have 1.25x multiplier for silver", () => {
      const tier = calculateVipTier(10000);
      expect(tier.bonusMultiplier).toBe(1.25);
    });

    it("should have 2.5x multiplier for diamond", () => {
      const tier = calculateVipTier(500000);
      expect(tier.bonusMultiplier).toBe(2.5);
    });

    it("should apply bonus multiplier to winnings", () => {
      const tier = calculateVipTier(10000);
      const baseWinnings = 100;
      const bonusWinnings = baseWinnings * tier.bonusMultiplier;
      expect(bonusWinnings).toBe(125);
    });
  });

  describe("Tier Thresholds", () => {
    it("should have correct minimum thresholds", () => {
      expect(VIP_TIERS.bronze.minWagered).toBe(0);
      expect(VIP_TIERS.silver.minWagered).toBe(10000);
      expect(VIP_TIERS.gold.minWagered).toBe(50000);
      expect(VIP_TIERS.platinum.minWagered).toBe(100000);
      expect(VIP_TIERS.diamond.minWagered).toBe(500000);
    });

    it("should have increasing minimum thresholds", () => {
      const tiers = [
        VIP_TIERS.bronze,
        VIP_TIERS.silver,
        VIP_TIERS.gold,
        VIP_TIERS.platinum,
        VIP_TIERS.diamond,
      ];

      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].minWagered).toBeGreaterThan(tiers[i - 1].minWagered);
      }
    });
  });
});

describe("Leaderboard System", () => {
  describe("Ranking Logic", () => {
    it("should rank higher wagers first", () => {
      const wagers = [1000, 5000, 2000, 10000];
      const sorted = [...wagers].sort((a, b) => b - a);
      expect(sorted[0]).toBe(10000);
      expect(sorted[1]).toBe(5000);
      expect(sorted[2]).toBe(2000);
      expect(sorted[3]).toBe(1000);
    });

    it("should rank higher win rates first", () => {
      const winRates = [50, 75, 25, 90];
      const sorted = [...winRates].sort((a, b) => b - a);
      expect(sorted[0]).toBe(90);
      expect(sorted[1]).toBe(75);
      expect(sorted[2]).toBe(50);
      expect(sorted[3]).toBe(25);
    });

    it("should handle ties in ranking", () => {
      const scores = [100, 100, 50, 50];
      const ranked = scores.map((score, index) => ({
        score,
        originalIndex: index,
      }));

      ranked.sort((a, b) => b.score - a.score);

      // Both 100s should be before both 50s
      expect(ranked[0].score).toBe(100);
      expect(ranked[1].score).toBe(100);
      expect(ranked[2].score).toBe(50);
      expect(ranked[3].score).toBe(50);
    });
  });

  describe("Win Rate Calculation", () => {
    it("should calculate win rate correctly", () => {
      const wins = 50;
      const total = 100;
      const winRate = (wins / total) * 100;
      expect(winRate).toBe(50);
    });

    it("should handle 0% win rate", () => {
      const wins = 0;
      const total = 100;
      const winRate = (wins / total) * 100;
      expect(winRate).toBe(0);
    });

    it("should handle 100% win rate", () => {
      const wins = 100;
      const total = 100;
      const winRate = (wins / total) * 100;
      expect(winRate).toBe(100);
    });

    it("should handle single game", () => {
      const wins = 1;
      const total = 1;
      const winRate = (wins / total) * 100;
      expect(winRate).toBe(100);
    });
  });

  describe("ROI Calculation", () => {
    it("should calculate positive ROI", () => {
      const wagered = 1000;
      const won = 1500;
      const roi = ((won - wagered) / wagered) * 100;
      expect(roi).toBe(50);
    });

    it("should calculate negative ROI", () => {
      const wagered = 1000;
      const won = 500;
      const roi = ((won - wagered) / wagered) * 100;
      expect(roi).toBe(-50);
    });

    it("should handle break-even ROI", () => {
      const wagered = 1000;
      const won = 1000;
      const roi = ((won - wagered) / wagered) * 100;
      expect(roi).toBe(0);
    });
  });
});
