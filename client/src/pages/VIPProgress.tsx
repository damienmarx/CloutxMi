import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Crown, ArrowLeft, Zap, Gift, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VIPTier {
  name: string;
  level: number;
  minWagered: number;
  cashback: number;
  multiplier: number;
  color: string;
  icon: string;
}

const VIP_TIERS: VIPTier[] = [
  {
    name: "Bronze",
    level: 1,
    minWagered: 0,
    cashback: 0.5,
    multiplier: 1.0,
    color: "from-amber-600 to-amber-700",
    icon: "🥉",
  },
  {
    name: "Silver",
    level: 2,
    minWagered: 5000,
    cashback: 1.0,
    multiplier: 1.05,
    color: "from-gray-400 to-gray-500",
    icon: "🥈",
  },
  {
    name: "Gold",
    level: 3,
    minWagered: 25000,
    cashback: 1.5,
    multiplier: 1.1,
    color: "from-yellow-400 to-yellow-500",
    icon: "🥇",
  },
  {
    name: "Platinum",
    level: 4,
    minWagered: 100000,
    cashback: 2.0,
    multiplier: 1.15,
    color: "from-blue-400 to-blue-500",
    icon: "💎",
  },
  {
    name: "Diamond",
    level: 5,
    minWagered: 500000,
    cashback: 3.0,
    multiplier: 1.25,
    color: "from-purple-500 to-pink-500",
    icon: "👑",
  },
];

export default function VIPProgress() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [vipData, setVipData] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<VIPTier>(VIP_TIERS[0]);
  const [nextTier, setNextTier] = useState<VIPTier>(VIP_TIERS[1]);
  const [progressPercent, setProgressPercent] = useState(0);

  // Query VIP progress
  const { data: vipProgress } = trpc.vipProgress.getProgress.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (vipProgress?.success && vipProgress.data) {
      setVipData(vipProgress.data);

      // Find current tier
      const tier = VIP_TIERS.find((t) => t.level === vipProgress.data.currentTier) || VIP_TIERS[0];
      setCurrentTier(tier);

      // Find next tier
      const nextTierIdx = Math.min(tier.level, VIP_TIERS.length - 1);
      setNextTier(VIP_TIERS[nextTierIdx]);

      // Calculate progress
      const currentTierWagered = vipProgress.data.totalWagered - (tier.minWagered || 0);
      const nextTierRequired = nextTier.minWagered - (tier.minWagered || 0);
      const progress = Math.min((currentTierWagered / nextTierRequired) * 100, 100);
      setProgressPercent(progress);
    }
  }, [vipProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">VIP Program</h1>
              <p className="text-gray-400">Climb the ranks and unlock exclusive benefits</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Current Tier Card */}
        <Card
          className={`bg-gradient-to-br ${currentTier.color} p-8 mb-8 border-0 text-white shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 mb-2">Current Tier</p>
              <h2 className="text-5xl font-bold mb-2">{currentTier.icon} {currentTier.name}</h2>
              <p className="text-lg opacity-90">Level {currentTier.level} / 5</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80 mb-2">Total Wagered</p>
              <p className="text-4xl font-bold">${vipData?.totalWagered?.toFixed(0) || "0"}</p>
            </div>
          </div>
        </Card>

        {/* Progress to Next Tier */}
        {currentTier.level < 5 && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6 mb-8">
            <h3 className="text-white font-bold text-lg mb-4">Progress to {nextTier.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  ${(vipData?.totalWagered - currentTier.minWagered)?.toFixed(0) || "0"}
                </span>
                <span className="text-gray-400">
                  ${(nextTier.minWagered - currentTier.minWagered)?.toFixed(0) || "0"}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-cyan-400 text-sm font-semibold">{progressPercent.toFixed(1)}% Complete</p>
            </div>
          </Card>
        )}

        {/* Current Tier Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-cyan-400" />
              <p className="text-gray-400 text-sm">Cashback</p>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{currentTier.cashback}%</p>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <p className="text-gray-400 text-sm">Win Multiplier</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">x{currentTier.multiplier}</p>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <p className="text-gray-400 text-sm">Bonus Rewards</p>
            </div>
            <p className="text-3xl font-bold text-green-400">Tier {currentTier.level}</p>
          </Card>
        </div>

        {/* All Tiers */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
          <h3 className="text-white font-bold text-lg mb-6">All VIP Tiers</h3>
          <div className="space-y-3">
            {VIP_TIERS.map((tier) => (
              <div
                key={tier.level}
                className={`p-4 rounded-lg border transition ${
                  tier.level === currentTier.level
                    ? "bg-cyan-500/20 border-cyan-500"
                    : "bg-slate-700/50 border-slate-600/50 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{tier.name}</p>
                      <p className="text-gray-400 text-sm">Wager ${tier.minWagered.toLocaleString()}+</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 text-sm">{tier.cashback}% Cashback</p>
                    <p className="text-yellow-400 text-sm">x{tier.multiplier} Multiplier</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h4 className="text-cyan-400 font-bold mb-2">💡 How to Climb</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Wager on any casino game</li>
              <li>• Accumulate total wagers</li>
              <li>• Unlock higher tiers</li>
              <li>• Enjoy better benefits</li>
            </ul>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h4 className="text-cyan-400 font-bold mb-2">🎁 Tier Benefits</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Increased cashback %</li>
              <li>• Win multipliers</li>
              <li>• Exclusive bonuses</li>
              <li>• Priority support</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
