import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { playKeno, KENO_PAYOUT_TABLE, playSlots } from "./gameLogic";

describe("Game Logic", () => {
  describe("Keno Game", () => {
    it("should validate selected numbers range", () => {
      expect(() => playKeno([], 10)).toThrow("Must select between 1 and 10 numbers");
      expect(() => playKeno(Array.from({ length: 11 }, (_, i) => i + 1), 10)).toThrow(
        "Must select between 1 and 10 numbers"
      );
    });

    it("should validate bet amount", () => {
      expect(() => playKeno([1, 2, 3], 0)).toThrow("Bet amount must be greater than zero");
      expect(() => playKeno([1, 2, 3], -10)).toThrow("Bet amount must be greater than zero");
    });

    it("should draw 20 numbers", () => {
      const result = playKeno([1, 2, 3], 10);
      expect(result.drawnNumbers).toHaveLength(20);
    });

    it("should have unique drawn numbers", () => {
      const result = playKeno([1, 2, 3], 10);
      const uniqueNumbers = new Set(result.drawnNumbers);
      expect(uniqueNumbers.size).toBe(20);
    });

    it("should find correct matches", () => {
      const selectedNumbers = [1, 2, 3, 4, 5];
      const result = playKeno(selectedNumbers, 10);
      
      // Count how many selected numbers are in drawn numbers
      const expectedMatches = selectedNumbers.filter((num) =>
        result.drawnNumbers.includes(num)
      ).length;
      
      expect(result.matchedCount).toBe(expectedMatches);
    });

    it("should apply correct multiplier from payout table", () => {
      const result = playKeno([1, 2], 10);
      const payoutEntry = KENO_PAYOUT_TABLE.find((entry) => entry.matches === result.matchedCount);
      
      if (payoutEntry) {
        expect(result.multiplier).toBe(payoutEntry.multiplier);
      }
    });

    it("should calculate correct win amount", () => {
      const betAmount = 100;
      const result = playKeno([1, 2, 3], betAmount);
      expect(result.winAmount).toBe(betAmount * result.multiplier);
    });

    it("should return sorted selected numbers", () => {
      const selectedNumbers = [5, 2, 8, 1, 3];
      const result = playKeno(selectedNumbers, 10);
      expect(result.selectedNumbers).toEqual([1, 2, 3, 5, 8]);
    });

    it("should return sorted drawn numbers", () => {
      const result = playKeno([1, 2, 3], 10);
      const sorted = [...result.drawnNumbers].sort((a, b) => a - b);
      expect(result.drawnNumbers).toEqual(sorted);
    });

    it("should return sorted matched numbers", () => {
      const result = playKeno([1, 2, 3, 4, 5], 10);
      const sorted = [...result.matchedNumbers].sort((a, b) => a - b);
      expect(result.matchedNumbers).toEqual(sorted);
    });

    it("should have payout table with increasing multipliers", () => {
      for (let i = 1; i < KENO_PAYOUT_TABLE.length; i++) {
        const current = KENO_PAYOUT_TABLE[i];
        const previous = KENO_PAYOUT_TABLE[i - 1];
        expect(current.multiplier).toBeGreaterThanOrEqual(previous.multiplier);
      }
    });

    it("should handle single number selection", () => {
      const result = playKeno([50], 10);
      expect(result.selectedNumbers).toHaveLength(1);
      expect(result.matchedCount).toBeLessThanOrEqual(1);
    });

    it("should handle maximum number selection", () => {
      const selected = Array.from({ length: 10 }, (_, i) => i + 1);
      const result = playKeno(selected, 10);
      expect(result.selectedNumbers).toHaveLength(10);
    });
  });

  describe("Slots Game", () => {
    it("should validate bet amount", () => {
      expect(() => playSlots(0, 1)).toThrow("Bet amount must be greater than zero");
      expect(() => playSlots(-10, 1)).toThrow("Bet amount must be greater than zero");
    });

    it("should validate paylines", () => {
      expect(() => playSlots(10, 0)).toThrow("Number of paylines must be between 1 and 5");
      expect(() => playSlots(10, 6)).toThrow("Number of paylines must be between 1 and 5");
    });

    it("should generate 3 reels", () => {
      const result = playSlots(10, 1);
      expect(result.reels).toHaveLength(3);
      result.reels.forEach((reel) => {
        expect(reel).toHaveLength(3);
      });
    });

    it("should have valid symbols", () => {
      const validSymbols = ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven", "gold"];
      const result = playSlots(10, 1);
      
      result.reels.forEach((reel) => {
        reel.forEach((symbol) => {
          expect(validSymbols).toContain(symbol);
        });
      });
    });

    it("should calculate correct win amount", () => {
      const betAmount = 100;
      const result = playSlots(betAmount, 1);
      expect(result.winAmount).toBe(betAmount * result.totalMultiplier);
    });

    it("should support 1 payline", () => {
      const result = playSlots(10, 1);
      expect(result.matchedPaylines.length).toBeLessThanOrEqual(1);
    });

    it("should support 5 paylines", () => {
      const result = playSlots(10, 5);
      expect(result.matchedPaylines.length).toBeLessThanOrEqual(5);
    });

    it("should have non-negative multiplier", () => {
      const result = playSlots(10, 1);
      expect(result.totalMultiplier).toBeGreaterThanOrEqual(0);
    });

    it("should have non-negative win amount", () => {
      const result = playSlots(10, 1);
      expect(result.winAmount).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiple paylines correctly", () => {
      const result = playSlots(10, 3);
      // With 3 paylines, we can have at most 3 matching paylines
      expect(result.matchedPaylines.length).toBeLessThanOrEqual(3);
    });

    it("should have valid payline positions", () => {
      const result = playSlots(10, 5);
      
      result.matchedPaylines.forEach((payline) => {
        expect(payline.positions).toHaveLength(3);
        payline.positions.forEach((pos) => {
          expect(pos).toBeGreaterThanOrEqual(0);
          expect(pos).toBeLessThan(3);
        });
      });
    });
  });

  describe("Game Randomness", () => {
    it("should produce different results on multiple plays", () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(playKeno([1, 2, 3], 10));
      }

      // Check that at least some results are different
      const uniqueResults = new Set(results.map((r) => r.matchedCount));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it("should produce different slot results", () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(playSlots(10, 1));
      }

      // Check that at least some results are different
      const uniqueResults = new Set(results.map((r) => r.totalMultiplier));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe("Game Fairness", () => {
    it("should have reasonable win distribution in Keno", () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(playKeno([1, 2, 3, 4, 5], 10));
      }

      const wins = results.filter((r) => r.winAmount > 0).length;
      const losses = results.filter((r) => r.winAmount === 0).length;

      // Should have both wins and losses
      expect(wins).toBeGreaterThan(0);
      expect(losses).toBeGreaterThan(0);
    });

    it("should have reasonable win distribution in Slots", () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(playSlots(10, 1));
      }

      const wins = results.filter((r) => r.winAmount > 0).length;
      const losses = results.filter((r) => r.winAmount === 0).length;

      // Should have both wins and losses
      expect(wins).toBeGreaterThan(0);
      expect(losses).toBeGreaterThan(0);
    });
  });
});
