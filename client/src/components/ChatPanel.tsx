/**
 * Degens¤Den — Live Chat Panel
 * Multi-room: Global + VIP tier rooms
 * XSS-safe: all messages HTML-escaped before display
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, X, ChevronDown, Users, Globe,
  Crown, Shield, Zap, Circle
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type VipTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
type Room = "global" | VipTier;

interface ChatMessage {
  id: string;
  userId: number;
  username: string;
  vipTier: VipTier;
  avatarUrl?: string;
  message: string;
  room: string;
  timestamp: Date | string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const VIP_COLORS: Record<VipTier, string> = {
  bronze: "#cd7f32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#e5e4e2", diamond: "#a5f3fc",
};

const VIP_ORDER: VipTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];

const ROOMS: Array<{ id: Room; label: string; icon: React.ElementType; minTier?: VipTier }> = [
  { id: "global",   label: "Global",   icon: Globe },
  { id: "bronze",   label: "Bronze",   icon: Crown, minTier: "bronze" },
  { id: "silver",   label: "Silver",   icon: Crown, minTier: "silver" },
  { id: "gold",     label: "Gold",     icon: Crown, minTier: "gold" },
  { id: "platinum", label: "Platinum", icon: Shield, minTier: "platinum" },
  { id: "diamond",  label: "Diamond",  icon: Zap, minTier: "diamond" },
];

/** Escape HTML to prevent XSS — client-side second layer */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function canAccessRoom(userTier: VipTier, roomId: Room): boolean {
  if (roomId === "global") return true;
  const userIdx = VIP_ORDER.indexOf(userTier);
  const roomIdx = VIP_ORDER.indexOf(roomId as VipTier);
  return roomIdx !== -1 && userIdx >= roomIdx;
}

function formatTime(ts: Date | string): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Create a Socket.IO connection with proper auth passed in handshake.
 * The server's auth middleware reads socket.handshake.auth at connection time.
 * We do NOT use a module-level singleton so each ChatPanel mount gets a fresh
 * authenticated connection tied to the current user session.
 */
function createSocket(auth: { userId?: number; username?: string }): Socket {
  return io(window.location.origin, {
    auth,
    transports: ["websocket", "polling"],
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { user, isAuthenticated } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room>("global");
  const [messages, setMessages] = useState<Record<Room, ChatMessage[]>>({ global: [], bronze: [], silver: [], gold: [], platinum: [], diamond: [] });
  const [input, setInput] = useState("");
  const [onlineCount, setOnlineCount] = useState<Record<string, number>>({ global: 0 });
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: walletData } = trpc.wallet.getBalance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: playerStats } = trpc.wallet.getPlayerStats.useQuery(undefined, { enabled: isAuthenticated });
  const userTier: VipTier = (playerStats?.vipTier as VipTier) || "bronze";

  // ── Socket connection ────────────────────────────────────────────────────────
  useEffect(() => {
    // Create socket with auth embedded in handshake (server reads handshake.auth)
    const socket = createSocket(
      isAuthenticated && user
        ? { userId: user.id, username: user.username }
        : {}
    );
    socketRef.current = socket;

    // Authenticate on connect
    const handleConnect = () => {
      setConnected(true);
    };
    const handleDisconnect = () => setConnected(false);

    const handleHistory = ({ room, messages: msgs }: { room: Room; messages: ChatMessage[] }) => {
      setMessages(prev => ({ ...prev, [room]: msgs }));
    };

    const handleMessage = (msg: ChatMessage) => {
      setMessages(prev => ({
        ...prev,
        [msg.room]: [...(prev[msg.room as Room] || []).slice(-99), msg],
      }));
    };

    const handleOnline = (counts: Record<string, number>) => setOnlineCount(counts);

    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat:history", handleHistory);
    socket.on("chat:message", handleMessage);
    socket.on("chat:online", handleOnline);
    socket.on("chat:error", handleError);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("chat:history", handleHistory);
      socket.off("chat:message", handleMessage);
      socket.off("chat:online", handleOnline);
      socket.off("chat:error", handleError);
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentRoom]);

  // ── Join room ────────────────────────────────────────────────────────────────
  const joinRoom = useCallback((room: Room) => {
    setCurrentRoom(room);
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:join_room", room);
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!isAuthenticated) { setError("Log in to chat"); return; }
    const trimmed = input.trim();
    if (!trimmed || !socketRef.current?.connected) return;
    socketRef.current.emit("chat:message", { message: trimmed, room: currentRoom });
    setInput("");
  }, [input, currentRoom, isAuthenticated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const roomMessages = messages[currentRoom] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          data-testid="chat-panel"
          className="fixed right-0 top-0 bottom-0 w-80 z-50 flex flex-col"
          style={{
            background: "rgba(8,8,14,0.98)",
            backdropFilter: "blur(24px)",
            borderLeft: "1px solid rgba(255,215,0,0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,215,0,0.1)]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live Chat</span>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Circle className="w-2 h-2 fill-green-400" />
                <span>{onlineCount.global || 0}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Room Tabs */}
          <div className="flex overflow-x-auto border-b border-[rgba(255,215,0,0.08)] scrollbar-none">
            {ROOMS.map(room => {
              const canAccess = !room.minTier || canAccessRoom(userTier, room.id);
              const Icon = room.icon;
              return (
                <button
                  key={room.id}
                  onClick={() => canAccess && joinRoom(room.id)}
                  data-testid={`chat-room-${room.id}`}
                  disabled={!canAccess}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                  style={{
                    color: currentRoom === room.id
                      ? (room.minTier ? VIP_COLORS[room.minTier] : "#FFD700")
                      : canAccess ? "#9ca3af" : "#374151",
                    borderBottom: currentRoom === room.id
                      ? `2px solid ${room.minTier ? VIP_COLORS[room.minTier] : "#FFD700"}`
                      : "2px solid transparent",
                    opacity: canAccess ? 1 : 0.4,
                    cursor: canAccess ? "pointer" : "not-allowed",
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {room.label}
                  {room.minTier && canAccess && (
                    <span className="ml-1 text-[9px] opacity-60">{onlineCount[room.id] || 0}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {roomMessages.length === 0 && (
              <div className="text-center text-gray-600 text-xs mt-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {roomMessages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2"
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                  style={{ border: `1.5px solid ${VIP_COLORS[msg.vipTier] || "#cd7f32"}` }}
                >
                  {msg.avatarUrl ? (
                    <img src={msg.avatarUrl} alt={msg.username} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ background: "rgba(255,215,0,0.1)", color: VIP_COLORS[msg.vipTier] }}>
                      {msg.username.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className="text-xs font-bold truncate"
                      style={{ color: VIP_COLORS[msg.vipTier] || "#9ca3af" }}
                    >{msg.username}</span>
                    <span className="text-[10px] text-gray-600 ml-auto shrink-0">{formatTime(msg.timestamp)}</span>
                  </div>
                  {/* XSS-safe: render as text only */}
                  <p className="text-xs text-gray-300 break-words leading-relaxed">
                    {escHtml(msg.message)}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mx-3 mb-1 px-3 py-1.5 rounded text-xs text-red-400 bg-red-500/10 border border-red-500/20"
              >{error}</motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-3 border-t border-[rgba(255,215,0,0.1)]">
            {isAuthenticated ? (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={handleKeyDown}
                  placeholder={connected ? `Chat in ${currentRoom}...` : "Connecting..."}
                  disabled={!connected}
                  data-testid="chat-input"
                  maxLength={500}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !connected}
                  data-testid="chat-send-btn"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: input.trim() ? "linear-gradient(135deg,#FFD700,#B8860B)" : "rgba(255,255,255,0.05)" }}
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-500 py-2">
                <a href="/login" className="text-amber-400 hover:underline">Sign in</a> to chat
              </p>
            )}
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-700">
              <span>No profanity · Be respectful</span>
              <span>{input.length}/500</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
