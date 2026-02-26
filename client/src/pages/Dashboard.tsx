import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, LogOut, Wallet, TrendingUp, Send, Download, Gamepad2, Trophy, MessageSquare, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Wallet state
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [tipUsername, setTipUsername] = useState("");
  const [tipAmount, setTipAmount] = useState("");

  // Queries and mutations
  const { data: balanceData, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const { data: transactions } = trpc.wallet.getTransactionHistory.useQuery({ limit: 50 });

  const depositMutation = trpc.wallet.deposit.useMutation();
  const withdrawMutation = trpc.wallet.withdraw.useMutation();
  const tipMutation = trpc.wallet.tip.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

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

  const balance = balanceData ? parseFloat(balanceData.balance as any) : 0;

  const handleDeposit = async () => {
    if (!depositAmount) return;
    try {
      const result = await depositMutation.mutateAsync({ amount: parseFloat(depositAmount) });
      if (result.success) {
        setDepositAmount("");
        refetchBalance();
        toast.success(`Deposited $${parseFloat(depositAmount).toFixed(2)}`);
      }
    } catch (error) {
      toast.error("Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    try {
      const result = await withdrawMutation.mutateAsync({ amount: parseFloat(withdrawAmount) });
      if (result.success) {
        setWithdrawAmount("");
        refetchBalance();
        toast.success(`Withdrew $${parseFloat(withdrawAmount).toFixed(2)}`);
      }
    } catch (error) {
      toast.error("Withdrawal failed");
    }
  };

  const handleTip = async () => {
    if (!tipUsername || !tipAmount) return;
    try {
      const result = await tipMutation.mutateAsync({
        toUsername: tipUsername,
        amount: parseFloat(tipAmount),
      });
      if (result.success) {
        setTipUsername("");
        setTipAmount("");
        refetchBalance();
        toast.success(`Tipped ${tipUsername} $${parseFloat(tipAmount).toFixed(2)}`);
      }
    } catch (error) {
      toast.error("Tip failed");
    }
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 border-b border-red-500/30 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">♧</div>
            <div>
              <h1 className="text-3xl font-bold text-white">Degens♧Den</h1>
              <p className="text-red-100">Welcome, {user?.name || user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-900 hover:bg-red-800 text-white flex items-center gap-2"
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-red-600 to-red-700 border-red-500/50 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 mb-2">Total Balance</p>
              <h2 className="text-5xl font-bold text-white">${balance.toFixed(2)}</h2>
            </div>
            <div className="text-6xl opacity-20">💰</div>
          </div>
        </Card>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Button
            onClick={() => setLocation("/slots-3d")}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-20 flex flex-col items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.3)] border border-red-500/50"
          >
            <Zap size={24} className="animate-pulse" />
            <span className="font-black italic">3D SLOTS</span>
          </Button>
          <Button
            onClick={() => setLocation("/slots")}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-20 flex flex-col items-center justify-center gap-2"
          >
            <Gamepad2 size={24} />
            <span>Slots</span>
          </Button>
          <Button
            onClick={() => setLocation("/keno")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-20 flex flex-col items-center justify-center gap-2"
          >
            <Trophy size={24} />
            <span>Keno</span>
          </Button>
          <Button
            onClick={() => setLocation("/crash")}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white h-20 flex flex-col items-center justify-center gap-2"
          >
            <TrendingUp size={24} />
            <span>Crash</span>
          </Button>
          <Button
            onClick={() => setLocation("/visualizers")}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white h-20 flex flex-col items-center justify-center gap-2"
          >
            <MessageSquare size={24} />
            <span>Stats</span>
          </Button>
        </div>

        {/* OSRS Quick Actions */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6 mb-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">🎮 OSRS GP Exchange</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setLocation("/osrs-deposit")}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3"
            >
              💵 Deposit OSRS GP
            </Button>
            <Button
              onClick={() => setLocation("/osrs-withdraw")}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-3"
            >
              💸 Withdraw to OSRS GP
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="text-cyan-400">
              Overview
            </TabsTrigger>
            <TabsTrigger value="deposit" className="text-cyan-400">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-cyan-400">
              Withdraw
            </TabsTrigger>
            <TabsTrigger value="history" className="text-cyan-400">
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6">
                <p className="text-gray-400 mb-2">Total Wagered</p>
                <p className="text-3xl font-bold text-cyan-400">$0.00</p>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6">
                <p className="text-gray-400 mb-2">VIP Tier</p>
                <p className="text-3xl font-bold text-red-500">Bronze</p>
              </Card>
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6">
                <p className="text-gray-400 mb-2">Win Rate</p>
                <p className="text-3xl font-bold text-green-400">0%</p>
              </Card>
            </div>
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Deposit Funds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyan-400 mb-2">Amount (USD)</label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100.00"
                    className="bg-slate-700 border-cyan-500/30 text-white"
                  />
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={!depositAmount || depositMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold"
                >
                  {depositMutation.isPending ? "Processing..." : "Deposit"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Withdraw Funds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyan-400 mb-2">Amount (USD)</label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="100.00"
                    className="bg-slate-700 border-cyan-500/30 text-white"
                    max={balance}
                  />
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || withdrawMutation.isPending || parseFloat(withdrawAmount) > balance}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold"
                >
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                </Button>
              </div>

              {/* Tip Section */}
              <div className="mt-8 pt-8 border-t border-slate-700">
                <h4 className="text-lg font-bold text-red-500 mb-4">Tip Another Player</h4>
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={tipUsername}
                    onChange={(e) => setTipUsername(e.target.value)}
                    placeholder="Player username"
                    className="bg-slate-700 border-cyan-500/30 text-white"
                  />
                  <Input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Tip amount (USD)"
                    className="bg-slate-700 border-cyan-500/30 text-white"
                    max={balance}
                  />
                  <Button
                    onClick={handleTip}
                    disabled={!tipUsername || !tipAmount || tipMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold"
                  >
                    {tipMutation.isPending ? "Sending..." : "Send Tip"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Transaction History</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <div>
                        <p className="text-white font-bold capitalize">{tx.type}</p>
                        <p className="text-sm text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className={`font-bold ${tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                        {tx.type === "deposit" ? "+" : "-"}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No transactions yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Game Selection Grid */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-red-500 mb-4">All Games</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Slots", path: "/slots", icon: "🎰" },
              { name: "Keno", path: "/keno", icon: "🎲" },
              { name: "Crash", path: "/crash", icon: "📈" },
              { name: "Blackjack", path: "/blackjack", icon: "🎴" },
              { name: "Roulette", path: "/roulette", icon: "🎡" },
              { name: "Dice", path: "/dice", icon: "🎲" },
              { name: "Stats", path: "/visualizers", icon: "📊" },
              { name: "Chat", path: "/visualizers", icon: "💬" },
            ].map((game) => (
              <Button
                key={game.name}
                onClick={() => setLocation(game.path)}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-white"
              >
                <span className="text-3xl">{game.icon}</span>
                <span className="font-bold">{game.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
