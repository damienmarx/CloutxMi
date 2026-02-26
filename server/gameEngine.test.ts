import { describe, expect, it } from "vitest";
import {
  generateServerSeed,
  hashServerSeed,
  verifyServerSeedHash,
  generateDiceOutcome,
  generateCrashOutcome,
  generateCoinflipOutcome,
  createFairnessProof,
  verifyFairnessProof,
} from "./gameEngine";

describe("Game Engine - Provably Fair System", () => {
  describe("Seed Generation & Hashing", () => {
    it("generates a valid server seed", () => {
      const seed = generateServerSeed();
      expect(seed).toBeDefined();
      expect(seed.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/.test(seed)).toBe(true);
    });

    it("generates consistent hash for same seed", () => {
      const seed = "test-seed-value";
      const hash1 = hashServerSeed(seed);
      const hash2 = hashServerSeed(seed);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA256 hex
    });

    it("verifies server seed hash correctly", () => {
      const seed = generateServerSeed();
      const hash = hashServerSeed(seed);
      expect(verifyServerSeedHash(seed, hash)).toBe(true);
    });

    it("rejects invalid server seed hash", () => {
      const seed = generateServerSeed();
      const wrongHash = "0".repeat(64);
      expect(verifyServerSeedHash(seed, wrongHash)).toBe(false);
    });
  });

  describe("Dice Game Logic", () => {
    it("generates deterministic dice outcomes", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;
      const target = 50;

      const outcome1 = generateDiceOutcome(serverSeed, clientSeed, nonce, target);
      const outcome2 = generateDiceOutcome(serverSeed, clientSeed, nonce, target);

      expect(outcome1.roll).toBe(outcome2.roll);
      expect(outcome1.isWin).toBe(outcome2.isWin);
      expect(outcome1.multiplier).toBe(outcome2.multiplier);
    });

    it("produces different outcomes for different nonces", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const target = 50;

      const outcome1 = generateDiceOutcome(serverSeed, clientSeed, 1, target);
      const outcome2 = generateDiceOutcome(serverSeed, clientSeed, 2, target);

      expect(outcome1.roll).not.toBe(outcome2.roll);
    });

    it("produces different outcomes for different client seeds", () => {
      const serverSeed = "server-seed-1";
      const target = 50;

      const outcome1 = generateDiceOutcome(serverSeed, "client-1", 1, target);
      const outcome2 = generateDiceOutcome(serverSeed, "client-2", 1, target);

      expect(outcome1.roll).not.toBe(outcome2.roll);
    });

    it("respects target number for win/loss determination", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;

      const outcome = generateDiceOutcome(serverSeed, clientSeed, nonce, 50);

      if (outcome.roll > 50) {
        expect(outcome.isWin).toBe(true);
      } else {
        expect(outcome.isWin).toBe(false);
      }
    });

    it("calculates reasonable multipliers based on target", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;

      const easyTarget = generateDiceOutcome(serverSeed, clientSeed, nonce, 10);
      const hardTarget = generateDiceOutcome(serverSeed, clientSeed, nonce, 90);

      // Higher target (harder to win) should have higher multiplier
      expect(hardTarget.multiplier).toBeGreaterThan(easyTarget.multiplier);
    });

    it("roll is always between 0 and 99", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";

      for (let i = 0; i < 100; i++) {
        const outcome = generateDiceOutcome(serverSeed, clientSeed, i, 50);
        expect(outcome.roll).toBeGreaterThanOrEqual(0);
        expect(outcome.roll).toBeLessThan(100);
      }
    });
  });

  describe("Crash Game Logic", () => {
    it("generates deterministic crash outcomes", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;

      const outcome1 = generateCrashOutcome(serverSeed, clientSeed, nonce);
      const outcome2 = generateCrashOutcome(serverSeed, clientSeed, nonce);

      expect(outcome1.crashPoint).toBe(outcome2.crashPoint);
      expect(outcome1.multiplier).toBe(outcome2.multiplier);
    });

    it("produces different outcomes for different nonces", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";

      const outcome1 = generateCrashOutcome(serverSeed, clientSeed, 1);
      const outcome2 = generateCrashOutcome(serverSeed, clientSeed, 2);

      expect(outcome1.crashPoint).not.toBe(outcome2.crashPoint);
    });

    it("crash point is between 1.0x and 100x", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";

      for (let i = 0; i < 100; i++) {
        const outcome = generateCrashOutcome(serverSeed, clientSeed, i);
        expect(outcome.crashPoint).toBeGreaterThanOrEqual(1.0);
        expect(outcome.crashPoint).toBeLessThanOrEqual(100);
      }
    });

    it("crash point distribution has variety", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";

      const outcomes: number[] = [];
      for (let i = 0; i < 100; i++) {
        const outcome = generateCrashOutcome(serverSeed, clientSeed, i);
        outcomes.push(outcome.crashPoint);
      }

      // Should have variety in crash points
      const uniquePoints = new Set(outcomes).size;
      expect(uniquePoints).toBeGreaterThan(5);
    });
  });

  describe("Coinflip Game Logic", () => {
    it("generates deterministic coinflip outcomes", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;

      const outcome1 = generateCoinflipOutcome(serverSeed, clientSeed, nonce, "heads");
      const outcome2 = generateCoinflipOutcome(serverSeed, clientSeed, nonce, "heads");

      expect(outcome1.result).toBe(outcome2.result);
      expect(outcome1.isWin).toBe(outcome2.isWin);
    });

    it("produces different outcomes for different client seeds", () => {
      const serverSeed = "server-seed-1";
      const nonce = 1;

      const outcome1 = generateCoinflipOutcome(serverSeed, "client-1", nonce, "heads");
      const outcome2 = generateCoinflipOutcome(serverSeed, "client-2", nonce, "heads");

      expect(outcome1.result).not.toBe(outcome2.result);
    });

    it("respects player choice for win determination", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;

      const outcome = generateCoinflipOutcome(serverSeed, clientSeed, nonce, "heads");

      if (outcome.result === "heads") {
        expect(outcome.isWin).toBe(true);
      } else {
        expect(outcome.isWin).toBe(false);
      }
    });

    it("result is either heads or tails", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";

      for (let i = 0; i < 100; i++) {
        const outcome = generateCoinflipOutcome(serverSeed, clientSeed, i, "heads");
        expect(["heads", "tails"]).toContain(outcome.result);
      }
    });

    it("maintains roughly 50/50 distribution", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";

      let heads = 0;
      let tails = 0;

      for (let i = 0; i < 1000; i++) {
        const outcome = generateCoinflipOutcome(serverSeed, clientSeed, i, "heads");
        if (outcome.result === "heads") heads++;
        else tails++;
      }

      // Should be roughly 50/50 (within 10% margin)
      const headsRatio = heads / 1000;
      expect(headsRatio).toBeGreaterThan(0.4);
      expect(headsRatio).toBeLessThan(0.6);
    });
  });

  describe("Fairness Proof Generation & Verification", () => {
    it("creates valid fairness proof", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;
      const outcome = generateDiceOutcome(serverSeed, clientSeed, nonce, 50);

      const proof = createFairnessProof(serverSeed, clientSeed, nonce, outcome);

      expect(proof.serverSeed).toBe(serverSeed);
      expect(proof.clientSeed).toBe(clientSeed);
      expect(proof.nonce).toBe(nonce);
      expect(proof.serverSeedHash).toBe(hashServerSeed(serverSeed));
      expect(proof.combinedHash.length).toBe(64);
      expect(proof.outcome).toEqual(outcome);
    });

    it("verifies valid fairness proof", () => {
      const serverSeed = "server-seed-1";
      const clientSeed = "client-seed-1";
      const nonce = 1;
      const outcome = generateDiceOutcome(serverSeed, clientSeed, nonce, 50);

      const result = verifyFairnessProof(serverSeed, clientSeed, nonce, "dice", outcome);

      expect(result.valid).toBe(true);
      expect(result.message).toContain("verified");
    });

    it("rejects proof with empty server seed", () => {
      const clientSeed = "client-seed-1";
      const nonce = 1;
      const outcome = generateDiceOutcome("server-seed-1", clientSeed, nonce, 50);

      const result = verifyFairnessProof("", clientSeed, nonce, "dice", outcome);

      expect(result.valid).toBe(false);
    });
  });
});
