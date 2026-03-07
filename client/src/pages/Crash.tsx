import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ArrowLeft, Zap, Shield, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const GLASS_CARD = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

type GameState = "idle" | "playing" | "result";
type ChartPoint = { t: number; mult: number };

const HISTORY_SAMPLE = [
  { point: 1.23, win: false }, { point: 4.51, win: true }, { point: 1.05, win: false },
  { point: 12.3, win: true }, { point: 2.10, win: true }, { point: 1.01, win: false },
  { point: 8.92, win: true }, { point: 1.44, win: false }, { point: 3.21, win: true },
  { point: 21.5, win: true },
];

export default function Crash() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState(10);
  const [cashoutAt, setCashoutAt] = useState(2.0);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [chartData, setChartData] = useState<ChartPoint[]>([{ t: 0, mult: 1 }]);
  const [liveMultiplier, setLiveMultiplier] = useState(1.0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [history, setHistory] = useState(HISTORY_SAMPLE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: walletData, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const balance = parseFloat(walletData?.balance ?? "0");

  const playCrash = trpc.games.playCrash.useMutation({
    onSuccess: (data) => {
      setGameResult(data);
      animateCrash(data.result.crashPoint, data.win, data.result.cashoutAt);
      refetchBalance();
    },
    onError: (e) => {
      alert(e.message);
      setGameState("idle");
    },
  });

  const animateCrash = useCallback((crashPoint: number, won: boolean, cashout: number) => {
    let current = 1.0;
    let t = 0;
    const target = won ? cashout : crashPoint;

    intervalRef.current = setInterval(() => {
      current = parseFloat((current * 1.04).toFixed(2));
      t += 100;

      setLiveMultiplier(current);
      setChartData(prev => [...prev, { t, mult: current }]);

      if (current >= target) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLiveMultiplier(target);
        setChartData(prev => [...prev, { t: t + 100, mult: target }]);
        setTimeout(() => {
          setGameState("result");
          setHistory(prev => [{ point: crashPoint, win: won }, ...prev.slice(0, 9)]);
        }, 500);
      }
    }, 80);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const placeBet = () => {
    if (!user) { setLocation("/login"); return; }
    if (betAmount > balance) { alert("Insufficient balance"); return; }
    setGameState("playing");
    setChartData([{ t: 0, mult: 1 }]);
    setLiveMultiplier(1.0);
    setGameResult(null);
    playCrash.mutate({ betAmount, currency: "crypto", cashoutAt });
  };

  const reset = () => {
    setGameState("idle");
    setChartData([{ t: 0, mult: 1 }]);
    setLiveMultiplier(1.0);
    setGameResult(null);
  };

  const multiplierColor =
    gameState === "result" && gameResult?.win ? "#4ade80" :
    gameState === "result" ? "#f87171" :
    liveMultiplier >= cashoutAt ? "#4ade80" :
    liveMultiplier > 3 ? "#fbbf24" :
    "#FFD700";

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Crash</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Live Multiplier</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-bold text-amber-400" data-testid="crash-balance">${balance.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Main Game Area */}
          <div className="md:col-span-2 space-y-5">

            {/* Multiplier Display */}
            <div className="relative overflow-hidden p-8 text-center" style={{ ...GLASS_CARD, minHeight: "280px" }}>
              <div
                className="absolute inset-0 opacity-5"
                style={{ background: `radial-gradient(ellipse at center,${multiplierColor},transparent)` }}
              />

              <AnimatePresence mode="wait">
                {gameState === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48">
                    <TrendingUp className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-gray-500">Place your bet to start</p>
                    <p className="text-sm text-gray-600 mt-1">Cashout before the rocket crashes</p>
                  </motion.div>
                )}

                {(gameState === "playing" || gameState === "result") && (
                  <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div
                      className="text-[90px] font-black leading-none mb-2"
                      style={{
                        color: multiplierColor,
                        fontFamily: "'Space Grotesk', sans-serif",
                        filter: `drop-shadow(0 0 40px ${multiplierColor}60)`,
                        transition: "color 0.3s",
                      }}
                      data-testid="crash-multiplier"
                    >
                      {liveMultiplier.toFixed(2)}x
                    </div>

                    {gameState === "result" && gameResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 mt-2"
                        style={{
                          background: gameResult.win ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                          border: `1px solid ${gameResult.win ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                        }}
                      >
                        {gameResult.win ? (
                          <div>
                            <p className="text-green-400 font-black text-2xl">CASHED OUT!</p>
                            <p className="text-green-300 text-xl font-bold">+${gameResult.winAmount.toFixed(2)}</p>
                            <p className="text-green-600 text-sm">at {gameResult.result.cashoutAt}x · Crashed @ {gameResult.result.crashPoint.toFixed(2)}x</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-red-400 font-black text-2xl">CRASHED!</p>
                            <p className="text-red-300">Crashed @ {gameResult.result.crashPoint.toFixed(2)}x</p>
                            <p className="text-red-600 text-sm">Your cashout: {gameResult.result.cashoutAt}x was too high</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chart */}
            {(gameState === "playing" || gameState === "result") && chartData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4"
                style={GLASS_CARD}
              >
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#0e0e16", border: "1px solid rgba(255,215,0,0.2)", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "#6b7280" }}
                      formatter={(v: number) => [`${v.toFixed(2)}x`, "Multiplier"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="mult"
                      stroke={multiplierColor}
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* History */}
            <div className="p-4" style={GLASS_CARD}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Crash Points</h3>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 10).map((h, i) => (
                  <span key={i}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: h.point >= 2 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                      color: h.point >= 2 ? "#4ade80" : "#f87171",
                      border: `1px solid ${h.point >= 2 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                    }}
                  >{h.point.toFixed(2)}x</span>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="p-5 space-y-4" style={GLASS_CARD}>

              {/* Bet Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Bet Amount</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                  disabled={gameState === "playing"}
                  className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                  min="0.01" step="0.01"
                  data-testid="crash-bet-input"
                />
                <div className="flex gap-2 mt-2">
                  {[["½", () => setBetAmount(v => parseFloat((v/2).toFixed(2)))],
                    ["2×", () => setBetAmount(v => parseFloat((v*2).toFixed(2)))],
                    ["Max", () => setBetAmount(balance)]].map(([l, fn]) => (
                    <button key={l as string} onClick={fn as any} disabled={gameState === "playing"}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 border border-gray-800 hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40"
                    >{l as string}</button>
                  ))}
                </div>
              </div>

              {/* Cashout */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Auto Cashout At</label>
                <input
                  type="number"
                  value={cashoutAt}
                  onChange={e => setCashoutAt(Math.max(1.01, Number(e.target.value)))}
                  disabled={gameState === "playing"}
                  className="w-full bg-transparent border border-green-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-green-500/60 disabled:opacity-50"
                  min="1.01" step="0.01"
                  data-testid="crash-cashout-input"
                />
                <div className="flex gap-2 mt-2">
                  {[1.5, 2, 5, 10].map(v => (
                    <button key={v} onClick={() => setCashoutAt(v)} disabled={gameState === "playing"}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 border border-gray-800 hover:border-green-500/30 hover:text-green-400 transition-all disabled:opacity-40"
                    >{v}x</button>
                  ))}
                </div>
              </div>

              {/* Potential Payout */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.1)" }}>
                <div className="text-xs text-gray-500 mb-1">Potential Payout</div>
                <div className="text-2xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ${(betAmount * cashoutAt).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">at {cashoutAt}x cashout</div>
              </div>

              {/* Action Button */}
              {gameState === "idle" ? (
                <motion.button
                  data-testid="crash-play-btn"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={placeBet}
                  disabled={!user || betAmount > balance}
                  className="w-full py-4 rounded-xl font-black text-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 30px rgba(255,215,0,0.3)" }}
                >
                  <Zap className="w-5 h-5" /> Place Bet
                </motion.button>
              ) : gameState === "playing" ? (
                <div className="w-full py-4 rounded-xl text-center font-bold text-amber-400 border border-amber-500/30 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Rocket in flight...
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  className="w-full py-4 rounded-xl font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
                >
                  Play Again
                </motion.button>
              )}
            </div>

            {/* How it works */}
            <div className="p-5 text-sm" style={GLASS_CARD}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider">How Crash Works</h3>
              </div>
              <ul className="space-y-2 text-gray-500 text-xs leading-relaxed">
                <li>Set your cashout multiplier before placing your bet</li>
                <li>The multiplier rises from 1.00x</li>
                <li>If it reaches your cashout → you win</li>
                <li>If it crashes before → you lose your bet</li>
                <li>Crash point is provably fair via HMAC-SHA256</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
