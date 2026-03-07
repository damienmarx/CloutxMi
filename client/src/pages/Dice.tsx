import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, TrendingUp, TrendingDown, Target, ArrowLeft, Shield, RefreshCw } from "lucide-react";
import ProvablyFairSidebar from "@/components/ProvablyFairSidebar";

const GLASS_CARD = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

export default function Dice() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState<"high" | "low" | "mid" | "exact">("high");
  const [targetNumber, setTargetNumber] = useState(50);
  const [currency] = useState<"crypto" | "gp">("crypto");
  const [result, setResult] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);

  const { data: walletData, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();

  const playMutation = trpc.games.playDice.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsRolling(false);
      refetchBalance();
    },
    onError: (error) => {
      alert(error.message);
      setIsRolling(false);
    },
  });

  const handleRoll = () => {
    if (!user) { setLocation("/login"); return; }
    setIsRolling(true);
    setResult(null);
    playMutation.mutate({
      betAmount,
      currency,
      gameData: { prediction, target: prediction === "exact" ? targetNumber : undefined },
    });
  };

  const multiplierLabel = { high: "1.98x", low: "1.98x", mid: "9.0x", exact: "100x" }[prediction];

  const modes = [
    { key: "high",  label: "High",  sub: ">50",    multi: "1.98x", icon: TrendingUp,   color: "#4ade80" },
    { key: "low",   label: "Low",   sub: "<50",    multi: "1.98x", icon: TrendingDown, color: "#f87171" },
    { key: "mid",   label: "Mid",   sub: "45-55",  multi: "9.0x",  icon: Target,       color: "#60a5fa" },
    { key: "exact", label: "Exact", sub: "= #",    multi: "100x",  icon: Dices,        color: "#c084fc" },
  ] as const;

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Dice</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Provably Fair</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-bold text-amber-400" data-testid="balance-display">
              ${parseFloat(walletData?.balance ?? "0").toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Controls - 2 cols */}
          <div className="md:col-span-2 space-y-5">

            {/* Bet Amount */}
            <div className="p-5" style={GLASS_CARD}>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-amber-500/60"
                min="0.01" step="0.01"
                data-testid="bet-amount-input"
              />
              <div className="flex gap-2 mt-3">
                {[["½", () => setBetAmount(v => Math.max(0.01, parseFloat((v / 2).toFixed(2))))],
                  ["2×", () => setBetAmount(v => parseFloat((v * 2).toFixed(2)))],
                  ["$100", () => setBetAmount(100)],
                  ["Max", () => setBetAmount(parseFloat(walletData?.balance ?? "0"))]].map(([label, fn]) => (
                  <button
                    key={label as string}
                    onClick={fn as () => void}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-400 border border-gray-700 hover:border-amber-500/40 hover:text-amber-400 transition-all"
                  >{label as string}</button>
                ))}
              </div>
            </div>

            {/* Prediction */}
            <div className="p-5" style={GLASS_CARD}>
              <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Prediction</label>
              <div className="grid grid-cols-2 gap-3">
                {modes.map(({ key, label, sub, multi, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setPrediction(key)}
                    data-testid={`prediction-${key}`}
                    className="py-4 rounded-xl font-semibold transition-all text-left px-4"
                    style={{
                      background: prediction === key ? `${color}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${prediction === key ? color : "rgba(255,255,255,0.08)"}`,
                      boxShadow: prediction === key ? `0 0 20px ${color}30` : "none",
                    }}
                  >
                    <Icon className="w-4 h-4 mb-2" style={{ color: prediction === key ? color : "#6b7280" }} />
                    <div className="text-sm font-bold" style={{ color: prediction === key ? color : "#9ca3af" }}>{label}</div>
                    <div className="text-xs text-gray-600">{sub}</div>
                    <div className="text-xs font-bold mt-1" style={{ color: prediction === key ? color : "#6b7280" }}>{multi}</div>
                  </button>
                ))}
              </div>

              {prediction === "exact" && (
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-2">Target (1-100)</label>
                  <input
                    type="number" min="1" max="100"
                    value={targetNumber}
                    onChange={e => setTargetNumber(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-transparent border border-purple-500/30 rounded-lg px-4 py-2 text-lg font-bold text-white focus:outline-none focus:border-purple-500/60"
                  />
                </div>
              )}
            </div>

            {/* Roll Button */}
            <motion.button
              data-testid="roll-dice-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRoll}
              disabled={isRolling || !user}
              className="w-full py-5 rounded-xl font-black text-xl text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 40px rgba(255,215,0,0.3)" }}
            >
              {isRolling
                ? <><RefreshCw className="w-5 h-5 animate-spin" /> Rolling...</>
                : <><Dices className="w-5 h-5" /> Roll Dice · {multiplierLabel}</>}
            </motion.button>
          </div>

          {/* Result Display - 3 cols */}
          <div className="md:col-span-3 space-y-5">
            <div className="p-8 text-center" style={{ ...GLASS_CARD, minHeight: "300px" }}>
              <AnimatePresence mode="wait">
                {!result && !isRolling && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-48 gap-4"
                  >
                    <Dices className="w-20 h-20 text-gray-700" />
                    <p className="text-gray-600">Place your bet and roll</p>
                  </motion.div>
                )}

                {isRolling && (
                  <motion.div
                    key="rolling"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-48"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Dices className="w-20 h-20 text-amber-400" />
                    </motion.div>
                    <p className="text-amber-400 mt-4 font-bold">Rolling the dice...</p>
                  </motion.div>
                )}

                {result && !isRolling && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      className="text-[120px] font-black leading-none mb-4"
                      style={{ color: result.win ? "#4ade80" : "#f87171", fontFamily: "'Space Grotesk', sans-serif", filter: `drop-shadow(0 0 30px ${result.win ? "#4ade80" : "#f87171"})` }}
                      animate={result.win ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {result.result.roll}
                    </motion.div>

                    <div
                      className="rounded-2xl p-5 mb-4"
                      style={{
                        background: result.win ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                        border: `1px solid ${result.win ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                      }}
                    >
                      {result.win ? (
                        <>
                          <div className="text-3xl font-black text-green-400 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            YOU WON!
                          </div>
                          <div className="text-2xl font-bold text-green-300">+${result.winAmount.toFixed(2)}</div>
                          <div className="text-sm text-green-600 mt-1">{result.multiplier}x multiplier</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-black text-red-400 mb-1">Better Luck Next Roll</div>
                          <div className="text-gray-500 text-sm">Keep trying — your big win is coming</div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/5">
                      <span className="text-gray-500 text-sm">New Balance</span>
                      <span className="font-bold text-amber-400 text-lg">${result.newBalance.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* How to Play */}
            <div className="p-5" style={GLASS_CARD}>
              <h3 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider">How to Play</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {modes.map(({ label, sub, multi, color }) => (
                  <div key={label} className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span><strong className="text-white">{label}</strong> {sub} → <strong style={{ color }}>{multi}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verifier toggle */}
            {result && (
              <button
                onClick={() => setShowVerifier(!showVerifier)}
                className="w-full py-3 rounded-xl text-sm font-medium text-gray-400 border border-gray-700 hover:border-amber-500/40 hover:text-amber-400 transition-all flex items-center justify-center gap-2"
                data-testid="verify-result-btn"
              >
                <Shield className="w-4 h-4" /> Verify This Result
              </button>
            )}
          </div>
        </div>
      </div>

      {result && showVerifier && (
        <ProvablyFairSidebar
          serverSeedHash={result.serverSeedHash}
          clientSeed={result.clientSeed}
          nonce={result.nonce}
          result={result.result}
          gameType="DICE"
          isRevealed={true}
          serverSeed={result.serverSeed}
        />
      )}
    </div>
  );
}
