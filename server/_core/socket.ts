/**
 * Degens¤Den — Socket.IO Server
 * Multi-room live chat + real-time game feed + rain system
 * Security: XSS sanitization, rate limiting, input validation
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

type VipTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

const VIP_ORDER: VipTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];
const VIP_COLORS: Record<VipTier, string> = {
  bronze: "#cd7f32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#e5e4e2", diamond: "#b9f2ff",
};

interface UserSession {
  userId: number;
  username: string;
  vipTier: VipTier;
  avatarUrl?: string;
  lastMessage: number;   // timestamp for rate limiting
  messageCount: number;
}

interface ChatMsg {
  id: string;
  userId: number;
  username: string;
  vipTier: VipTier;
  avatarUrl?: string;
  message: string;
  room: string;
  timestamp: Date;
}

interface FeedEntry {
  username: string;
  game: string;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  win: boolean;
  timestamp: Date;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

const userSessions = new Map<string, UserSession>();
const recentFeed: FeedEntry[] = [];     // last 50 bets
const onlineCount: Record<string, number> = { global: 0 };
const rainPool = { amount: 0, participants: new Set<number>() };

// ─── Sanitize ─────────────────────────────────────────────────────────────────

/** Strip all HTML tags and dangerous chars — server-side XSS guard */
function sanitize(raw: string): string {
  return raw
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;")
    .replace(/\0/g, "")
    .trim()
    .slice(0, 500);
}

/** Validate room name is allowed */
function isValidRoom(room: string): boolean {
  return ["global", "bronze", "silver", "gold", "platinum", "diamond"].includes(room);
}

/** Check if user's VIP tier allows them to write in a given room */
function canWriteInRoom(userTier: VipTier, room: string): boolean {
  if (room === "global") return true;
  const userIdx = VIP_ORDER.indexOf(userTier);
  const roomIdx = VIP_ORDER.indexOf(room as VipTier);
  return roomIdx !== -1 && userIdx >= roomIdx;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getUserProfile(userId: number): Promise<{ vipTier: VipTier; avatarUrl?: string } | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const res = await db.execute(
      sql`SELECT vipTier, avatarUrl FROM userProfiles WHERE userId = ${userId} LIMIT 1`
    );
    const row = (res[0] as any[])?.[0];
    return row ? { vipTier: row.vipTier || "bronze", avatarUrl: row.avatarUrl } : null;
  } catch {
    return null;
  }
}

async function saveMessage(
  userId: number, username: string, vipTier: VipTier,
  message: string, room: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(
      sql`INSERT INTO chatMessages (userId, username, message, room, vipTier, createdAt)
          VALUES (${userId}, ${username}, ${message}, ${room}, ${vipTier}, NOW())`
    );
  } catch (err) {
    console.error("[Socket] Failed to save message:", err);
  }
}

async function getRecentMessages(room: string, limit = 50): Promise<ChatMsg[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const res = await db.execute(
      sql`SELECT id, userId, username, vipTier, message, room, createdAt
          FROM chatMessages WHERE room = ${room}
          ORDER BY createdAt DESC LIMIT ${limit}`
    );
    return ((res[0] as any[]) || []).reverse().map((r: any) => ({
      id: String(r.id),
      userId: r.userId,
      username: r.username,
      vipTier: r.vipTier || "bronze",
      message: r.message,
      room: r.room,
      timestamp: new Date(r.createdAt),
    }));
  } catch {
    return [];
  }
}

// ─── Initialize Socket.IO ────────────────────────────────────────────────────

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const origins = [
    "https://cloutscape.org",
    "https://www.cloutscape.org",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    ...(process.env.CORS_ORIGINS?.split(",").map(o => o.trim()) || []),
  ];

  const io = new SocketIOServer(httpServer, {
    cors: { origin: origins, credentials: true },
    transports: ["websocket", "polling"],
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const userId = parseInt(socket.handshake.auth.userId);
    const username = String(socket.handshake.auth.username || "").trim().slice(0, 64);

    if (!userId || !username) {
      // Allow unauthenticated as "viewer" (read-only)
      (socket as any)._viewer = true;
      return next();
    }

    const profile = await getUserProfile(userId);
    userSessions.set(socket.id, {
      userId,
      username,
      vipTier: profile?.vipTier || "bronze",
      avatarUrl: profile?.avatarUrl,
      lastMessage: 0,
      messageCount: 0,
    });
    next();
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on("connection", async (socket: Socket) => {
    const session = userSessions.get(socket.id);

    // Join global room by default
    socket.join("room:global");
    onlineCount["global"] = (onlineCount["global"] || 0) + 1;

    // Also join VIP tier room if authenticated
    if (session) {
      socket.join(`room:${session.vipTier}`);
      onlineCount[session.vipTier] = (onlineCount[session.vipTier] || 0) + 1;
    }

    // Send recent history for global room
    const history = await getRecentMessages("global", 50);
    socket.emit("chat:history", { room: "global", messages: history });

    // Send current feed
    socket.emit("feed:history", recentFeed.slice(-20));

    // Broadcast online counts
    io.emit("chat:online", onlineCount);

    // ── chat:message ─────────────────────────────────────────────────────────
    socket.on("chat:message", async (data: { message: string; room?: string }) => {
      if (!session) {
        socket.emit("chat:error", { message: "Please log in to chat", code: "NOT_AUTH" });
        return;
      }

      const room = isValidRoom(data?.room || "global") ? (data.room || "global") : "global";

      // Check write permission for tier rooms
      if (!canWriteInRoom(session.vipTier, room)) {
        socket.emit("chat:error", {
          message: `You need ${room} VIP or higher to chat here`,
          code: "TIER_REQUIRED",
        });
        return;
      }

      // Rate limit: max 2 messages per second per user
      const now = Date.now();
      if (now - session.lastMessage < 500) {
        socket.emit("chat:error", { message: "Slow down!", code: "RATE_LIMIT" });
        return;
      }
      session.lastMessage = now;

      // Sanitize message (XSS guard)
      const sanitized = sanitize(data?.message || "");
      if (!sanitized || sanitized.length < 1) return;

      await saveMessage(session.userId, session.username, session.vipTier, sanitized, room);

      const msg: ChatMsg = {
        id: `${session.userId}-${now}`,
        userId: session.userId,
        username: session.username,
        vipTier: session.vipTier,
        avatarUrl: session.avatarUrl,
        message: sanitized,
        room,
        timestamp: new Date(),
      };

      io.to(`room:${room}`).emit("chat:message", msg);
    });

    // ── chat:join_room ────────────────────────────────────────────────────────
    socket.on("chat:join_room", async (room: string) => {
      if (!isValidRoom(room)) return;
      socket.join(`room:${room}`);
      const history = await getRecentMessages(room, 50);
      socket.emit("chat:history", { room, messages: history });
    });

    // ── rain:participate ──────────────────────────────────────────────────────
    socket.on("rain:participate", () => {
      if (!session) return;
      rainPool.participants.add(session.userId);
      io.emit("rain:updated", {
        poolAmount: rainPool.amount,
        participantCount: rainPool.participants.size,
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      onlineCount["global"] = Math.max(0, (onlineCount["global"] || 1) - 1);
      if (session) {
        onlineCount[session.vipTier] = Math.max(0, (onlineCount[session.vipTier] || 1) - 1);
        rainPool.participants.delete(session.userId);
      }
      userSessions.delete(socket.id);
      io.emit("chat:online", onlineCount);
    });
  });

  return io;
}

// ─── Global IO ref ───────────────────────────────────────────────────────────

let globalIO: SocketIOServer | null = null;

export function setGlobalIO(io: SocketIOServer) { globalIO = io; }
export function getGlobalIO(): SocketIOServer | null { return globalIO; }

// ─── Broadcast game result to all clients (called from walletGameRouter) ────

export function broadcastGameResult(
  username: string, game: string, betAmount: number,
  multiplier: number, winAmount: number, win: boolean
) {
  if (!globalIO) return;

  const entry: FeedEntry = { username, game, betAmount, multiplier, winAmount, win, timestamp: new Date() };

  // Keep last 50
  recentFeed.push(entry);
  if (recentFeed.length > 50) recentFeed.shift();

  globalIO.emit("feed:bet", entry);

  // Big win announcement (≥$500)
  if (win && winAmount >= 500) {
    globalIO.emit("feed:bigwin", {
      username,
      game,
      winAmount,
      multiplier,
      message: `${username} just won $${winAmount.toFixed(2)} at ${multiplier}x on ${game}!`,
    });
  }
}

export function broadcastRainUpdate(amount: number, participantCount: number) {
  rainPool.amount = amount;
  if (globalIO) {
    globalIO.emit("rain:updated", { poolAmount: amount, participantCount });
  }
}
