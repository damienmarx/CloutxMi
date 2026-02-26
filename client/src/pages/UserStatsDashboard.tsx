import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, Target } from "lucide-react";

interface UserStats {
  totalGamesPlayed: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  winRate: number;
  roi: number;
  favoriteGame: string;
  totalPlayTime: number;
}

export default function UserStatsDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  // Query user stats
  const { data: userStats } = trpc.userStats.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (userStats?.success && userStats.data) {
      setStats(userStats.data);
    }
  }, [userStats]);

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

  const isProfit = (stats?.netProfit || 0) >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Your Statistics</h1>
              <p className="text-gray-400">Track your casino performance</p>
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

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Wagered */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
            <p className="text-gray-400 text-sm mb-2">Total Wagered</p>
            <p className="text-3xl font-bold text-cyan-400">
              ${stats?.totalWagered?.toFixed(2) || "0.00"}
            </p>
            <p className="text-gray-500 text-xs mt-2">Lifetime bets</p>
          </Card>

          {/* Total Won */}
          <Card className="bg-gradient-to-br from-green-900/30 to-green-950/30 border-green-500/30 p-6">
            <p className="text-gray-400 text-sm mb-2">Total Won</p>
            <p className="text-3xl font-bold text-green-400">
              ${stats?.totalWon?.toFixed(2) || "0.00"}
            </p>
            <p className="text-gray-500 text-xs mt-2">Winning payouts</p>
          </Card>

          {/* Total Lost */}
          <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-500/30 p-6">
            <p className="text-gray-400 text-sm mb-2">Total Lost</p>
            <p className="text-3xl font-bold text-red-400">
              ${stats?.totalLost?.toFixed(2) || "0.00"}
            </p>
            <p className="text-gray-500 text-xs mt-2">Losing bets</p>
          </Card>

          {/* Net Profit/Loss */}
          <Card
            className={`bg-gradient-to-br ${
              isProfit ? "from-green-900/30 to-green-950/30" : "from-red-900/30 to-red-950/30"
            } border-${isProfit ? "green" : "red"}-500/30 p-6`}
          >
            <p className="text-gray-400 text-sm mb-2">Net Profit/Loss</p>
            <p className={`text-3xl font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
              ${stats?.netProfit?.toFixed(2) || "0.00"}
            </p>
            <p className="text-gray-500 text-xs mt-2">Overall result</p>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Win Rate */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-4xl font-bold text-cyan-400">{stats?.winRate?.toFixed(1) || "0"}%</p>
            <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full"
                style={{ width: `${Math.min(stats?.winRate || 0, 100)}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {stats?.totalGamesPlayed || 0} games played
            </p>
          </Card>

          {/* ROI */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">Return on Investment</p>
              {(stats?.roi || 0) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p
              className={`text-4xl font-bold ${
                (stats?.roi || 0) >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats?.roi?.toFixed(1) || "0"}%
            </p>
            <p className="text-gray-500 text-xs mt-4">
              {(stats?.roi || 0) >= 0 ? "Profitable" : "Negative"} performance
            </p>
          </Card>

          {/* Favorite Game */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
            <p className="text-gray-400 text-sm mb-4">Favorite Game</p>
            <p className="text-2xl font-bold text-cyan-400 mb-2">
              {stats?.favoriteGame || "N/A"}
            </p>
            <p className="text-gray-500 text-xs">Most played game</p>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
          <h3 className="text-white font-bold text-lg mb-6">Detailed Breakdown</h3>
          <div className="space-y-4">
            {/* Total Games */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <span className="text-gray-400">Total Games Played</span>
              <span className="text-white font-semibold">{stats?.totalGamesPlayed || 0}</span>
            </div>

            {/* Average Bet */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <span className="text-gray-400">Average Bet</span>
              <span className="text-white font-semibold">
                $
                {stats?.totalWagered && stats?.totalGamesPlayed
                  ? (stats.totalWagered / stats.totalGamesPlayed).toFixed(2)
                  : "0.00"}
              </span>
            </div>

            {/* Biggest Win */}
            <div className="flex items-center justify-between p-4 bg-green-700/20 rounded-lg border border-green-600/50">
              <span className="text-gray-400">Biggest Win</span>
              <span className="text-green-400 font-semibold">$0.00</span>
            </div>

            {/* Biggest Loss */}
            <div className="flex items-center justify-between p-4 bg-red-700/20 rounded-lg border border-red-600/50">
              <span className="text-gray-400">Biggest Loss</span>
              <span className="text-red-400 font-semibold">$0.00</span>
            </div>

            {/* Play Time */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <span className="text-gray-400">Total Play Time</span>
              <span className="text-white font-semibold">
                {stats?.totalPlayTime ? `${Math.floor(stats.totalPlayTime / 60)}h ${stats.totalPlayTime % 60}m` : "0h"}
              </span>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h4 className="text-cyan-400 font-bold mb-2">📊 Analyze Your Play</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Review your win rate</li>
              <li>• Track ROI over time</li>
              <li>• Identify patterns</li>
              <li>• Improve strategy</li>
            </ul>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h4 className="text-cyan-400 font-bold mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Set daily loss limits</li>
              <li>• Play responsibly</li>
              <li>• Diversify games</li>
              <li>• Use VIP benefits</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
