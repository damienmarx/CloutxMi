/**
 * CloutScape Game Engine
 * Implements 7 core games with provably fair RNG
 * Games: Dice, Crash, Slots, Blackjack, Roulette, Keno, Poker
 */

import crypto from "crypto";

/**
 * Provably Fair RNG System
 * Uses HMAC-SHA256 for fairness verification
 */
export class ProvablyFairRNG {
  /**
   * Generate seed for game
   */
  static generateSeed(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate random number between min and max using seed
   */
  static generateNumber(
    seed: string,
    clientSeed: string,
    min: number,
    max: number
  ): number {
    const hash = crypto
      .createHmac("sha256", seed)
      .update(clientSeed)
      .digest("hex");

    const number = parseInt(hash.substring(0, 8), 16);
    return (number % (max - min + 1)) + min;
  }

  /**
   * Verify fairness of a game result
   */
  static verifyFairness(
    seed: string,
    clientSeed: string,
    result: number,
    min: number,
    max: number
  ): boolean {
    const calculatedResult = this.generateNumber(seed, clientSeed, min, max);
    return calculatedResult === result;
  }
}

/**
 * DICE GAME
 * Simple high/low betting game
 */
export class DiceGame {
  static play(
    betAmount: number,
    prediction: "high" | "low",
    seed: string,
    clientSeed: string
  ): {
    result: number;
    won: boolean;
    payout: number;
  } {
    const roll = ProvablyFairRNG.generateNumber(seed, clientSeed, 1, 100);
    const threshold = 50;

    const won =
      (prediction === "high" && roll > threshold) ||
      (prediction === "low" && roll < threshold);

    const payout = won ? betAmount * 1.98 : 0;

    return { result: roll, won, payout };
  }
}

/**
 * CRASH GAME
 * Multiplier-based game where players cash out before crash
 */
export class CrashGame {
  static generateCrashPoint(seed: string, clientSeed: string): number {
    const random = ProvablyFairRNG.generateNumber(seed, clientSeed, 1, 10000);
    // Crash point between 1.01x and 100x with exponential distribution
    return Math.max(1.01, Math.pow(random / 10000, -0.75));
  }

  static calculatePayout(betAmount: number, crashPoint: number, cashOutAt: number): number {
    if (cashOutAt >= crashPoint) {
      return 0; // Busted
    }
    return betAmount * cashOutAt;
  }
}

/**
 * SLOTS GAME
 * 3-reel slots with paylines
 */
export class SlotsGame {
  private static readonly SYMBOLS = ["🍒", "🍋", "🍊", "🔔", "💎", "🎰"];
  private static readonly PAYOUTS: Record<string, number> = {
    "🍒🍒🍒": 2,
    "🍋🍋🍋": 3,
    "🍊🍊🍊": 4,
    "🔔🔔🔔": 5,
    "💎💎💎": 10,
    "🎰🎰🎰": 50,
  };

  static spin(
    betAmount: number,
    seed: string,
    clientSeed: string
  ): {
    reels: string[];
    payout: number;
    won: boolean;
  } {
    const reels: string[] = [];

    for (let i = 0; i < 3; i++) {
      const symbolIndex = ProvablyFairRNG.generateNumber(
        seed + i,
        clientSeed,
        0,
        this.SYMBOLS.length - 1
      );
      reels.push(this.SYMBOLS[symbolIndex]);
    }

    const combination = reels.join("");
    const multiplier = this.PAYOUTS[combination] || 0;
    const payout = multiplier > 0 ? betAmount * multiplier : 0;

    return {
      reels,
      payout,
      won: multiplier > 0,
    };
  }
}

/**
 * BLACKJACK GAME
 * Classic card game
 */
export class BlackjackGame {
  private static readonly CARDS = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];

  static drawCard(seed: string, clientSeed: string, index: number): string {
    const cardIndex = ProvablyFairRNG.generateNumber(
      seed + index,
      clientSeed,
      0,
      this.CARDS.length - 1
    );
    return this.CARDS[cardIndex];
  }

  static getCardValue(card: string): number {
    if (card === "A") return 11;
    if (["J", "Q", "K"].includes(card)) return 10;
    return parseInt(card);
  }

  static calculateHand(cards: string[]): number {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
      const value = this.getCardValue(card);
      if (card === "A") aces++;
      total += value;
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  static play(
    betAmount: number,
    playerCards: string[],
    dealerCards: string[],
    seed: string,
    clientSeed: string
  ): {
    playerTotal: number;
    dealerTotal: number;
    result: "win" | "loss" | "push";
    payout: number;
  } {
    const playerTotal = this.calculateHand(playerCards);
    const dealerTotal = this.calculateHand(dealerCards);

    let result: "win" | "loss" | "push" = "loss";
    let payout = 0;

    if (playerTotal > 21) {
      result = "loss";
    } else if (dealerTotal > 21) {
      result = "win";
      payout = betAmount * 2;
    } else if (playerTotal > dealerTotal) {
      result = "win";
      payout = betAmount * 2;
    } else if (playerTotal === dealerTotal) {
      result = "push";
      payout = betAmount;
    }

    return { playerTotal, dealerTotal, result, payout };
  }
}

/**
 * ROULETTE GAME
 * European roulette (37 numbers: 0-36)
 */
export class RouletteGame {
  static spin(
    betAmount: number,
    betType: "number" | "color" | "odd_even",
    betValue: string | number,
    seed: string,
    clientSeed: string
  ): {
    result: number;
    color: "red" | "black" | "green";
    won: boolean;
    payout: number;
  } {
    const result = ProvablyFairRNG.generateNumber(seed, clientSeed, 0, 36);
    const color = this.getColor(result);

    let won = false;
    let payout = 0;

    if (betType === "number") {
      won = result === parseInt(betValue as string);
      payout = won ? betAmount * 36 : 0;
    } else if (betType === "color") {
      won = color === betValue;
      payout = won ? betAmount * 2 : 0;
    } else if (betType === "odd_even") {
      const isOdd = result % 2 === 1;
      won =
        (betValue === "odd" && isOdd) || (betValue === "even" && !isOdd);
      payout = won ? betAmount * 2 : 0;
    }

    return { result, color, won, payout };
  }

  private static getColor(number: number): "red" | "black" | "green" {
    if (number === 0) return "green";
    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];
    return redNumbers.includes(number) ? "red" : "black";
  }
}

/**
 * KENO GAME
 * Pick numbers and match drawn numbers
 */
export class KenoGame {
  static play(
    betAmount: number,
    selectedNumbers: number[],
    seed: string,
    clientSeed: string
  ): {
    drawnNumbers: number[];
    matchedCount: number;
    multiplier: number;
    payout: number;
  } {
    const drawnNumbers: number[] = [];
    const maxNumbers = 20;

    for (let i = 0; i < maxNumbers; i++) {
      const number = ProvablyFairRNG.generateNumber(
        seed + i,
        clientSeed,
        1,
        80
      );
      if (!drawnNumbers.includes(number)) {
        drawnNumbers.push(number);
      }
    }

    const matchedCount = selectedNumbers.filter((n) =>
      drawnNumbers.includes(n)
    ).length;

    // Payout table based on matches
    const payoutTable: Record<number, number> = {
      0: 0,
      1: 0,
      2: 1,
      3: 2,
      4: 5,
      5: 10,
      6: 20,
      7: 50,
      8: 100,
      9: 200,
      10: 500,
    };

    const multiplier = payoutTable[matchedCount] || 0;
    const payout = betAmount * multiplier;

    return { drawnNumbers, matchedCount, multiplier, payout };
  }
}

/**
 * POKER GAME
 * Simplified 5-card draw poker
 */
export class PokerGame {
  private static readonly HAND_RANKINGS = {
    ROYAL_FLUSH: 10,
    STRAIGHT_FLUSH: 9,
    FOUR_OF_A_KIND: 8,
    FULL_HOUSE: 7,
    FLUSH: 6,
    STRAIGHT: 5,
    THREE_OF_A_KIND: 4,
    TWO_PAIR: 3,
    ONE_PAIR: 2,
    HIGH_CARD: 1,
  };

  static evaluateHand(
    cards: string[]
  ): {
    rank: number;
    name: string;
  } {
    // Simplified hand evaluation
    // In production, implement full poker hand ranking logic

    const values = cards.map((c) => this.getCardValue(c));
    const suits = cards.map((c) => c.slice(-1));

    const isFlush = suits.every((s) => s === suits[0]);
    const isStraight = this.isStraight(values);

    if (isFlush && isStraight) {
      return { rank: 9, name: "Straight Flush" };
    }
    if (isFlush) {
      return { rank: 6, name: "Flush" };
    }
    if (isStraight) {
      return { rank: 5, name: "Straight" };
    }

    return { rank: 1, name: "High Card" };
  }

  private static getCardValue(card: string): number {
    const value = card.slice(0, -1);
    if (value === "A") return 14;
    if (value === "K") return 13;
    if (value === "Q") return 12;
    if (value === "J") return 11;
    return parseInt(value);
  }

  private static isStraight(values: number[]): boolean {
    const sorted = [...values].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) return false;
    }
    return true;
  }

  static play(
    betAmount: number,
    playerCards: string[],
    dealerCards: string[],
    seed: string,
    clientSeed: string
  ): {
    playerHand: { rank: number; name: string };
    dealerHand: { rank: number; name: string };
    result: "win" | "loss" | "push";
    payout: number;
  } {
    const playerHand = this.evaluateHand(playerCards);
    const dealerHand = this.evaluateHand(dealerCards);

    let result: "win" | "loss" | "push" = "loss";
    let payout = 0;

    if (playerHand.rank > dealerHand.rank) {
      result = "win";
      payout = betAmount * 2;
    } else if (playerHand.rank === dealerHand.rank) {
      result = "push";
      payout = betAmount;
    }

    return { playerHand, dealerHand, result, payout };
  }
}

export default {
  ProvablyFairRNG,
  DiceGame,
  CrashGame,
  SlotsGame,
  BlackjackGame,
  RouletteGame,
  KenoGame,
  PokerGame,
};
