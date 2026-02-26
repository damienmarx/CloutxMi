import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Visualizers() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<{
    totalWins: number;
    totalLosses: number;
    winRate: number;
    totalEarnings: number;
    gameStats: { name: string; wins: number; losses: number }[];
    earningsOverTime: { time: string; earnings: number }[];
  }>({
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalEarnings: 0,
    gameStats: [
      { name: "Slots", wins: 0, losses: 0 },
      { name: "Keno", wins: 0, losses: 0 },
    ],
    earningsOverTime: [
      { time: "Mon", earnings: 0 },
      { time: "Tue", earnings: 0 },
      { time: "Wed", earnings: 0 },
      { time: "Thu", earnings: 0 },
      { time: "Fri", earnings: 0 },
      { time: "Sat", earnings: 0 },
      { time: "Sun", earnings: 0 },
    ],
  });

  const getTransactionHistory = trpc.wallet.getTransactionHistory.useQuery({}, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (getTransactionHistory.data) {
      // Calculate stats from transactions
      const gameTransactions = getTransactionHistory.data.filter(
        (t: any) => t.type === "game_win" || t.type === "game_loss"
      );

      const wins = gameTransactions.filter((t: any) => t.type === "game_win").length;
      const losses = gameTransactions.filter((t: any) => t.type === "game_loss").length;
      const totalEarnings = gameTransactions
        .filter((t: any) => t.type === "game_win")
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      setStats((prev) => ({
        ...prev,
        totalWins: wins,
        totalLosses: losses,
        winRate: wins + losses > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : 0,
        totalEarnings: totalEarnings,
      }));
    }
  }, [getTransactionHistory.data]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please login to view visualizers</p>
          <Button onClick={() => setLocation("/")} className="bg-red-600 hover:bg-red-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Wins", value: stats.totalWins, fill: "#ef4444" },
    { name: "Losses", value: stats.totalLosses, fill: "#64748b" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-red-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-500">📊 VISUALIZERS</h1>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Wins</p>
            <p className="text-4xl font-bold text-red-500">{stats.totalWins}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Losses</p>
            <p className="text-4xl font-bold text-gray-400">{stats.totalLosses}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Win Rate</p>
            <p className="text-4xl font-bold text-yellow-400">{stats.winRate}%</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Earnings</p>
            <p className="text-4xl font-bold text-green-400">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Win/Loss Pie Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-500 mb-6">Win/Loss Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings Over Time */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-500 mb-6">Earnings Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.earningsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game Stats Bar Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-500 mb-6">Performance by Game</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.gameStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #ef4444" }} />
              <Legend />
              <Bar dataKey="wins" fill="#ef4444" name="Wins" />
              <Bar dataKey="losses" fill="#64748b" name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-500 mb-6">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {getTransactionHistory.data && getTransactionHistory.data.length > 0 ? (
              getTransactionHistory.data.slice(0, 10).map((transaction: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-900/50 border border-red-500/20 rounded p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-gray-300 font-semibold capitalize">{transaction.type.replace("_", " ")}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      transaction.type === "game_win" || transaction.type === "deposit"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {transaction.type === "game_win" || transaction.type === "deposit" ? "+" : "-"}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
