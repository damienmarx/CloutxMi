import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft, Shield, RefreshCw, TrendingUp } from "lucide-react";

const GLASS = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

const HISTORY_SAMPLE = [
  { target: 2, result: 3.21, win: true }, { target: 5, result: 1.44, win: false },
  { target: 10, result: 15.8, win: true }, { target: 1.5, result: 1.2, win: false },
  { target: 3, result: 8.91, win: true },
];

export default function Limbo() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(2.0);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState(HISTORY_SAMPLE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayMult, setDisplayMult] = useState(1.0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: walletData, refetch } = trpc.wallet.getBalance.useQuery();
  const balance = parseFloat(walletData?.balance ?? "0");

  const playMutation = trpc.games.playLimbo.useMutation({
    onSuccess: (data) => {
      animateTo(data.resultMultiplier, data);
      setHistory(prev => [{ target, result: data.resultMultiplier, win: data.win }, ...prev.slice(0, 9)]);
      refetch();
    },
    onError: (e) => { alert(e.message); setIsPlaying(false); },
  });

  const animateTo = (finalMult: number, data: any) => {
    let current = 1.0;
    setDisplayMult(1.0);

    animRef.current = setInterval(() => {
      current = parseFloat((current * 1.06).toFixed(2));
      setDisplayMult(current);
      if (current >= finalMult) {
        if (animRef.current) clearInterval(animRef.current);
        setDisplayMult(finalMult);
        setTimeout(() => { setResult(data); setIsPlaying(false); }, 200);
      }
    }, 50);
  };

  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  const handlePlay = () => {
    if (!user) { setLocation("/login"); return; }
    if (betAmount > balance) { alert("Insufficient balance"); return; }
    setIsPlaying(true);
    setResult(null);
    setDisplayMult(1.0);
    playMutation.mutate({ betAmount, currency: "crypto", targetMultiplier: target });
  };

  const winChance = parseFloat(((0.97 / target) * 100).toFixed(2));
  const potentialWin = parseFloat((betAmount * target).toFixed(2));

  const multColor =
    isPlaying && displayMult >= target ? "#4ade80" :
    result?.win ? "#4ade80" :
    result && !result.win ? "#f87171" :
    displayMult > 3 ? "#fbbf24" : "#FFD700";

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Limbo</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Rising Multiplier</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-bold text-amber-400" data-testid="limbo-balance">${balance.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Main display */}
          <div className="md:col-span-2 space-y-5">

            {/* Multiplier card */}
            <div className="p-10 text-center relative overflow-hidden" style={{ ...GLASS, minHeight: "280px" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center,${multColor}10,transparent 70%)` }} />

              <AnimatePresence mode="wait">
                {!isPlaying && !result && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-40">
                    <TrendingUp className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-gray-500">Set your target and launch</p>
                  </motion.div>
                )}

                {(isPlaying || result) && (
                  <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.div
                      className="text-[100px] font-black leading-none mb-4"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: multColor,
                        filter: `drop-shadow(0 0 40px ${multColor}60)`,
                        transition: "color 0.2s",
                      }}
                      data-testid="limbo-multiplier"
                    >
                      {displayMult.toFixed(2)}x
                    </motion.div>

                    <div className="text-sm text-gray-500 mb-3">
                      Target: <span className="text-amber-400 font-bold">{target}x</span>
                    </div>

                    {result && !isPlaying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl p-4 mt-2 max-w-sm mx-auto"
                        style={{
                          background: result.win ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                          border: `1px solid ${result.win ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                        }}
                      >
                        {result.win ? (
                          <>
                            <div className="text-2xl font-black text-green-400">YOU WON!</div>
                            <div className="text-xl font-bold text-green-300">+${result.winAmount.toFixed(2)}</div>
                            <div className="text-sm text-green-600">at {target}x · Result was {result.resultMultiplier.toFixed(2)}x</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-black text-red-400">BUST!</div>
                            <div className="text-red-300 text-sm">Result: {result.resultMultiplier.toFixed(2)}x · Target: {target}x</div>
                          </>
                        )}
                        <div className="flex justify-between mt-3 px-3 py-2 rounded-lg bg-white/5">
                          <span className="text-gray-500 text-sm">Balance</span>
                          <span className="text-amber-400 font-bold">${result.newBalance.toFixed(2)}</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History */}
            <div className="p-4" style={GLASS}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Results</h3>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: h.win ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                      border: `1px solid ${h.win ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                      color: h.win ? "#4ade80" : "#f87171",
                    }}
                  >
                    <span>{h.result.toFixed(2)}x</span>
                    <span className="text-gray-600">/</span>
                    <span className="opacity-70">{h.target}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="p-5 space-y-4" style={GLASS}>

              {/* Bet Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Bet Amount</label>
                <input
                  type="number" value={betAmount} min="0.01" step="0.01"
                  onChange={e => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                  disabled={isPlaying}
                  data-testid="limbo-bet-input"
                  className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                />
                <div className="flex gap-2 mt-2">
                  {[["½", () => setBetAmount(v => parseFloat((v/2).toFixed(2)))],
                    ["2×", () => setBetAmount(v => parseFloat((v*2).toFixed(2)))],
                    ["Max", () => setBetAmount(balance)]].map(([l, fn]) => (
                    <button key={l as string} onClick={fn as any} disabled={isPlaying}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 border border-gray-800 hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40"
                    >{l as string}</button>
                  ))}
                </div>
              </div>

              {/* Target Multiplier */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Target Multiplier</label>
                <input
                  type="number" value={target} min="1.01" step="0.01"
                  onChange={e => setTarget(Math.max(1.01, Number(e.target.value)))}
                  disabled={isPlaying}
                  data-testid="limbo-target-input"
                  className="w-full bg-transparent border border-green-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-green-500/60 disabled:opacity-50"
                />
                <div className="flex gap-2 mt-2">
                  {[1.5, 2, 5, 10, 100].map(v => (
                    <button key={v} onClick={() => setTarget(v)} disabled={isPlaying}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-500 border border-gray-800 hover:border-green-500/30 hover:text-green-400 transition-all disabled:opacity-40"
                    >{v}x</button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Win Chance</div>
                  <div className="text-lg font-black text-green-400">{winChance}%</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Potential Win</div>
                  <div className="text-lg font-black text-amber-400">${potentialWin}</div>
                </div>
              </div>

              {/* Play Button */}
              <motion.button
                data-testid="limbo-play-btn"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handlePlay}
                disabled={isPlaying || !user}
                className="w-full py-4 rounded-xl font-black text-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 30px rgba(255,215,0,0.3)" }}
              >
                {isPlaying
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Launching...</>
                  : <><Zap className="w-5 h-5" /> Launch Limbo</>}
              </motion.button>
            </div>

            {/* Info */}
            <div className="p-4 text-xs" style={GLASS}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-amber-500" />
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">How Limbo Works</span>
              </div>
              <ul className="space-y-1.5 text-gray-500 leading-relaxed">
                <li>Set any target multiplier (1.01x → 1,000,000x)</li>
                <li>Server generates a random result using HMAC-SHA256</li>
                <li>If result ≥ your target → you win at your exact target</li>
                <li>Win chance = 97% ÷ target multiplier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
