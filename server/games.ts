import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Crash Game Logic - Exponential multiplier that crashes at random point
 */
export function generateCrashMultiplier(): number {
  const random = randomBytes(4).readUInt32BE(0) / 0xffffffff;
  return Math.pow(Math.E, random * 5); // Multiplier between 1 and ~148
}

export function checkCrashWin(crashMultiplier: number, cashoutMultiplier: number): boolean {
  return cashoutMultiplier <= crashMultiplier;
}

/**
 * Blackjack Game Logic
 */
export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
}

export function getCardValue(card: Card): number {
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

export function calculateHandValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    const cardValue = getCardValue(card);
    if (card.rank === "A") aces++;
    value += cardValue;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

export function generateDeck(): Card[] {
  const suits: Array<"hearts" | "diamonds" | "clubs" | "spades"> = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Array<"A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"> = [
    "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function determineBlackjackWinner(playerValue: number, dealerValue: number): "win" | "loss" | "push" {
  if (playerValue > 21) return "loss";
  if (dealerValue > 21) return "win";
  if (playerValue > dealerValue) return "win";
  if (playerValue < dealerValue) return "loss";
  return "push";
}

/**
 * Roulette Game Logic
 */
export function spinRoulette(): number {
  return Math.floor(Math.random() * 37); // 0-36
}

export function checkRouletteWin(bet: string, winningNumber: number): boolean {
  if (bet === "red") {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(winningNumber);
  }
  if (bet === "black") {
    const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
    return blackNumbers.includes(winningNumber);
  }
  if (bet === "even") return winningNumber % 2 === 0 && winningNumber !== 0;
  if (bet === "odd") return winningNumber % 2 === 1;
  if (bet === "low") return winningNumber >= 1 && winningNumber <= 18;
  if (bet === "high") return winningNumber >= 19 && winningNumber <= 36;
  if (bet.startsWith("number_")) {
    const number = parseInt(bet.split("_")[1]);
    return winningNumber === number;
  }
  return false;
}

export function getRoulettePayoutMultiplier(bet: string): number {
  if (bet.startsWith("number_")) return 36;
  return 2; // Red, black, even, odd, high, low all pay 2:1
}

/**
 * Dice Game Logic
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 100) + 1; // 1-100
}

export function checkDiceWin(prediction: "over" | "under" | "exact", roll: number, target?: number): boolean {
  if (prediction === "over") return roll > 50;
  if (prediction === "under") return roll < 50;
  if (prediction === "exact" && target) return roll === target;
  return false;
}

export function getDiceMultiplier(prediction: "over" | "under" | "exact", target?: number): number {
  if (prediction === "exact") return 100;
  return 1.98; // Over/Under pays ~2x
}

/**
 * Poker Game Logic
 */
export interface PokerHand {
  cards: Card[];
  rank: string;
  value: number;
}

export enum HandRank {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export function evaluatePokerHand(cards: Card[]): PokerHand {
  // Simplified poker hand evaluation
  const ranks = cards.map(c => c.rank);
  const suits = cards.map(c => c.suit);

  // Check for flush
  const isFlush = new Set(suits).size === 1;

  // Check for straight
  const rankValues = ranks.map(r => {
    if (r === "A") return 14;
    if (r === "K") return 13;
    if (r === "Q") return 12;
    if (r === "J") return 11;
    return parseInt(r);
  }).sort((a, b) => a - b);

  const isStraight = rankValues[4] - rankValues[0] === 4 &&
    new Set(rankValues).size === 5;

  // Count ranks
  const rankCounts: { [key: string]: number } = {};
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }

  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  let handRank = HandRank.HighCard;
  let handName = "High Card";

  if (counts[0] === 4) {
    handRank = HandRank.FourOfAKind;
    handName = "Four of a Kind";
  } else if (counts[0] === 3 && counts[1] === 2) {
    handRank = HandRank.FullHouse;
    handName = "Full House";
  } else if (isFlush) {
    handRank = HandRank.Flush;
    handName = "Flush";
  } else if (isStraight) {
    handRank = HandRank.Straight;
    handName = "Straight";
  } else if (counts[0] === 3) {
    handRank = HandRank.ThreeOfAKind;
    handName = "Three of a Kind";
  } else if (counts[0] === 2 && counts[1] === 2) {
    handRank = HandRank.TwoPair;
    handName = "Two Pair";
  } else if (counts[0] === 2) {
    handRank = HandRank.OnePair;
    handName = "One Pair";
  }

  return {
    cards,
    rank: handName,
    value: handRank,
  };
}

export function getPokerPayout(handRank: string): number {
  const payouts: { [key: string]: number } = {
    "High Card": 0,
    "One Pair": 1,
    "Two Pair": 2,
    "Three of a Kind": 3,
    "Straight": 4,
    "Flush": 6,
    "Full House": 9,
    "Four of a Kind": 25,
    "Royal Flush": 250,
  };
  return payouts[handRank] || 0;
}

/**
 * VIP Tier Calculation
 */
export interface VipTierInfo {
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  cashbackPercentage: number;
  bonusMultiplier: number;
  minWagered: number;
}

export function calculateVipTier(totalWagered: number): VipTierInfo {
  if (totalWagered >= 1000000) {
    return {
      tier: "diamond",
      cashbackPercentage: 5,
      bonusMultiplier: 2.5,
      minWagered: 1000000,
    };
  }
  if (totalWagered >= 500000) {
    return {
      tier: "platinum",
      cashbackPercentage: 4,
      bonusMultiplier: 2.0,
      minWagered: 500000,
    };
  }
  if (totalWagered >= 100000) {
    return {
      tier: "gold",
      cashbackPercentage: 3,
      bonusMultiplier: 1.5,
      minWagered: 100000,
    };
  }
  if (totalWagered >= 10000) {
    return {
      tier: "silver",
      cashbackPercentage: 2,
      bonusMultiplier: 1.25,
      minWagered: 10000,
    };
  }
  return {
    tier: "bronze",
    cashbackPercentage: 1,
    bonusMultiplier: 1.0,
    minWagered: 0,
  };
}

/**
 * Referral Commission Calculation
 */
export function calculateReferralCommission(referredUserWinnings: number, commissionPercentage: number): number {
  return (referredUserWinnings * commissionPercentage) / 100;
}

/**
 * Daily Challenge Progress
 */
export function updateChallengeProgress(
  currentProgress: number,
  requirement: number,
  increment: number
): { progress: number; completed: boolean } {
  const newProgress = Math.min(currentProgress + increment, requirement);
  return {
    progress: newProgress,
    completed: newProgress >= requirement,
  };
}

/**
 * Tournament Ranking
 */
export function calculateTournamentRanking(scores: { userId: number; score: number }[]): Array<{ userId: number; score: number; rank: number }> {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Prize Distribution
 */
export function distributePrizes(prizePool: number, participantCount: number): number[] {
  const prizes: number[] = [];
  let remaining = prizePool;

  // Top 10% get prizes, distributed as: 40%, 25%, 15%, 10%, 5%, 2.5%, 1.25%, 0.625%, 0.3125%, 0.1875%
  const topPlaces = Math.max(1, Math.ceil(participantCount * 0.1));
  const distribution = [0.4, 0.25, 0.15, 0.1, 0.05, 0.025, 0.0125, 0.00625, 0.003125, 0.0015625];

  for (let i = 0; i < topPlaces && i < distribution.length; i++) {
    prizes.push(prizePool * distribution[i]);
  }

  return prizes;
}

/**
 * Generate Referral Code
 */
export function generateReferralCode(userId: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = `REF${userId}`;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
