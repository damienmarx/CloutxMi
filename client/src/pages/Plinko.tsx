import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Triangle, ArrowLeft, Shield, RefreshCw } from "lucide-react";

const GLASS_CARD = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

type Risk = "low" | "medium" | "high";

const MULTIPLIER_TABLES: Record<Risk, number[]> = {
  low:    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  medium: [33, 11, 4, 2, 1.5, 1.3, 1.1, 1, 0.3, 1, 1.1, 1.3, 1.5, 2, 4, 11, 33],
  high:   [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
};

function getBucketColor(mult: number): string {
  if (mult >= 10) return "#FFD700";
  if (mult >= 3)  return "#f59e0b";
  if (mult >= 1)  return "#4ade80";
  return "#f87171";
}

// Build SVG Plinko board
const ROWS = 16;
const BOARD_W = 480;
const BOARD_H = 440;
const PEG_R = 4;
const BALL_R = 7;
const PAD_X = 24;
const PAD_Y = 24;
const USABLE_W = BOARD_W - PAD_X * 2;
const USABLE_H = BOARD_H - PAD_Y * 2;

function getPegPos(row: number, col: number) {
  const pegsInRow = row + 2;
  const spacing = USABLE_W / (pegsInRow - 1 + 1); // +1 for margins
  const x = PAD_X + spacing * (col + 0.5);
  const y = PAD_Y + (USABLE_H / (ROWS + 1)) * (row + 1);
  return { x, y };
}

function getBallPath(drops: number[]): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];
  // Start above board center
  path.push({ x: BOARD_W / 2, y: -BALL_R });

  let col = 0; // tracks which gap the ball is in
  for (let row = 0; row < drops.length; row++) {
    const pos = getPegPos(row, col);
    const nextY = pos.y + (USABLE_H / (ROWS + 1)) * 0.5;
    path.push({ x: pos.x + (drops[row] ? 0.5 : -0.5) * (USABLE_W / (row + 2 + 1)), y: nextY });
    if (drops[row] === 1) col++;
  }

  // Final bucket position
  const bucketIdx = col; // 0 to 16
  const bucketW = USABLE_W / 17;
  path.push({ x: PAD_X + bucketW * bucketIdx + bucketW / 2, y: BOARD_H + 10 });

  return path;
}

export default function Plinko() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState<Risk>("medium");
  const [isDropping, setIsDropping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ballPath, setBallPath] = useState<Array<{ x: number; y: number }>>([]);
  const [ballStep, setBallStep] = useState(-1);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [history, setHistory] = useState<Array<{ mult: number; bucket: number }>>([]);

  const { data: walletData, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const balance = parseFloat(walletData?.balance ?? "0");

  const playPlinko = trpc.games.playPlinko.useMutation({
    onSuccess: (data) => {
      setResult(data);
      refetchBalance();
      const path = getBallPath(data.result.drops);
      setBallPath(path);
      setBallStep(0);
      animateBall(path.length, data.result.bucket);
      setHistory(prev => [{ mult: data.multiplier, bucket: data.result.bucket }, ...prev.slice(0, 9)]);
    },
    onError: (e) => { alert(e.message); setIsDropping(false); },
  });

  const animateBall = (steps: number, bucket: number) => {
    let step = 0;
    stepRef.current = setInterval(() => {
      step++;
      setBallStep(step);
      if (step >= steps - 1) {
        if (stepRef.current) clearInterval(stepRef.current);
        setActiveBucket(bucket);
        setIsDropping(false);
      }
    }, 80);
  };

  useEffect(() => () => { if (stepRef.current) clearInterval(stepRef.current); }, []);

  const drop = () => {
    if (!user) { setLocation("/login"); return; }
    if (betAmount > balance) { alert("Insufficient balance"); return; }
    setIsDropping(true);
    setBallStep(-1);
    setBallPath([]);
    setActiveBucket(null);
    setResult(null);
    playPlinko.mutate({ betAmount, currency: "crypto", risk });
  };

  const multTable = MULTIPLIER_TABLES[risk];

  const ballPos = ballStep >= 0 && ballPath.length > 0 && ballStep < ballPath.length
    ? ballPath[ballStep]
    : null;

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Plinko</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · 16-Row Physics Board</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-bold text-amber-400" data-testid="plinko-balance">${balance.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Plinko Board */}
          <div className="md:col-span-2">
            <div className="p-4 overflow-hidden" style={GLASS_CARD}>

              {/* Result Banner */}
              <AnimatePresence>
                {result && !isDropping && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-4 rounded-xl text-center"
                    style={{
                      background: result.win ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                      border: `1px solid ${result.win ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                    }}
                  >
                    <div className="text-2xl font-black" style={{ color: getBucketColor(result.multiplier), fontFamily: "'Space Grotesk', sans-serif" }}>
                      {result.multiplier}x — {result.win ? "PROFIT!" : result.multiplier === 0.5 || result.multiplier <= 0.5 ? "BIG LOSS" : "Small Loss"}
                    </div>
                    <div className="text-sm mt-1" style={{ color: result.win ? "#4ade80" : "#f87171" }}>
                      {result.win ? `+$${(result.winAmount - betAmount).toFixed(2)} profit` : `-$${betAmount.toFixed(2)}`} · Bucket #{result.result.bucket + 1}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SVG Board */}
              <div className="relative flex justify-center">
                <svg
                  width="100%"
                  viewBox={`0 0 ${BOARD_W} ${BOARD_H + 60}`}
                  style={{ maxHeight: "520px" }}
                >
                  {/* Background gradient */}
                  <defs>
                    <radialGradient id="boardGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(255,215,0,0.03)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <rect width={BOARD_W} height={BOARD_H + 60} fill="url(#boardGlow)" rx="12" />

                  {/* Pegs */}
                  {Array.from({ length: ROWS }, (_, row) =>
                    Array.from({ length: row + 2 }, (_, col) => {
                      const { x, y } = getPegPos(row, col);
                      const isOnPath = ballPath.length > 0;
                      return (
                        <circle
                          key={`peg-${row}-${col}`}
                          cx={x} cy={y} r={PEG_R}
                          fill={isOnPath ? "rgba(255,215,0,0.7)" : "rgba(255,255,255,0.3)"}
                          filter={isOnPath ? "url(#glow)" : undefined}
                        />
                      );
                    })
                  )}

                  {/* Ball */}
                  {ballPos && (
                    <motion.circle
                      cx={ballPos.x}
                      cy={Math.min(ballPos.y, BOARD_H)}
                      r={BALL_R}
                      fill="#FFD700"
                      filter="url(#glow)"
                      style={{ boxShadow: "0 0 20px #FFD700" }}
                    />
                  )}

                  {/* Buckets */}
                  {multTable.map((mult, i) => {
                    const bucketW = USABLE_W / 17;
                    const bx = PAD_X + bucketW * i;
                    const by = BOARD_H + 4;
                    const isActive = activeBucket === i;
                    const color = getBucketColor(mult);

                    return (
                      <g key={`bucket-${i}`}>
                        <rect
                          x={bx + 1} y={by} width={bucketW - 2} height={44} rx={4}
                          fill={isActive ? color : `${color}20`}
                          stroke={color}
                          strokeWidth={isActive ? 2 : 0.5}
                          opacity={isActive ? 1 : 0.7}
                        />
                        <text
                          x={bx + bucketW / 2}
                          y={by + 16}
                          textAnchor="middle"
                          fontSize={mult >= 10 ? 8 : 9}
                          fontWeight="bold"
                          fill={isActive ? "#000" : color}
                        >
                          {mult >= 1 ? `${mult}x` : `.${String(mult).split(".")[1]}x`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* History Row */}
              {history.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {history.map((h, i) => (
                    <span key={i}
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ background: `${getBucketColor(h.mult)}18`, color: getBucketColor(h.mult), border: `1px solid ${getBucketColor(h.mult)}30` }}
                    >{h.mult}x</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="p-5 space-y-4" style={GLASS_CARD}>

              {/* Risk Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Risk Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as Risk[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setRisk(r)}
                      disabled={isDropping}
                      data-testid={`risk-${r}`}
                      className="py-3 rounded-lg text-xs font-bold capitalize transition-all disabled:opacity-40"
                      style={{
                        background: risk === r
                          ? r === "low" ? "rgba(74,222,128,0.2)" : r === "medium" ? "rgba(251,191,36,0.2)" : "rgba(239,68,68,0.2)"
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${risk === r
                          ? r === "low" ? "#4ade80" : r === "medium" ? "#fbbf24" : "#ef4444"
                          : "rgba(255,255,255,0.08)"}`,
                        color: risk === r
                          ? r === "low" ? "#4ade80" : r === "medium" ? "#fbbf24" : "#ef4444"
                          : "#6b7280",
                      }}
                    >{r}</button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  {risk === "low" ? "Max 16x · Safer" : risk === "medium" ? "Max 33x · Balanced" : "Max 110x · Volatile"}
                </p>
              </div>

              {/* Bet Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Bet Amount</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                  disabled={isDropping}
                  className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                  min="0.01" step="0.01"
                  data-testid="plinko-bet-input"
                />
                <div className="flex gap-2 mt-2">
                  {[["½", () => setBetAmount(v => parseFloat((v/2).toFixed(2)))],
                    ["2×", () => setBetAmount(v => parseFloat((v*2).toFixed(2)))],
                    ["Max", () => setBetAmount(balance)]].map(([l, fn]) => (
                    <button key={l as string} onClick={fn as any} disabled={isDropping}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 border border-gray-800 hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40"
                    >{l as string}</button>
                  ))}
                </div>
              </div>

              {/* Drop Button */}
              <motion.button
                data-testid="plinko-drop-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={drop}
                disabled={isDropping || !user}
                className="w-full py-4 rounded-xl font-black text-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 30px rgba(255,215,0,0.3)" }}
              >
                {isDropping
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Dropping...</>
                  : <><Triangle className="w-5 h-5" /> Drop Ball</>}
              </motion.button>
            </div>

            {/* Multiplier Preview */}
            <div className="p-4" style={GLASS_CARD}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bucket Multipliers ({risk})</h3>
              <div className="grid grid-cols-3 gap-1 text-center">
                {multTable.slice(0, 9).map((m, i) => (
                  <div key={i} className="py-1 rounded text-xs font-bold"
                    style={{ color: getBucketColor(m), background: `${getBucketColor(m)}10` }}>
                    {m}x
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">Center→edges shown</p>
            </div>

            {/* Fairness Info */}
            <div className="p-4 text-xs" style={GLASS_CARD}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-amber-500" />
                <span className="font-bold text-amber-400 uppercase tracking-wider">Provably Fair</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Each of the 16 drops is determined by HMAC-SHA256(serverSeed, clientSeed:nonce+i).
                Verify any result in the ¤ Fairness Lab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
