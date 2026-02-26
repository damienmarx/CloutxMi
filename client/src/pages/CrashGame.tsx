import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CrashGame() {
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [cashoutMultiplier, setCashoutMultiplier] = useState<number>(2.0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed" | "won" | "lost">("idle");
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ multiplier: number; result: "win" | "loss" }>>([]);

  const playMutation = trpc.games.playCrash.useMutation();
  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const balanceAmount = balance ? parseFloat(balance.balance as any) : 0;

  const startGame = async () => {
      if (!balance || betAmount > balanceAmount) {
      toast.error("Insufficient balance");
      return;
    }

    setGameState("playing");
    setCrashPoint(null);
    setCurrentMultiplier(1.0);

    // Simulate crash game
    const crashMultiplier = Math.pow(Math.E, Math.random() * 5);
    setCrashPoint(crashMultiplier);

    // Animate multiplier increase
    let current = 1.0;
    const interval = setInterval(() => {
      current += Math.random() * 0.1;
      setCurrentMultiplier(current);

      if (current >= crashMultiplier) {
        clearInterval(interval);
        setGameState("crashed");
        setCurrentMultiplier(crashMultiplier);

        // Check if player cashed out
        if (cashoutMultiplier <= crashMultiplier) {
          setGameState("won");
          const payout = betAmount * cashoutMultiplier;
          playMutation.mutate({
            betAmount: betAmount,
            multiplier: crashMultiplier,
            cashoutMultiplier: cashoutMultiplier,
            won: true,
          });
          toast.success(`Won $${payout.toFixed(2)}!`);
          setHistory([{ multiplier: crashMultiplier, result: "win" }, ...history.slice(0, 9)]);
        } else {
          setGameState("lost");
          playMutation.mutate({
            betAmount: betAmount,
            multiplier: crashMultiplier,
            cashoutMultiplier: cashoutMultiplier,
            won: false,
          });
          toast.error("Game crashed! You lost.");
          setHistory([{ multiplier: crashMultiplier, result: "loss" }, ...history.slice(0, 9)]);
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">📈</div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">CRASH 2026</h1>
              <p className="text-cyan-400">High-risk prediction game</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Game Display */}
          <div className="md:col-span-2">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
              <div className="text-center mb-8">
                <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-400 mb-4">
                  {currentMultiplier.toFixed(2)}x
                </div>
                <div className="h-2 bg-gradient-to-r from-red-500 to-cyan-400 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-cyan-400 transition-all duration-100"
                    style={{
                      width: `${Math.min((currentMultiplier / (crashPoint || 10)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {gameState === "crashed" && (
                <div className="text-center text-2xl font-bold text-red-500 mb-4">
                  CRASHED! 💥
                </div>
              )}

              {gameState === "won" && (
                <div className="text-center text-2xl font-bold text-green-500 mb-4">
                  YOU WON! 🎉
                </div>
              )}

              {gameState === "lost" && (
                <div className="text-center text-2xl font-bold text-red-500 mb-4">
                  YOU LOST! 😢
                </div>
              )}
            </Card>

            {/* History */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-6 mt-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Recent Games</h3>
              <div className="grid grid-cols-5 gap-2">
                {history.map((game, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-center font-bold ${
                      game.result === "win"
                        ? "bg-green-500/20 text-green-400 border border-green-500/50"
                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                    }`}
                  >
                    {game.multiplier.toFixed(2)}x
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Controls */}
          <div>
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-red-500/30 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-red-500 mb-6">Game Controls</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyan-400 mb-2">Bet Amount</label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    disabled={gameState !== "idle"}
                    className="bg-slate-700 border-cyan-500/30 text-white"
                    min="1"
                    max={balance?.balance}
                  />
                </div>

                <div>
                  <label className="block text-sm text-cyan-400 mb-2">Cashout at Multiplier</label>
                  <Input
                    type="number"
                    value={cashoutMultiplier}
                    onChange={(e) => setCashoutMultiplier(parseFloat(e.target.value) || 1)}
                    disabled={gameState !== "idle"}
                    className="bg-slate-700 border-cyan-500/30 text-white"
                    min="1.01"
                    step="0.01"
                  />
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Potential Payout</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${(betAmount * cashoutMultiplier).toFixed(2)}
                  </p>
                </div>

                  <Button
                    onClick={startGame}
                    disabled={gameState !== "idle" || !balance || betAmount > balanceAmount}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 text-lg"
                >
                  {gameState === "idle" ? "START GAME" : "PLAYING..."}
                </Button>

                <div className="text-sm text-gray-400 pt-4 border-t border-slate-600">
                  <p>Balance: ${balanceAmount.toFixed(2)}</p>
                  <p>Min Bet: $1</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
