/**
 * Degens¤Den — Keno
 * Pick 2-10 numbers from 1-40 · 10 drawn · HMAC-SHA256 provably fair
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, ArrowLeft, RefreshCw, Shield, Zap } from "lucide-react";

const GLASS = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

// Payout table mirrors backend exactly
const PAYOUT_TABLE: Record<number, Record<number, number>> = {
  2: { 2: 3.5 },
  3: { 2: 1.5, 3: 12 },
  4: { 2: 0.5, 3: 3, 4: 25 },
  5: { 2: 0.5, 3: 2, 4: 10, 5: 60 },
  6: { 3: 1, 4: 5, 5: 25, 6: 120 },
  7: { 3: 0.5, 4: 2, 5: 10, 6: 50, 7: 250 },
  8: { 4: 1, 5: 5, 6: 20, 7: 100, 8: 500 },
  9: { 4: 0.5, 5: 2, 6: 10, 7: 50, 8: 200, 9: 1000 },
  10: { 5: 1, 6: 5, 7: 25, 8: 100, 9: 400, 10: 2500 },
};

export default function KenoGame() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animatingDrawn, setAnimatingDrawn] = useState<number[]>([]);

  const { data: walletData, refetch } = trpc.wallet.getBalance.useQuery();
  const balance = parseFloat(walletData?.balance ?? "0");

  const playKeno = trpc.games.playKeno.useMutation({
    onSuccess: (data) => {
      // Animate each drawn number appearing one by one
      setAnimatingDrawn([]);
      const drawn: number[] = data.result.drawn;
      drawn.forEach((num, i) => {
        setTimeout(() => {
          setAnimatingDrawn(prev => [...prev, num]);
        }, i * 150 + 100);
      });
      // Show result after all numbers revealed
      setTimeout(() => {
        setResult(data);
        setIsPlaying(false);
        refetch();
      }, drawn.length * 150 + 500);
    },
    onError: (e) => {
      alert(e.message);
      setIsPlaying(false);
    },
  });

  const handleNumberClick = (num: number) => {
    if (isPlaying) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else if (selectedNumbers.length < 10) {
      setSelectedNumbers(prev => [...prev, num]);
    }
  };

  const handlePlay = () => {
    if (!user) { setLocation("/login"); return; }
    if (selectedNumbers.length < 2) { alert("Select at least 2 numbers"); return; }
    if (betAmount > balance) { alert("Insufficient balance"); return; }
    setIsPlaying(true);
    setResult(null);
    setAnimatingDrawn([]);
    playKeno.mutate({ betAmount, currency: "crypto", selectedNumbers });
  };

  const handleReset = () => {
    setSelectedNumbers([]);
    setResult(null);
    setAnimatingDrawn([]);
  };

  const quickPick = (count: number) => {
    const pool = Array.from({ length: 40 }, (_, i) => i + 1);
    const nums: number[] = [];
    while (nums.length < count) {
      const idx = Math.floor(Math.random() * pool.length);
      nums.push(pool.splice(idx, 1)[0]);
    }
    setSelectedNumbers(nums);
  };

  const picks = selectedNumbers.length;
  const payouts = picks >= 2 ? PAYOUT_TABLE[picks] : null;

  // Numbers drawn so far in animation OR full drawn from result
  const drawnSoFar: number[] = result
    ? (result.result.drawn as number[])
    : animatingDrawn;

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Keno</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Pick 2-10 Numbers · Provably Fair</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-bold text-amber-400" data-testid="keno-balance">
              ${balance.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Number Grid + Result */}
          <div className="lg:col-span-2 space-y-5">
            <div className="p-6" style={GLASS}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Pick Numbers (2-10)
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-400">{picks}/10 selected</span>
                  {picks > 0 && !isPlaying && (
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    >Clear</button>
                  )}
                </div>
              </div>

              {/* 8×5 grid for numbers 1-40 */}
              <div className="grid grid-cols-8 gap-1.5 mb-5">
                {Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
                  const isSelected = selectedNumbers.includes(num);
                  const isDrawn = drawnSoFar.includes(num);
                  const isMatch = isDrawn && isSelected;

                  return (
                    <motion.button
                      key={num}
                      data-testid={`keno-num-${num}`}
                      onClick={() => handleNumberClick(num)}
                      disabled={isPlaying}
                      whileHover={!isPlaying ? { scale: 1.1 } : {}}
                      whileTap={!isPlaying ? { scale: 0.92 } : {}}
                      animate={isMatch ? { scale: [1, 1.25, 1] } : isDrawn ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="aspect-square rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed select-none"
                      style={{
                        background: isMatch
                          ? "rgba(74,222,128,0.35)"
                          : isDrawn
                          ? "rgba(248,113,113,0.15)"
                          : isSelected
                          ? "rgba(255,215,0,0.22)"
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${
                          isMatch ? "#4ade80"
                          : isDrawn ? "rgba(248,113,113,0.5)"
                          : isSelected ? "rgba(255,215,0,0.7)"
                          : "rgba(255,255,255,0.08)"}`,
                        color: isMatch ? "#4ade80"
                          : isDrawn ? "#f87171"
                          : isSelected ? "#FFD700"
                          : "#6b7280",
                        boxShadow: isMatch
                          ? "0 0 14px rgba(74,222,128,0.3)"
                          : isSelected
                          ? "0 0 8px rgba(255,215,0,0.2)"
                          : "none",
                      }}
                    >{num}</motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ background: "rgba(255,215,0,0.22)", border: "1px solid rgba(255,215,0,0.7)" }} />
                  Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ background: "rgba(74,222,128,0.35)", border: "1px solid #4ade80" }} />
                  Match!
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.5)" }} />
                  Drawn (miss)
                </span>
              </div>
            </div>

            {/* Result Banner */}
            <AnimatePresence>
              {result && !isPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-2xl"
                  data-testid="keno-result"
                  style={{
                    background: result.win ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
                    border: `1px solid ${result.win ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div
                        className="text-2xl font-black mb-1"
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          color: result.win ? "#4ade80" : "#f87171",
                        }}
                      >
                        {result.result.matches} Match{result.result.matches !== 1 ? "es" : ""}
                        {result.win ? "!" : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        Drawn: {(result.result.drawn as number[]).slice().sort((a: number, b: number) => a - b).join(", ")}
                      </div>
                    </div>
                    <div className="text-right">
                      {result.win ? (
                        <>
                          <div className="text-3xl font-black text-green-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            +${result.winAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600">{result.multiplier}x payout</div>
                        </>
                      ) : (
                        <div className="text-xl font-bold text-red-400">No Payout</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 rounded-xl bg-white/5 text-sm">
                    <span className="text-gray-500">New Balance</span>
                    <span className="text-amber-400 font-bold">${result.newBalance.toFixed(2)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="p-5 space-y-4" style={GLASS}>

              {/* Bet Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Bet Amount</label>
                <input
                  type="number"
                  value={betAmount}
                  min="0.01" step="0.01"
                  onChange={e => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                  disabled={isPlaying}
                  data-testid="keno-bet-input"
                  className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                />
                <div className="flex gap-2 mt-2">
                  {[
                    ["½", () => setBetAmount(v => parseFloat((v / 2).toFixed(2)))],
                    ["2×", () => setBetAmount(v => parseFloat((v * 2).toFixed(2)))],
                    ["Max", () => setBetAmount(balance)],
                  ].map(([l, fn]) => (
                    <button
                      key={l as string}
                      onClick={fn as () => void}
                      disabled={isPlaying}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 border border-gray-800 hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40"
                    >{l as string}</button>
                  ))}
                </div>
              </div>

              {/* Quick Pick */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Quick Pick</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => quickPick(n)}
                      disabled={isPlaying}
                      className="py-2 rounded-lg text-xs font-bold text-gray-400 border border-gray-700 hover:border-amber-500/40 hover:text-amber-400 transition-all disabled:opacity-40"
                    >Pick {n}</button>
                  ))}
                </div>
              </div>

              {/* Play Button */}
              <motion.button
                data-testid="keno-play-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePlay}
                disabled={isPlaying || picks < 2 || !user}
                className="w-full py-4 rounded-xl font-black text-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#FFD700,#B8860B)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  boxShadow: "0 0 30px rgba(255,215,0,0.3)",
                }}
              >
                {isPlaying
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Drawing...</>
                  : <><Zap className="w-5 h-5" /> Play Keno ({picks}/10)</>}
              </motion.button>

              {picks < 2 && (
                <p className="text-center text-xs text-gray-600">Select at least 2 numbers to play</p>
              )}
            </div>

            {/* Payout Table for current pick count */}
            {payouts && (
              <div className="p-4" style={GLASS}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Payouts · {picks} picks
                </h3>
                <div className="space-y-1">
                  {Object.entries(payouts).map(([matches, mult]) => {
                    const isHit = result && result.result.matches === Number(matches);
                    return (
                      <div
                        key={matches}
                        className="flex justify-between text-xs py-1.5 px-3 rounded-lg transition-all"
                        style={{
                          background: isHit ? "rgba(255,215,0,0.12)" : "transparent",
                          border: `1px solid ${isHit ? "rgba(255,215,0,0.35)" : "transparent"}`,
                        }}
                      >
                        <span className="text-gray-500">{matches} matches</span>
                        <span className="font-bold text-amber-400">{mult}×</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="p-4 text-xs" style={GLASS}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-amber-500" />
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">How Keno Works</span>
              </div>
              <ul className="space-y-1.5 text-gray-500 leading-relaxed">
                <li>Pick 2–10 numbers from 1–40</li>
                <li>10 numbers are drawn randomly</li>
                <li>More matches → bigger multiplier</li>
                <li>All draws use HMAC-SHA256 provably fair RNG</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
