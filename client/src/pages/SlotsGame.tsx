import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, ArrowLeft, RotateCcw } from "lucide-react";

const SYMBOL_EMOJIS: Record<string, string> = {
  cherry: "🍒",
  lemon: "🍋",
  orange: "🍊",
  plum: "🍇",
  bell: "🔔",
  bar: "▮",
  seven: "7️⃣",
  gold: "💰",
};

export default function SlotsGame() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // Game state
  const [betAmount, setBetAmount] = useState("1.00");
  const [paylines, setPaylines] = useState(1);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAnimation, setSpinAnimation] = useState(false);

  const { data: balance, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const playSlotsMutation = trpc.games.playSlots.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSpin = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }

    setIsSpinning(true);
    setSpinAnimation(true);

    // Simulate spin animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const result = await playSlotsMutation.mutateAsync({
        betAmount: parseFloat(betAmount),
        paylines,
      });

      if (result.success) {
        setGameResult(result.result);
        refetchBalance();
      } else {
        alert(result.error || "Game failed");
      }
    } catch (error) {
      console.error("[Slots] Error:", error);
      alert("An error occurred");
    } finally {
      setIsSpinning(false);
      setSpinAnimation(false);
    }
  };

  const handleReset = () => {
    setGameResult(null);
    setBetAmount("1.00");
  };

  const displayReels = gameResult?.reels || [
    ["cherry", "lemon", "orange"],
    ["lemon", "orange", "plum"],
    ["orange", "plum", "bell"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pb-8">
      {/* Navigation */}
      <nav className="border-b border-cyan-400/20 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-cyan-400">Slots</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-400 text-sm">Balance</p>
              <p className="text-cyan-400 font-bold text-lg">${balance?.balance || "0.00"}</p>
            </div>
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-cyan-400/30 p-8">
              <h2 className="text-3xl font-bold text-cyan-400 mb-8 text-center">Spin the Reels</h2>

              {/* Slot Machine */}
              <div className="mb-8 p-8 bg-gradient-to-b from-yellow-900/30 to-black border-4 border-yellow-400 rounded-lg">
                {/* Reels */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {displayReels.map((reel: string[], reelIndex: number) => (
                    <div
                      key={reelIndex}
                      className={`bg-black border-4 border-cyan-400 rounded-lg p-4 text-center transition-transform ${
                        spinAnimation ? "animate-spin" : ""
                      }`}
                    >
                      <div className="space-y-2">
                        {reel.map((symbol: string, symbolIndex: number) => (
                          <div
                            key={symbolIndex}
                            className={`text-6xl p-4 rounded ${
                              symbolIndex === 1 ? "bg-cyan-400/20 border-2 border-cyan-400" : ""
                            }`}
                          >
                            {SYMBOL_EMOJIS[symbol] || symbol}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paylines Indicator */}
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-sm mb-2">Active Paylines: {paylines}</p>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i < paylines ? "bg-cyan-400" : "bg-gray-600"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Result */}
              {gameResult && (
                <div className="mb-8 p-6 bg-gradient-to-br from-green-900/30 to-black border border-green-500/50 rounded">
                  <h3 className="text-2xl font-bold text-green-400 mb-4">
                    {gameResult.winAmount > 0 ? "🎉 You Won! 🎉" : "No Match"}
                  </h3>

                  {gameResult.matchedPaylines.length > 0 && (
                    <div className="mb-6">
                      <p className="text-gray-400 text-sm mb-2">Matched Paylines: {gameResult.matchedPaylines.length}</p>
                      <div className="space-y-2">
                        {gameResult.matchedPaylines.map((payline: any, idx: number) => (
                          <div key={idx} className="p-3 bg-black/50 rounded border border-green-400/50">
                            <p className="text-green-400 font-semibold">
                              {payline.symbols.map((s: string) => SYMBOL_EMOJIS[s] || s).join(" - ")}
                            </p>
                            <p className="text-gray-400 text-sm">{payline.multiplier}x Multiplier</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-black/50 p-4 rounded border border-cyan-400/30">
                      <p className="text-gray-400 text-sm">Total Multiplier</p>
                      <p className="text-2xl font-bold text-cyan-400">{gameResult.totalMultiplier}x</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-green-400/30">
                      <p className="text-gray-400 text-sm">Win Amount</p>
                      <p className="text-2xl font-bold text-green-400">${gameResult.winAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-yellow-400/30">
                      <p className="text-gray-400 text-sm">Bet Amount</p>
                      <p className="text-2xl font-bold text-yellow-400">${betAmount}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Bet Amount */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-cyan-400/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Bet Amount</h3>
              <div className="space-y-4">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="bg-black/50 border-cyan-400/30 text-white text-lg font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  {["1.00", "5.00", "10.00", "50.00"].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Paylines */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-yellow-400/30 p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Paylines</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((line) => (
                  <Button
                    key={line}
                    onClick={() => setPaylines(line)}
                    variant={paylines === line ? "default" : "outline"}
                    className={`w-full ${
                      paylines === line
                        ? "bg-yellow-400 text-black"
                        : "border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    }`}
                  >
                    {line} Payline{line > 1 ? "s" : ""}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Spin Button */}
            <Button
              onClick={handleSpin}
              disabled={isSpinning || !betAmount}
              className="w-full h-16 bg-cyan-400 text-black hover:bg-cyan-300 text-lg font-bold disabled:opacity-50"
            >
              {isSpinning ? "Spinning..." : "SPIN"}
            </Button>

            {/* Reset Button */}
            {gameResult && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Spin Again
              </Button>
            )}

            {/* Payout Table */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-purple-400/30 p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Payouts</h3>
              <div className="space-y-2 text-sm">
                {[
                  { combo: "🍒🍒🍒", mult: "5x" },
                  { combo: "🍋🍋🍋", mult: "10x" },
                  { combo: "🍊🍊🍊", mult: "15x" },
                  { combo: "🍇🍇🍇", mult: "20x" },
                  { combo: "🔔🔔🔔", mult: "30x" },
                  { combo: "▮▮▮", mult: "50x" },
                  { combo: "7️⃣7️⃣7️⃣", mult: "100x" },
                  { combo: "💰💰💰", mult: "500x" },
                ].map(({ combo, mult }, idx) => (
                  <div key={idx} className="flex justify-between text-gray-300">
                    <span>{combo}</span>
                    <span className="text-cyan-400 font-semibold">{mult}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
