import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, ArrowLeft, RotateCcw } from "lucide-react";

export default function KenoGame() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // Game state
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState("1.00");
  const [turboMode, setTurboMode] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: balance, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const playKenoMutation = trpc.games.playKeno.useMutation();

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

  const handleNumberClick = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else if (selectedNumbers.length < 10) {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  const handlePlayKeno = async () => {
    if (selectedNumbers.length === 0) {
      alert("Please select at least one number");
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }

    setIsPlaying(true);
    try {
      const result = await playKenoMutation.mutateAsync({
        selectedNumbers,
        betAmount: parseFloat(betAmount),
        turboMode,
      });

      if (result.success) {
        setGameResult(result.result);
        refetchBalance();
      } else {
        alert(result.error || "Game failed");
      }
    } catch (error) {
      console.error("[Keno] Error:", error);
      alert("An error occurred");
    } finally {
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setSelectedNumbers([]);
    setGameResult(null);
    setBetAmount("1.00");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pb-8">
      {/* Navigation */}
      <nav className="border-b border-yellow-400/20 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">Keno</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-400 text-sm">Balance</p>
              <p className="text-yellow-400 font-bold text-lg">${balance?.balance || "0.00"}</p>
            </div>
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
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
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-yellow-400/30 p-8">
              <h2 className="text-3xl font-bold text-yellow-400 mb-6">Select Your Numbers</h2>
              <p className="text-gray-300 mb-6">Pick 1-10 numbers from 1-80</p>

              {/* Number Grid */}
              <div className="grid grid-cols-10 gap-2 mb-8">
                {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className={`aspect-square rounded font-bold text-sm transition-all ${
                      selectedNumbers.includes(num)
                        ? "bg-yellow-400 text-black scale-110 shadow-lg shadow-yellow-400/50"
                        : "bg-black/50 border border-yellow-400/30 text-yellow-400 hover:border-yellow-400/60"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Selected Numbers Display */}
              <div className="mb-8 p-4 bg-black/50 rounded border border-yellow-400/30">
                <p className="text-gray-400 text-sm mb-2">Selected Numbers ({selectedNumbers.length}/10)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNumbers.length > 0 ? (
                    selectedNumbers.sort((a, b) => a - b).map((num) => (
                      <span key={num} className="px-3 py-1 bg-yellow-400 text-black rounded font-semibold text-sm">
                        {num}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No numbers selected</p>
                  )}
                </div>
              </div>

              {/* Game Result */}
              {gameResult && (
                <div className="mb-8 p-6 bg-gradient-to-br from-green-900/30 to-black border border-green-500/50 rounded">
                  <h3 className="text-2xl font-bold text-green-400 mb-4">Game Result</h3>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Drawn Numbers ({gameResult.drawnNumbers.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {gameResult.drawnNumbers.map((num: number) => (
                          <span
                            key={num}
                            className={`px-3 py-1 rounded font-semibold text-sm ${
                              gameResult.matchedNumbers.includes(num)
                                ? "bg-green-400 text-black"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm mb-2">Matched Numbers ({gameResult.matchedCount})</p>
                      <div className="flex flex-wrap gap-2">
                        {gameResult.matchedNumbers.length > 0 ? (
                          gameResult.matchedNumbers.map((num: number) => (
                            <span key={num} className="px-3 py-1 bg-green-400 text-black rounded font-semibold text-sm">
                              {num}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500">No matches</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-black/50 p-4 rounded border border-yellow-400/30">
                      <p className="text-gray-400 text-sm">Multiplier</p>
                      <p className="text-2xl font-bold text-yellow-400">{gameResult.multiplier}x</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-green-400/30">
                      <p className="text-gray-400 text-sm">Win Amount</p>
                      <p className="text-2xl font-bold text-green-400">${gameResult.winAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-cyan-400/30">
                      <p className="text-gray-400 text-sm">Bet Amount</p>
                      <p className="text-2xl font-bold text-cyan-400">${betAmount}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Bet Amount */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-yellow-400/30 p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Bet Amount</h3>
              <div className="space-y-4">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="bg-black/50 border-yellow-400/30 text-white text-lg font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  {["1.00", "5.00", "10.00", "50.00"].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      variant="outline"
                      className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Turbo Mode */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-cyan-400/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Game Mode</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={turboMode}
                  onChange={(e) => setTurboMode(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-white">Turbo Mode (Faster Results)</span>
              </label>
            </Card>

            {/* Play Button */}
            <Button
              onClick={handlePlayKeno}
              disabled={selectedNumbers.length === 0 || isPlaying || !betAmount}
              className="w-full h-16 bg-yellow-400 text-black hover:bg-yellow-300 text-lg font-bold disabled:opacity-50"
            >
              {isPlaying ? "Playing..." : "Play Keno"}
            </Button>

            {/* Reset Button */}
            {gameResult && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            )}

            {/* Payout Table */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-black border-purple-400/30 p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Payout Table</h3>
              <div className="space-y-2 text-sm">
                {[
                  { matches: 2, mult: "1x" },
                  { matches: 3, mult: "2x" },
                  { matches: 4, mult: "5x" },
                  { matches: 5, mult: "10x" },
                  { matches: 6, mult: "25x" },
                  { matches: 7, mult: "50x" },
                  { matches: 8, mult: "100x" },
                  { matches: 9, mult: "250x" },
                  { matches: 10, mult: "500x" },
                ].map(({ matches, mult }) => (
                  <div key={matches} className="flex justify-between text-gray-300">
                    <span>{matches} Matches</span>
                    <span className="text-yellow-400 font-semibold">{mult}</span>
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
