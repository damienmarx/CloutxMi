/**
 * Degens¤Den — Live Feed
 * Real-time bet feed via Socket.IO — shows all players' bets live
 */
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, TrendingUp, Triangle, LayoutGrid, Rows3, Spade, Circle, Star, Zap } from "lucide-react";

interface FeedEntry {
  username: string;
  game: string;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  win: boolean;
  timestamp: Date | string;
}

const GAME_ICONS: Record<string, React.ElementType> = {
  Dice: Dices, Crash: TrendingUp, Plinko: Triangle, Keno: LayoutGrid,
  Limbo: Zap, Wheel: Star, Slots: Rows3, Blackjack: Spade, Roulette: Circle,
};

const GAME_COLORS: Record<string, string> = {
  Dice: "#60a5fa", Crash: "#4ade80", Plinko: "#FFD700", Keno: "#c084fc",
  Limbo: "#f87171", Wheel: "#fbbf24", Slots: "#34d399", Blackjack: "#818cf8", Roulette: "#fb7185",
};

let liveFeedSocket: Socket | null = null;
function getLiveFeedSocket(): Socket {
  if (!liveFeedSocket) {
    liveFeedSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 2000,
    });
  }
  return liveFeedSocket;
}

interface LiveFeedProps {
  compact?: boolean;
  maxEntries?: number;
}

export default function LiveFeed({ compact = false, maxEntries = 15 }: LiveFeedProps) {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getLiveFeedSocket();
    socketRef.current = socket;

    const handleHistory = (history: FeedEntry[]) => setFeed(history.slice(-maxEntries));
    const handleBet = (entry: FeedEntry) => {
      setFeed(prev => [entry, ...prev].slice(0, maxEntries));
    };

    socket.on("feed:history", handleHistory);
    socket.on("feed:bet", handleBet);

    return () => {
      socket.off("feed:history", handleHistory);
      socket.off("feed:bet", handleBet);
    };
  }, [maxEntries]);

  if (feed.length === 0 && compact) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(14,14,22,0.7)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,215,0,0.12)",
      }}
    >
      {!compact && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,215,0,0.08)]">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Live Feed</span>
        </div>
      )}

      <div className={compact ? "max-h-48 overflow-y-auto" : "max-h-72 overflow-y-auto"}>
        {feed.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-6">
            <Dices className="w-6 h-6 mx-auto mb-1 opacity-30" />
            <p>Waiting for bets...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {feed.map((entry, i) => {
              const Icon = GAME_ICONS[entry.game] || Dices;
              const color = GAME_COLORS[entry.game] || "#FFD700";
              const profit = entry.winAmount - entry.betAmount;

              return (
                <motion.div
                  key={`${entry.username}-${String(entry.timestamp)}-${i}`}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 hover:bg-white/3 transition-colors"
                  data-testid="feed-entry"
                >
                  {/* Game icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-white truncate">{entry.username}</span>
                      <span className="text-[10px] text-gray-500 shrink-0">{entry.game}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      ${entry.betAmount.toFixed(2)} bet
                      {entry.multiplier > 0 && <span className="ml-1 text-gray-400">@ {entry.multiplier.toFixed(2)}x</span>}
                    </div>
                  </div>

                  {/* Result */}
                  <div className="text-right shrink-0">
                    {entry.win ? (
                      <div className="text-green-400 text-xs font-bold">
                        +${profit.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-gray-600 text-xs">
                        -${entry.betAmount.toFixed(2)}
                      </div>
                    )}
                    <div
                      className="text-[10px] font-semibold"
                      style={{ color: entry.win ? "#4ade80" : "#6b7280" }}
                    >
                      {entry.win ? "WIN" : "LOSS"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
