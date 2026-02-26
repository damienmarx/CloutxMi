import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function RouletteGame() {
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedBet, setSelectedBet] = useState<"red" | "black" | "even" | "odd" | null>(null);
  const [gameState, setGameState] = useState<"idle" | "spinning" | "finished">("idle");
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [resultColor, setResultColor] = useState<"red" | "black" | null>(null);
  const [won, setWon] = useState(false);

  const playMutation = trpc.games.playRoulette.useMutation();
  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const balanceAmount = balance ? parseFloat(balance.balance as any) : 0;

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const spinWheel = async () => {
    if (!selectedBet || !balance || betAmount > balanceAmount) {
      toast.error("Select a bet and ensure sufficient balance");
      return;
    }

    setGameState("spinning");
    const winningNumber = Math.floor(Math.random() * 37);
    const isRed = redNumbers.includes(winningNumber);
    const isBlack = blackNumbers.includes(winningNumber);
    const isEven = winningNumber % 2 === 0 && winningNumber !== 0;
    const isOdd = winningNumber % 2 !== 0;

    let playerWon = false;
    if (selectedBet === "red" && isRed) playerWon = true;
    if (selectedBet === "black" && isBlack) playerWon = true;
    if (selectedBet === "even" && isEven) playerWon = true;
    if (selectedBet === "odd" && isOdd) playerWon = true;

    const spinDegrees = 360 * 5 + winningNumber * 10;
    setWheelRotation(spinDegrees);

    setTimeout(() => {
      setResult(winningNumber);
      setResultColor(isRed ? "red" : "black");
      setWon(playerWon);
      setGameState("finished");

      const payout = playerWon ? betAmount * 2 : 0;

      playMutation.mutate({
        betAmount,
        betType: selectedBet,
        winningNumber,
        won: playerWon,
      });

      toast.success(playerWon ? `Won $${payout.toFixed(2)}!` : "Better luck next time!");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎡</div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">ROULETTE 2026</h1>
              <p className="text-cyan-400">Spin to win</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Back
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8 flex items-center justify-center h-96">
              <div
                className="relative w-64 h-64 rounded-full border-8 border-red-500 bg-gradient-to-br from-red-600 to-black flex items-center justify-center transition-transform"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transitionDuration: gameState === "spinning" ? "3s" : "0s",
                }}
              >
                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                  {result !== null && (
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${resultColor === "red" ? "text-red-400" : "text-gray-300"}`}>
                        {result}
                      </div>
                      <div className={`text-sm ${resultColor === "red" ? "text-red-400" : "text-gray-400"}`}>
                        {resultColor?.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400"></div>
            </Card>
          </div>

          <div>
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-red-500/30 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-red-500 mb-6">Place Your Bet</h3>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => setSelectedBet("red")}
                  className={`w-full ${selectedBet === "red" ? "bg-red-600" : "bg-red-500/30"} hover:bg-red-600 text-white`}
                  disabled={gameState !== "idle"}
                >
                  🔴 RED (2:1)
                </Button>
                <Button
                  onClick={() => setSelectedBet("black")}
                  className={`w-full ${selectedBet === "black" ? "bg-gray-700" : "bg-gray-600/30"} hover:bg-gray-700 text-white`}
                  disabled={gameState !== "idle"}
                >
                  ⚫ BLACK (2:1)
                </Button>
                <Button
                  onClick={() => setSelectedBet("even")}
                  className={`w-full ${selectedBet === "even" ? "bg-cyan-600" : "bg-cyan-500/30"} hover:bg-cyan-600 text-white`}
                  disabled={gameState !== "idle"}
                >
                  🔢 EVEN (2:1)
                </Button>
                <Button
                  onClick={() => setSelectedBet("odd")}
                  className={`w-full ${selectedBet === "odd" ? "bg-purple-600" : "bg-purple-500/30"} hover:bg-purple-600 text-white`}
                  disabled={gameState !== "idle"}
                >
                  🔢 ODD (2:1)
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyan-400 mb-2">Bet Amount</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    disabled={gameState !== "idle"}
                    className="w-full bg-slate-700 border border-cyan-500/30 text-white p-2 rounded"
                    min="1"
                  />
                </div>

                <Button
                  onClick={spinWheel}
                  disabled={gameState !== "idle" || !selectedBet || !balance || betAmount > balanceAmount}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3"
                >
                  {gameState === "idle" ? "SPIN" : "SPINNING..."}
                </Button>

                {gameState === "finished" && (
                  <Button
                    onClick={() => {
                      setGameState("idle");
                      setResult(null);
                      setSelectedBet(null);
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2"
                  >
                    SPIN AGAIN
                  </Button>
                )}

                <div className="text-sm text-gray-400 pt-4 border-t border-slate-600">
                  <p>Balance: ${balanceAmount.toFixed(2)}</p>
                  <p>Payout: 2x</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
