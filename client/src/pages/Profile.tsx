/**
 * Degens¤Den — Player Profile
 * Avatar upload · VIP progress · Player statistics
 */
import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, Crown, TrendingUp, Trophy,
  Zap, Users, RefreshCw, CheckCircle, AlertCircle,
} from "lucide-react";

const GLASS = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

const VIP_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#e5e4e2",
  diamond: "#a5f3fc",
};

const VIP_TIERS = [
  { id: "bronze",   label: "Bronze",   req: "$0",       reqAmt: 0 },
  { id: "silver",   label: "Silver",   req: "$1,000",   reqAmt: 1_000 },
  { id: "gold",     label: "Gold",     req: "$5,000",   reqAmt: 5_000 },
  { id: "platinum", label: "Platinum", req: "$25,000",  reqAmt: 25_000 },
  { id: "diamond",  label: "Diamond",  req: "$100,000", reqAmt: 100_000 },
];

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stats, refetch: refetchStats } = trpc.wallet.getPlayerStats.useQuery(undefined, {
    enabled: !!user,
  });

  const uploadAvatarMutation = trpc.wallet.uploadAvatar.useMutation({
    onSuccess: () => {
      setUploading(false);
      setToast({ type: "success", message: "Avatar updated successfully!" });
      setTimeout(() => setToast(null), 3000);
      refetchStats();
    },
    onError: (e) => {
      setUploading(false);
      setToast({ type: "error", message: e.message || "Upload failed" });
      setTimeout(() => setToast(null), 4000);
    },
  });

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setToast({ type: "error", message: "Image must be under 2MB" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadAvatarMutation.mutate({ dataUrl });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const tierColor = VIP_COLORS[stats?.vipTier ?? "bronze"] ?? "#cd7f32";
  const tierIdx = VIP_TIERS.findIndex(t => t.id === (stats?.vipTier ?? "bronze"));
  const nextTier = VIP_TIERS[tierIdx + 1];
  const wagerProgress = stats && nextTier
    ? Math.min(100, (stats.totalWagered / nextTier.reqAmt) * 100)
    : stats ? 100 : 0;

  const winRate = stats && (stats.totalWins + stats.totalLosses) > 0
    ? ((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setLocation("/")}
            className="text-gray-500 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-4xl font-black text-amber-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >Profile</h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Your Account</p>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: toast.type === "success" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                border: `1px solid ${toast.type === "success" ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
                backdropFilter: "blur(12px)",
              }}
              data-testid="profile-toast"
            >
              {toast.type === "success"
                ? <CheckCircle className="w-4 h-4 text-green-400" />
                : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span style={{ color: toast.type === "success" ? "#4ade80" : "#f87171" }}>
                {toast.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-3 gap-6">

          {/* ── Avatar Card ── */}
          <div className="p-6 text-center" style={GLASS}>
            {/* Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              {stats?.avatarUrl ? (
                <img
                  src={stats.avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                  style={{ border: `2px solid ${tierColor}` }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black"
                  style={{
                    background: "rgba(255,215,0,0.08)",
                    border: `2px solid ${tierColor}`,
                    color: tierColor,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                data-testid="avatar-upload-btn"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", boxShadow: "0 0 12px rgba(255,215,0,0.4)" }}
              >
                {uploading
                  ? <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />
                  : <Upload className="w-3.5 h-3.5 text-black" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
                data-testid="avatar-file-input"
              />
            </div>

            <div
              className="font-black text-xl text-white mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >{user.username}</div>

            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Crown className="w-3.5 h-3.5" style={{ color: tierColor }} />
              <span className="text-sm font-bold capitalize" style={{ color: tierColor }}>
                {stats?.vipTier ?? "Bronze"}
              </span>
            </div>

            <p className="text-xs text-gray-600">PNG · JPG · WebP · Max 2MB</p>
            {stats?.memberSince && (
              <p className="text-xs text-gray-700 mt-2">
                Member since {new Date(stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            )}
          </div>

          {/* ── VIP Progress ── */}
          <div className="p-6" style={GLASS}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">VIP Progress</h3>

            {/* Progress bar */}
            {nextTier && (
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold capitalize" style={{ color: tierColor }}>
                    {stats?.vipTier ?? "Bronze"}
                  </span>
                  <span className="text-gray-500 capitalize">{nextTier.label}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${wagerProgress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${tierColor}99, ${tierColor})` }}
                  />
                </div>
                {stats?.wagerToNext && stats.wagerToNext > 0 && (
                  <p className="text-xs text-gray-600 mt-1.5">
                    ${stats.wagerToNext.toLocaleString()} more wagered to reach {nextTier.label}
                  </p>
                )}
              </div>
            )}

            {/* Tier list */}
            <div className="space-y-2">
              {VIP_TIERS.map(tier => {
                const tc = VIP_COLORS[tier.id];
                const isActive = (stats?.vipTier ?? "bronze") === tier.id;
                const isPast = VIP_TIERS.findIndex(t => t.id === (stats?.vipTier ?? "bronze")) > VIP_TIERS.findIndex(t => t.id === tier.id);
                return (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${tc}12` : "transparent",
                      border: `1px solid ${isActive ? `${tc}50` : "transparent"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5" style={{ color: isActive || isPast ? tc : "#374151" }} />
                      <span className="text-xs font-bold" style={{ color: isActive ? tc : isPast ? `${tc}80` : "#4b5563" }}>
                        {tier.label}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: isActive ? "#9ca3af" : "#374151" }}>
                      {tier.req}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="p-6 space-y-3" style={GLASS}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Statistics</h3>

            {[
              {
                icon: TrendingUp,
                label: "Total Wagered",
                value: `$${(stats?.totalWagered ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                color: "#60a5fa",
              },
              {
                icon: Trophy,
                label: "Biggest Win",
                value: `$${(stats?.biggestWin ?? 0).toFixed(2)}`,
                color: "#4ade80",
              },
              {
                icon: Zap,
                label: "Games Played",
                value: (stats?.gamesPlayed ?? 0).toLocaleString(),
                color: "#FFD700",
              },
              {
                icon: Users,
                label: "Win Rate",
                value: `${winRate}%`,
                color: "#a78bfa",
              },
              {
                icon: TrendingUp,
                label: "Total Wins",
                value: (stats?.totalWins ?? 0).toLocaleString(),
                color: "#4ade80",
              },
              {
                icon: TrendingUp,
                label: "Total Losses",
                value: (stats?.totalLosses ?? 0).toLocaleString(),
                color: "#f87171",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{value}</span>
              </div>
            ))}

            {/* Next Tier hint */}
            {stats?.nextTier && stats.wagerToNext > 0 && (
              <div
                className="mt-3 p-3 rounded-xl text-center"
                style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.1)" }}
              >
                <p className="text-xs text-gray-600">
                  Wager <span className="text-amber-400 font-bold">${stats.wagerToNext.toLocaleString()}</span> more to reach{" "}
                  <span className="font-bold capitalize" style={{ color: VIP_COLORS[stats.nextTier] ?? "#FFD700" }}>
                    {stats.nextTier}
                  </span> VIP
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
