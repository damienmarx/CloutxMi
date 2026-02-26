import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Socket.IO Server for real-time communication
 * Handles: Live Chat, Rain Events, Game State Broadcasting
 */

interface UserSession {
  userId: number;
  username: string;
  canChat: boolean;
}

const userSessions = new Map<string, UserSession>();
const rainPool = { amount: 0, participants: new Set<number>() };

/**
 * Check if user meets chat requirements:
 * - Active account
 * - Deposited at least $10
 * - Wagered at least 10x their deposit
 */
async function canUserChat(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get wallet info
    const walletResult = await db.execute(
      sql`SELECT balance, totalDeposited FROM wallets WHERE userId = ${userId}`
    );
    const wallet = (walletResult[0] as any[])?.[0];

    if (!wallet || parseFloat(wallet.totalDeposited) < 10) {
      return false;
    }

    // Get user stats
    const statsResult = await db.execute(
      sql`SELECT totalWagered FROM userStats WHERE userId = ${userId}`
    );
    const stats = (statsResult[0] as any[])?.[0];

    if (!stats) return false;

    const totalWagered = parseFloat(stats.totalWagered);
    const totalDeposited = parseFloat(wallet.totalDeposited);
    const requiredWager = totalDeposited * 10;

    return totalWagered >= requiredWager;
  } catch (error) {
    console.error("[Socket] Error checking chat eligibility:", error);
    return false;
  }
}

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.DOMAIN || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  /**
   * Middleware: Authenticate socket connections
   */
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      const username = socket.handshake.auth.username;

      if (!userId || !username) {
        return next(new Error("Authentication failed"));
      }

      const canChat = await canUserChat(userId);
      userSessions.set(socket.id, { userId, username, canChat });

      next();
    } catch (error) {
      console.error("[Socket Auth] Error:", error);
      next(new Error("Authentication error"));
    }
  });

  /**
   * Connection handler
   */
  io.on("connection", (socket: Socket) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    console.log(`[Socket] User ${session.username} (${session.userId}) connected`);

    // Broadcast user joined
    io.emit("user:joined", {
      username: session.username,
      timestamp: new Date(),
      canChat: session.canChat,
    });

    /**
     * Chat message handler
     */
    socket.on("chat:message", async (message: string) => {
      const session = userSessions.get(socket.id);
      if (!session) return;

      // Verify chat eligibility
      if (!session.canChat) {
        socket.emit("chat:error", {
          message: "You must deposit $10 and wager 10x to chat",
          code: "CHAT_RESTRICTED",
        });
        return;
      }

      // Sanitize message
      const sanitized = message.trim().slice(0, 500);
      if (!sanitized) return;

      try {
        // Save to database
        const db = await getDb();
        if (db) {
          await db.execute(
            sql`INSERT INTO chatMessages (userId, username, message, createdAt) 
                VALUES (${session.userId}, ${session.username}, ${sanitized}, NOW())`
          );
        }

        // Broadcast to all connected clients
        io.emit("chat:message", {
          userId: session.userId,
          username: session.username,
          message: sanitized,
          timestamp: new Date(),
          canChat: session.canChat,
        });
      } catch (error) {
        console.error("[Socket Chat] Error saving message:", error);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    /**
     * Rain event handler
     */
    socket.on("rain:participate", () => {
      if (!session) return;
      rainPool.participants.add(session.userId);
      io.emit("rain:updated", {
        poolAmount: rainPool.amount,
        participantCount: rainPool.participants.size,
      });
    });

    /**
     * Disconnect handler
     */
    socket.on("disconnect", () => {
      userSessions.delete(socket.id);
      rainPool.participants.delete(session.userId);

      console.log(`[Socket] User ${session.username} disconnected`);

      io.emit("user:left", {
        username: session.username,
        timestamp: new Date(),
      });
    });
  });

  return io;
}

/**
 * Broadcast rain event to all connected clients
 */
export function broadcastRainUpdate(amount: number, participantCount: number) {
  rainPool.amount = amount;
  rainPool.participants.clear();
  // This will be called from the main app when rain events occur
}

/**
 * Broadcast game result to all connected clients
 */
export function broadcastGameResult(gameType: string, result: any) {
  // This will be called when a game completes
  const io = getGlobalIO();
  if (io) {
    io.emit("game:result", {
      gameType,
      result,
      timestamp: new Date(),
    });
  }
}

let globalIO: SocketIOServer | null = null;

export function setGlobalIO(io: SocketIOServer) {
  globalIO = io;
}

export function getGlobalIO(): SocketIOServer | null {
  return globalIO;
}
