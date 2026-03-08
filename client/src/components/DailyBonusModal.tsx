/**
 * Degens¤Den — Daily Bonus Wheel
 * Free spin every 24 hours — no bet required
 * 7-day streak = 1.5× all rewards
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Gift, X, Flame, Clock } from "lucide-react";

// Matches server BONUS_SEGMENTS exactly
const SEGMENTS = [0.10, 0.25, 0.10, 0.50, 0.10, 1.00, 0.25, 2.50, 0.10, 0.50, 0.25, 5.00];
const SEG_COUNT = SEGMENTS.length;
const SLICE_DEG = 360 / SEG_COUNT;

// Colours for segments (alternating dark/gold palette)
const SEG_COLORS = [
  "#1a1a2e", "#FFD700", "#0d1b2a", "#B8860B",
  "#1a1a2e", "#FFD700", "#0d1b2a", "#B8860B",
  "#1a1a2e", "#FFD700", "#0d1b2a", "#B8860B",
];
const SEG_TEXT_COLORS = [
  "#FFD700", "#000", "#FFD700", "#000",
  "#FFD700", "#000", "#FFD700", "#000",
  "#FFD700", "#000", "#FFD700", "#000",
];

function buildWheelPath(index: number, r: number): string {
  const start = (index * SLICE_DEG - 90) * (Math.PI / 180);
  const end = ((index + 1) * SLICE_DEG - 90) * (Math.PI / 180);
  const x1 = Math.cos(start) * r;
  const y1 = Math.sin(start) * r;
  const x2 = Math.cos(end) * r;
  const y2 = Math.sin(end) * r;
  return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

function formatCountdown(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ─── Badge shown in navbar/home ──────────────────────────────────────────────
export function DailyBonusBadge({ onClick }: { onClick: () => void }) {
  const { data } = trpc.wallet.getDailyBonusStatus.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  if (!data?.canClaim) return null;

  return (
    <motion.button
      data-testid="daily-bonus-badge"
      onClick={onClick}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-black"
      style={{
        background: "linear-gradient(135deg,#FFD700,#FFA500)",
        boxShadow: "0 0 16px rgba(255,215,0,0.5)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <Gift className="w-3.5 h-3.5" />
      Free Spin!
    </motion.button>
  );
}

// ─── Full Modal ───────────────────────────────────────────────────────────────
export function DailyBonusModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    segment: number; amount: number; streak: number; streakBonus: boolean; newBalance: number;
  } | null>(null);
  const [countdown, setCountdown] = useState("");
  const spinRef = useRef(rotation);
  spinRef.current = rotation;

  const { data: status, refetch } = trpc.wallet.getDailyBonusStatus.useQuery(undefined, {
    enabled: isOpen,
  });

  // Live countdown
  useEffect(() => {
    if (!status?.nextClaimAt) return;
    const tick = () => setCountdown(formatCountdown(status.nextClaimAt!));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [status?.nextClaimAt]);

  const claimMutation = trpc.wallet.claimDailyBonus.useMutation({
    onSuccess: (data) => {
      const targetSegment = data.segment;
      // Spin to the correct segment with extra full rotations for drama
      const segmentAngle = targetSegment * SLICE_DEG + SLICE_DEG / 2;
      const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
      const finalAngle = fullSpins * 360 + (360 - segmentAngle);
      setRotation(prev => prev + finalAngle);
      setTimeout(() => {
        setSpinning(false);
        setResult(data);
        refetch();
      }, 4200);
    },
    onError: (e) => {
      setSpinning(false);
      alert(e.message);
    },
  });

  const handleSpin = () => {
    if (spinning || !status?.canClaim) return;
    setSpinning(true);
    setResult(null);
    claimMutation.mutate();
  };

  if (!isOpen) return null;

  const R = 120;
  const CENTER = 140;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 18, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl text-white overflow-hidden"
          style={{
            background: "rgba(10,10,18,0.97)",
            border: "1px solid rgba(255,215,0,0.25)",
            boxShadow: "0 0 60px rgba(255,215,0,0.15)",
          }}
          data-testid="daily-bonus-modal"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="daily-bonus-close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          {/* Header */}
          <div className="px-6 pt-6 pb-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Daily Bonus
              </h2>
            </div>
            <p className="text-xs text-gray-500">Free spin every 24 hours · No bet required</p>
          </div>

          {/* Streak Banner */}
          {(status?.streak ?? 0) > 0 && (
            <div
              className="mx-6 mb-3 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
              style={{ background: "rgba(255,100,0,0.12)", border: "1px solid rgba(255,100,0,0.3)" }}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300">{status?.streak ?? 0} Day Streak</span>
              {(status?.streak ?? 0) >= 7 && (
                <span className="text-xs text-orange-400 font-black ml-1">+50% Bonus!</span>
              )}
            </div>
          )}

          {/* Wheel */}
          <div className="flex justify-center py-2">
            <div className="relative" style={{ width: CENTER * 2, height: CENTER * 2 }}>
              {/* Pointer */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
                style={{
                  width: 0, height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "20px solid #FFD700",
                  filter: "drop-shadow(0 2px 4px rgba(255,215,0,0.6))",
                }}
              />

              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: spinning ? 4 : 0.3, ease: spinning ? [0.17, 0.67, 0.35, 0.99] : "linear" }}
                style={{ transformOrigin: "center", width: "100%", height: "100%" }}
              >
                <svg viewBox={`-${CENTER} -${CENTER} ${CENTER * 2} ${CENTER * 2}`} width="100%" height="100%">
                  {/* Segments */}
                  {SEGMENTS.map((val, i) => {
                    const midAngle = (i * SLICE_DEG + SLICE_DEG / 2 - 90) * (Math.PI / 180);
                    const tx = Math.cos(midAngle) * (R * 0.65);
                    const ty = Math.sin(midAngle) * (R * 0.65);
                    return (
                      <g key={i}>
                        <path
                          d={buildWheelPath(i, R)}
                          fill={SEG_COLORS[i]}
                          stroke="rgba(255,215,0,0.3)"
                          strokeWidth="1"
                        />
                        <text
                          x={tx} y={ty}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={SEG_TEXT_COLORS[i]}
                          fontSize="10"
                          fontWeight="bold"
                          transform={`rotate(${i * SLICE_DEG + SLICE_DEG / 2}, ${tx}, ${ty})`}
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          ${val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  {/* Centre hub */}
                  <circle r="18" fill="#0a0a12" stroke="#FFD700" strokeWidth="2" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#FFD700" fontSize="8" fontWeight="bold">
                    FREE
                  </text>
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mb-3 px-4 py-3 rounded-xl text-center"
                data-testid="daily-bonus-result"
                style={{
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid rgba(255,215,0,0.35)",
                }}
              >
                <div className="text-3xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  +${result.amount.toFixed(2)}
                </div>
                {result.streakBonus && (
                  <div className="text-xs text-orange-400 font-bold mt-0.5">Streak bonus applied (+50%)</div>
                )}
                <div className="text-xs text-gray-500 mt-1">Added to your balance</div>
                <div className="text-xs text-gray-600 mt-0.5">New balance: ${result.newBalance.toFixed(2)}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Countdown when already claimed */}
          {!status?.canClaim && !spinning && (
            <div className="mx-6 mb-3 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-500"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Clock className="w-3.5 h-3.5" />
              Next spin in {countdown}
            </div>
          )}

          {/* Spin Button */}
          <div className="px-6 pb-6">
            <motion.button
              data-testid="daily-bonus-spin-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSpin}
              disabled={spinning || !status?.canClaim}
              className="w-full py-4 rounded-xl font-black text-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg,#FFD700,#B8860B)",
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: spinning ? "none" : "0 0 30px rgba(255,215,0,0.4)",
              }}
            >
              {spinning ? "Spinning..." : status?.canClaim ? "SPIN FOR FREE!" : "Come Back Tomorrow"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
