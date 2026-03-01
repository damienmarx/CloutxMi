import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with username/password authentication and profile data.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }).default("username"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }), // Stored as YYYY-MM-DD
  isAgeVerified: boolean("is_age_verified").default(false).notNull(),
  discordId: varchar("discordId", { length: 64 }),
  telegramId: varchar("telegramId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  mfaSecret: varchar("mfaSecret", { length: 255 }),
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaRecoveryCodes: text("mfaRecoveryCodes"),
  selfExclusionUntil: timestamp("self_exclusion_until"), // Date until user is self-excluded
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User wallet for balance tracking
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  totalDeposited: decimal("totalDeposited", { precision: 15, scale: 2 }).default("0.00").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 15, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Transaction history for deposits, withdrawals, and tips
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "tip", "game_win", "game_loss"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  description: text("description"),
  relatedUserId: int("relatedUserId"),
  gameType: varchar("gameType", { length: 50 }),
  gameId: varchar("gameId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Keno game records
 */
export const kenoGames = mysqlTable("kenoGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  selectedNumbers: text("selectedNumbers").notNull(),
  drawnNumbers: text("drawnNumbers"),
  matchedCount: int("matchedCount").default(0),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).default("1.00"),
  winAmount: decimal("winAmount", { precision: 15, scale: 2 }).default("0.00"),
  turboMode: int("turboMode").default(0),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type KenoGame = typeof kenoGames.$inferSelect;
export type InsertKenoGame = typeof kenoGames.$inferInsert;

/**
 * Slots game records
 */
export const slotsGames = mysqlTable("slotsGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  reels: text("reels").notNull(),
  paylines: int("paylines").default(1),
  matchedPaylines: text("matchedPaylines"),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).default("1.00"),
  winAmount: decimal("winAmount", { precision: 15, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SlotsGame = typeof slotsGames.$inferSelect;
export type InsertSlotsGame = typeof slotsGames.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  transactions: many(transactions),
  kenoGames: many(kenoGames),
  slotsGames: many(slotsGames),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const kenoGamesRelations = relations(kenoGames, ({ one }) => ({
  user: one(users, {
    fields: [kenoGames.userId],
    references: [users.id],
  }),
}));

export const slotsGamesRelations = relations(slotsGames, ({ one }) => ({
  user: one(users, {
    fields: [slotsGames.userId],
    references: [users.id],
  }),
}));

/**
 * Crash game records
 */
export const crashGames = mysqlTable("crashGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
  cashoutMultiplier: decimal("cashoutMultiplier", { precision: 5, scale: 2 }),
  payout: decimal("payout", { precision: 15, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["won", "lost", "pending"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrashGame = typeof crashGames.$inferSelect;
export type InsertCrashGame = typeof crashGames.$inferInsert;

/**
 * Blackjack game records
 */
export const blackjackGames = mysqlTable("blackjackGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  playerHand: text("playerHand").notNull(),
  dealerHand: text("dealerHand").notNull(),
  result: mysqlEnum("result", ["win", "loss", "push"]).notNull(),
  payout: decimal("payout", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlackjackGame = typeof blackjackGames.$inferSelect;
export type InsertBlackjackGame = typeof blackjackGames.$inferInsert;

/**
 * Roulette game records
 */
export const rouletteGames = mysqlTable("rouletteGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  betType: varchar("betType", { length: 50 }).notNull(),
  winningNumber: int("winningNumber").notNull(),
  result: mysqlEnum("result", ["win", "loss"]).notNull(),
  payout: decimal("payout", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouletteGame = typeof rouletteGames.$inferSelect;
export type InsertRouletteGame = typeof rouletteGames.$inferInsert;

/**
 * Dice game records
 */
export const diceGames = mysqlTable("diceGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  prediction: varchar("prediction", { length: 20 }).notNull(),
  roll: int("roll").notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 15, scale: 2 }).notNull(),
  result: mysqlEnum("result", ["win", "loss"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiceGame = typeof diceGames.$inferSelect;
export type InsertDiceGame = typeof diceGames.$inferInsert;

/**
 * Poker game records
 */
export const pokerGames = mysqlTable("pokerGames", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: int("userId").notNull(),
  betAmount: decimal("betAmount", { precision: 15, scale: 2 }).notNull(),
  playerHand: text("playerHand").notNull(),
  handRank: varchar("handRank", { length: 50 }).notNull(),
  payout: decimal("payout", { precision: 15, scale: 2 }).notNull(),
  result: mysqlEnum("result", ["win", "loss"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PokerGame = typeof pokerGames.$inferSelect;
export type InsertPokerGame = typeof pokerGames.$inferInsert;

/**
 * Tournament system
 */
export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  entryFee: decimal("entryFee", { precision: 10, scale: 2 }).notNull(),
  prizePool: decimal("prizePool", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "upcoming"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = typeof tournaments.$inferInsert;

/**
 * Tournament participants
 */
export const tournamentParticipants = mysqlTable("tournamentParticipants", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").default(0).notNull(),
  rank: int("rank"),
  prizeWon: decimal("prizeWon", { precision: 10, scale: 2 }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = typeof tournamentParticipants.$inferInsert;

/**
 * VIP tiers
 */
export const vipTiers = mysqlTable("vipTiers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "diamond"]).default("bronze").notNull(),
  totalWagered: decimal("totalWagered", { precision: 15, scale: 2 }).default("0").notNull(),
  cashbackPercentage: decimal("cashbackPercentage", { precision: 5, scale: 2 }).notNull(),
  bonusMultiplier: decimal("bonusMultiplier", { precision: 5, scale: 2 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VipTier = typeof vipTiers.$inferSelect;
export type InsertVipTier = typeof vipTiers.$inferInsert;

/**
 * Referral system
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }).notNull(),
  totalCommission: decimal("totalCommission", { precision: 10, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Daily challenges
 */
export const dailyChallenges = mysqlTable("dailyChallenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requirement: int("requirement").notNull(),
  reward: decimal("reward", { precision: 10, scale: 2 }).notNull(),
  game: varchar("game", { length: 50 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = typeof dailyChallenges.$inferInsert;

/**
 * User challenge progress
 */
export const userChallengeProgress = mysqlTable("userChallengeProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  progress: int("progress").default(0).notNull(),
  completed: int("completed").default(0).notNull(),
  claimedReward: int("claimedReward").default(0).notNull(),
  completedAt: timestamp("completedAt"),
});

export type UserChallengeProgress = typeof userChallengeProgress.$inferSelect;
export type InsertUserChallengeProgress = typeof userChallengeProgress.$inferInsert;

/**
 * Updated relations
 */
export const updatedUsersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  transactions: many(transactions),
  kenoGames: many(kenoGames),
  slotsGames: many(slotsGames),
  crashGames: many(crashGames),
  blackjackGames: many(blackjackGames),
  rouletteGames: many(rouletteGames),
  diceGames: many(diceGames),
  pokerGames: many(pokerGames),
  vipTier: one(vipTiers, {
    fields: [users.id],
    references: [vipTiers.userId],
  }),
  referrals: many(referrals),
  challengeProgress: many(userChallengeProgress),
}));

export const crashGamesRelations = relations(crashGames, ({ one }) => ({
  user: one(users, {
    fields: [crashGames.userId],
    references: [users.id],
  }),
}));

export const blackjackGamesRelations = relations(blackjackGames, ({ one }) => ({
  user: one(users, {
    fields: [blackjackGames.userId],
    references: [users.id],
  }),
}));

export const rouletteGamesRelations = relations(rouletteGames, ({ one }) => ({
  user: one(users, {
    fields: [rouletteGames.userId],
    references: [users.id],
  }),
}));

export const diceGamesRelations = relations(diceGames, ({ one }) => ({
  user: one(users, {
    fields: [diceGames.userId],
    references: [users.id],
  }),
}));

export const pokerGamesRelations = relations(pokerGames, ({ one }) => ({
  user: one(users, {
    fields: [pokerGames.userId],
    references: [users.id],
  }),
}));

export const vipTiersRelations = relations(vipTiers, ({ one }) => ({
  user: one(users, {
    fields: [vipTiers.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
}));

export const userChallengeProgressRelations = relations(userChallengeProgress, ({ one }) => ({
  user: one(users, {
    fields: [userChallengeProgress.userId],
    references: [users.id],
  }),
}));


/**
 * Chat Messages for live chat system
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  message: text("message").notNull(),
  mentions: text("mentions"), // JSON array of mentioned usernames
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Rain Events for reward distribution
 */
export const rainEvents = mysqlTable("rainEvents", {
  id: int("id").autoincrement().primaryKey(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  participantCount: int("participantCount").notNull(),
  amountPerPlayer: decimal("amountPerPlayer", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type RainEvent = typeof rainEvents.$inferSelect;
export type InsertRainEvent = typeof rainEvents.$inferInsert;

/**
 * Rain Participants tracking
 */
export const rainParticipants = mysqlTable("rainParticipants", {
  id: int("id").autoincrement().primaryKey(),
  rainEventId: int("rainEventId").notNull(),
  userId: int("userId").notNull(),
  amountReceived: decimal("amountReceived", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RainParticipant = typeof rainParticipants.$inferSelect;
export type InsertRainParticipant = typeof rainParticipants.$inferInsert;

/**
 * Relations for chat and rain
 */
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const rainEventsRelations = relations(rainEvents, ({ many }) => ({
  participants: many(rainParticipants),
}));

export const rainParticipantsRelations = relations(rainParticipants, ({ one }) => ({
  rainEvent: one(rainEvents, {
    fields: [rainParticipants.rainEventId],
    references: [rainEvents.id],
  }),
  user: one(users, {
    fields: [rainParticipants.userId],
    references: [users.id],
  }),
}));
