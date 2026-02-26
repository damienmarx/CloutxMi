import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import { chatMessages, rainEvents, rainParticipants } from "../drizzle/schema";

export interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  mentions?: string[];
  createdAt: Date;
}

export interface RainEvent {
  id: number;
  totalAmount: number;
  participantCount: number;
  amountPerPlayer: number;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Chat System Functions
 */
export async function sendChatMessage(
  userId: number,
  username: string,
  message: string,
  mentions?: string[]
): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Validate message
  if (!message || message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  if (message.length > 500) {
    throw new Error("Message too long (max 500 characters)");
  }

  // Insert message
  const result = await db.insert(chatMessages).values({
    userId,
    username,
    message: message.trim(),
    mentions: mentions ? JSON.stringify(mentions) : null,
  });

  return {
    id: result[0] as unknown as number,
    userId,
    username,
    message,
    mentions,
    createdAt: new Date(),
  };
}

export async function getChatHistory(limit: number = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const messages = await db
    .select()
    .from(chatMessages)
    .orderBy((t) => ({ createdAt: "desc" }))
    .limit(limit);

  return messages.map((m: any) => ({
    id: m.id,
    userId: m.userId,
    username: m.username,
    message: m.message,
    mentions: m.mentions ? JSON.parse(m.mentions) : undefined,
    createdAt: m.createdAt,
  }));
}

/**
 * Rain System Functions
 */
export async function startRainEvent(
  totalAmount: number,
  participantCount: number
): Promise<RainEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const amountPerPlayer = totalAmount / Math.max(participantCount, 1);

  const result = await db.insert(rainEvents).values({
    totalAmount: totalAmount.toString(),
    participantCount,
    amountPerPlayer: amountPerPlayer.toString(),
    status: "active",
  });

  return {
    id: result[0] as unknown as number,
    totalAmount,
    participantCount,
    amountPerPlayer,
    status: "active",
    createdAt: new Date(),
  };
}

export async function addRainParticipant(
  rainEventId: number,
  userId: number,
  amountReceived: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(rainParticipants).values({
    rainEventId,
    userId,
    amountReceived: amountReceived.toString(),
  });
}

export async function completeRainEvent(rainEventId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(rainEvents)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where((t) => ({ id: rainEventId }));
}

export async function getRainHistory(limit: number = 10): Promise<RainEvent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const events = await db
    .select()
    .from(rainEvents)
    .orderBy((t) => ({ createdAt: "desc" }))
    .limit(limit);

  return events.map((e: any) => ({
    id: e.id,
    totalAmount: parseFloat(e.totalAmount),
    participantCount: e.participantCount,
    amountPerPlayer: parseFloat(e.amountPerPlayer),
    status: e.status,
    createdAt: e.createdAt,
    completedAt: e.completedAt,
  }));
}

export async function getUserRainRewards(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select()
    .from(rainParticipants)
    .where((t) => ({ userId }));

  return result.reduce((sum: number, r: any) => sum + parseFloat(r.amountReceived), 0);
}

/**
 * Moderation Functions
 */
export async function deleteChatMessage(messageId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .delete(chatMessages)
    .where((t) => ({ id: messageId }));
}

export async function muteUser(userId: number, durationMinutes: number): Promise<void> {
  // Store mute in memory or cache (Redis would be ideal)
  // For now, this is a placeholder
  console.log(`User ${userId} muted for ${durationMinutes} minutes`);
}

export async function filterProfanity(message: string): boolean {
  // Simple profanity filter - can be enhanced
  const profanityList = ["badword1", "badword2"];
  const lowerMessage = message.toLowerCase();

  for (const word of profanityList) {
    if (lowerMessage.includes(word)) {
      return false;
    }
  }

  return true;
}
