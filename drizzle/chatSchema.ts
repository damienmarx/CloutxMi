import {
  int,
  varchar,
  text,
  timestamp,
  decimal,
  enum as dbEnum,
  mysqlTable,
  index,
  foreignKey,
  unique,
} from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Chat Messages Table
 * Stores all live chat messages with user info and timestamps
 */
export const chatMessages = mysqlTable(
  "chatMessages",
  {
    id: int().primaryKey().autoincrement(),
    userId: int().notNull(),
    username: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index("idx_userId").on(table.userId),
    createdAtIdx: index("idx_createdAt").on(table.createdAt),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);

/**
 * Rain Pool Table
 * Tracks the current rain pool state and history
 */
export const rainPool = mysqlTable(
  "rainPool",
  {
    id: int().primaryKey().autoincrement(),
    amount: decimal({ precision: 18, scale: 8 }).default("0").notNull(),
    maxAmount: decimal({ precision: 18, scale: 8 }).default("10000").notNull(),
    participantCount: int().default(0).notNull(),
    status: dbEnum("status", ["accumulating", "raining", "completed"]).default("accumulating"),
    createdAt: timestamp().defaultNow(),
    completedAt: timestamp(),
  },
  (table) => ({
    statusIdx: index("idx_status").on(table.status),
    createdAtIdx: index("idx_createdAt").on(table.createdAt),
  })
);

/**
 * Rain Pool Participants Table
 * Tracks which users participated in each rain pool
 */
export const rainPoolParticipants = mysqlTable(
  "rainPoolParticipants",
  {
    id: int().primaryKey().autoincrement(),
    rainPoolId: int().notNull(),
    userId: int().notNull(),
    joinedAt: timestamp().defaultNow(),
    shareAmount: decimal({ precision: 18, scale: 8 }).default("0"),
  },
  (table) => ({
    userIdIdx: index("idx_userId").on(table.userId),
    rainPoolFk: foreignKey({
      columns: [table.rainPoolId],
      foreignColumns: [rainPool.id],
    }).onDelete("cascade"),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    uniquePoolUser: unique("unique_pool_user").on(table.rainPoolId, table.userId),
  })
);

/**
 * Chat Restrictions Table
 * Tracks chat bans and restrictions for moderation
 */
export const chatRestrictions = mysqlTable(
  "chatRestrictions",
  {
    id: int().primaryKey().autoincrement(),
    userId: int().notNull(),
    reason: varchar({ length: 255 }),
    restrictedUntil: timestamp(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_userId").on(table.userId),
    restrictedUntilIdx: index("idx_restrictedUntil").on(table.restrictedUntil),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type RainPool = typeof rainPool.$inferSelect;
export type RainPoolParticipant = typeof rainPoolParticipants.$inferSelect;
export type ChatRestriction = typeof chatRestrictions.$inferSelect;
