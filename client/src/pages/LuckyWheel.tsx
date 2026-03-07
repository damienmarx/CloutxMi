import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowLeft, RefreshCw, Shield } from "lucide-react";

const GLASS = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

// 12 equal segments — RTP ~79%
const SEGMENTS = [
  { mult: 0,   label: "BUST",  color: "#1f1f30", textColor: "#6b7280" },
  { mult: 0.5, label: "0.5×",  color: "#1e293b", textColor: "#94a3b8" },
  { mult: 0,   label: "BUST",  color: "#1f1f30", textColor: "#6b7280" },
  { mult: 1,   label: "1×",    color: "#14532d", textColor: "#4ade80" },
  { mult: 0.5, label: "0.5×",  color: "#1e293b", textColor: "#94a3b8" },
  { mult: 2,   label: "2×",    color: "#1e3a5f", textColor: "#60a5fa" },
  { mult: 0.5, label: "0.5×",  color: "#1e293b", textColor: "#94a3b8" },
  { mult: 1,   label: "1×",    color: "#14532d", textColor: "#4ade80" },
  { mult: 0,   label: "BUST",  color: "#1f1f30", textColor: "#6b7280" },
  { mult: 3,   label: "3×",    color: "#422006", textColor: "#f59e0b" },
  { mult: 0.5, label: "0.5×",  color: "#1e293b", textColor: "#94a3b8" },
  { mult: 0,   label: "BUST",  color: "#1f1f30", textColor: "#6b7280" },
];

const TOTAL_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS;

function WheelSVG({ spinning, finalAngle, onDone }: {
  spinning: boolean;
  finalAngle: number;
  onDone: () => void;
}) {
  const wheelRef = useRef<SVGGElement>(null);
  const [angle, setAngle] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const SPIN_DURATION = 3500; // ms

  useEffect(() => {
    if (!spinning) return;
    const start = performance.now();
    startRef.current = start;
    const target = 360 * 5 + finalAngle; // 5 full rotations + final position

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      // Eased progress (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setAngle(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setAngle(finalAngle % 360);
        onDone();
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [spinning, finalAngle]);

  const cx = 150; const cy = 150; const r = 140;

  return (
    <svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: "320px" }}>
      <defs>
        <filter id="wheel-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer rim */}
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="2" />

      {/* Rotating wheel group */}
      <g ref={wheelRef} style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${angle}deg)` }}>
        {SEGMENTS.map((seg, i) => {
          const startAngle = i * SEGMENT_ANGLE - 90;
          const endAngle = startAngle + SEGMENT_ANGLE;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const midRad = ((startAngle + SEGMENT_ANGLE / 2) * Math.PI) / 180;

          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const tx = cx + (r * 0.7) * Math.cos(midRad);
          const ty = cy + (r * 0.7) * Math.sin(midRad);

          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                fill={seg.color}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <text
                x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight="bold" fill={seg.textColor}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >{seg.label}</text>
            </g>
          );
        })}
      </g>

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={18} fill="#0a0a14" stroke="rgba(255,215,0,0.5)" strokeWidth="2" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#FFD700" fontWeight="bold">¤</text>

      {/* Pointer */}
      <polygon
        points={`${cx},${cy - r - 4} ${cx - 10},${cy - r + 12} ${cx + 10},${cy - r + 12}`}
        fill="#FFD700"
        filter="url(#wheel-glow)"
      />
    </svg>
  );
}

export default function LuckyWheel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [finalAngle, setFinalAngle] = useState(0);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [history, setHistory] = useState<Array<{ mult: number; win: boolean }>>([]);

  const { data: walletData, refetch } = trpc.wallet.getBalance.useQuery();
  const balance = parseFloat(walletData?.balance ?? "0");

  const spinMutation = trpc.games.playLuckyWheel.useMutation({
    onSuccess: (data) => {
      // Calculate angle so pointer lands on winning segment
      const segIdx = data.segment;
      // Each segment is SEGMENT_ANGLE degrees, pointer is at top (270deg offset)
      const segCenter = segIdx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      // We want pointer (at top = 270) to point to segCenter
      // finalAngle = -(segCenter - 90) so the segment rotates to the top
      const angle = (360 - ((segCenter - 90 + 360) % 360)) % 360;
      setFinalAngle(angle);
      setPendingResult(data);
      setSpinning(true);
    },
    onError: (e) => { alert(e.message); setSpinning(false); },
  });

  const handleSpin = () => {
    if (!user) { setLocation("/login"); return; }
    if (betAmount > balance) { alert("Insufficient balance"); return; }
    setResult(null);
    spinMutation.mutate({ betAmount, currency: "crypto" });
  };

  const handleAnimDone = () => {
    setSpinning(false);
    setResult(pendingResult);
    if (pendingResult) {
      setHistory(prev => [{ mult: pendingResult.multiplier, win: pendingResult.win }, ...prev.slice(0, 9)]);
      refetch();
    }
  };

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lucky Wheel</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · 12-Segment Fortune</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-bold text-amber-400" data-testid="wheel-balance">${balance.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Wheel area */}
          <div className="md:col-span-2">
            <div className="p-6 flex flex-col items-center gap-6" style={GLASS}>

              <WheelSVG spinning={spinning} finalAngle={finalAngle} onDone={handleAnimDone} />

              <AnimatePresence>
                {result && !spinning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="w-full max-w-sm text-center p-5 rounded-xl"
                    style={{
                      background: result.win ? "rgba(74,222,128,0.1)" : result.multiplier > 0 ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)",
                      border: `1px solid ${result.win ? "rgba(74,222,128,0.3)" : result.multiplier > 0 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)"}`,
                    }}
                  >
                    <div className="text-4xl font-black mb-2"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: result.win ? "#4ade80" : result.multiplier > 0 ? "#fbbf24" : "#f87171" }}>
                      {SEGMENTS[result.segment]?.label}
                    </div>
                    {result.multiplier > 0 ? (
                      <>
                        {result.win && <div className="text-green-400 font-bold text-xl">+${(result.winAmount - betAmount).toFixed(2)}</div>}
                        {!result.win && result.multiplier > 0 && <div className="text-yellow-400 font-bold">Return: ${result.winAmount.toFixed(2)}</div>}
                      </>
                    ) : (
                      <div className="text-gray-500">Better luck next spin!</div>
                    )}
                    <div className="flex justify-between px-4 py-2 rounded-lg bg-white/5 mt-3">
                      <span className="text-gray-500 text-sm">Balance</span>
                      <span className="text-amber-400 font-bold">${result.newBalance.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History */}
              {history.length > 0 && (
                <div className="w-full">
                  <div className="text-xs text-gray-500 mb-2">Recent spins</div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs font-bold"
                        style={{
                          background: h.win ? "rgba(74,222,128,0.1)" : h.mult > 0 ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)",
                          color: h.win ? "#4ade80" : h.mult > 0 ? "#fbbf24" : "#f87171",
                          border: `1px solid ${h.win ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)"}`,
                        }}
                      >{h.mult}×</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="p-5 space-y-4" style={GLASS}>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Bet Amount</label>
                <input
                  type="number" value={betAmount} min="0.01" step="0.01"
                  onChange={e => setBetAmount(Math.max(0.01, Number(e.target.value)))}
                  disabled={spinning}
                  data-testid="wheel-bet-input"
                  className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                />
                <div className="flex gap-2 mt-2">
                  {[["½", () => setBetAmount(v => parseFloat((v/2).toFixed(2)))],
                    ["2×", () => setBetAmount(v => parseFloat((v*2).toFixed(2)))],
                    ["Max", () => setBetAmount(balance)]].map(([l, fn]) => (
                    <button key={l as string} onClick={fn as any} disabled={spinning}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 border border-gray-800 hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40"
                    >{l as string}</button>
                  ))}
                </div>
              </div>

              <motion.button
                data-testid="wheel-spin-btn"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSpin}
                disabled={spinning || !user}
                className="w-full py-4 rounded-xl font-black text-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 30px rgba(255,215,0,0.3)" }}
              >
                {spinning
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /> Spinning...</>
                  : <><Star className="w-5 h-5" /> Spin the Wheel</>}
              </motion.button>
            </div>

            {/* Segments preview */}
            <div className="p-4" style={GLASS}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Segments</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {SEGMENTS.map((s, i) => (
                  <div key={i} className="py-1.5 px-2 rounded text-center text-xs font-bold"
                    style={{ background: s.color, color: s.textColor, border: "1px solid rgba(255,255,255,0.05)" }}>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 text-xs" style={GLASS}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3 text-amber-500" />
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Provably Fair</span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Segment selected via HMAC-SHA256. Verify any spin in ¤ Fairness Lab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
