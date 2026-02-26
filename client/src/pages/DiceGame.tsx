import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DiceGame() {
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [prediction, setPrediction] = useState<"over" | "under" | "exact" | null>(null);
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [gameState, setGameState] = useState<"idle" | "rolling" | "finished">("idle");
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  const playMutation = trpc.games.playDice.useMutation();
  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const balanceAmount = balance ? parseFloat(balance.balance as any) : 0;

  const rollDice = async () => {
    if (!prediction || !balance || betAmount > balanceAmount) {
      toast.error("Select a prediction and ensure sufficient balance");
      return;
    }

    setGameState("rolling");
    const roll = Math.floor(Math.random() * 100) + 1;

    let playerWon = false;
    if (prediction === "over" && roll > targetNumber) playerWon = true;
    if (prediction === "under" && roll < targetNumber) playerWon = true;
    if (prediction === "exact" && roll === targetNumber) playerWon = true;

    setTimeout(() => {
      setDiceRoll(roll);
      setWon(playerWon);
      setGameState("finished");

      const multiplier = prediction === "exact" ? 100 : 1.98;
      const payout = playerWon ? betAmount * multiplier : 0;

      playMutation.mutate({
        betAmount,
        prediction,
        roll,
        won: playerWon,
      });

      toast.success(playerWon ? `Won $${payout.toFixed(2)}!` : "Better luck next time!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎲</div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">DICE ROLLER 2026</h1>
              <p className="text-cyan-400">Predict the outcome</p>
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
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
              <div className="flex flex-col items-center justify-center h-64">
                {diceRoll !== null ? (
                  <div className="text-center">
                    <div className="text-8xl font-bold mb-4 text-red-500">{diceRoll}</div>
                    <div className={`text-2xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                      {won ? "🎉 YOU WIN!" : "😢 YOU LOSE"}
                    </div>
                  </div>
                ) : gameState === "rolling" ? (
                  <div className="text-center">
                    <div className="text-6xl animate-bounce mb-4">🎲</div>
                    <p className="text-cyan-400">Rolling...</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <p className="text-lg">Select a prediction and roll the dice</p>
                  </div>
                )}
              </div>

              {diceRoll !== null && (
                <div className="mt-6 text-center text-sm text-gray-400">
                  <p>
                    {prediction === "over" && `You predicted OVER ${targetNumber}`}
                    {prediction === "under" && `You predicted UNDER ${targetNumber}`}
                    {prediction === "exact" && `You predicted EXACT ${targetNumber}`}
                  </p>
                  <p>Roll was: {diceRoll}</p>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-red-500/30 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-red-500 mb-6">Game Controls</h3>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => setPrediction("over")}
                  className={`w-full ${prediction === "over" ? "bg-cyan-600" : "bg-cyan-500/30"} hover:bg-cyan-600 text-white`}
                  disabled={gameState !== "idle"}
                >
                  📈 OVER
                </Button>
                <Button
                  onClick={() => setPrediction("under")}
                  className={`w-full ${prediction === "under" ? "bg-purple-600" : "bg-purple-500/30"} hover:bg-purple-600 text-white`}
                  disabled={gameState !== "idle"}
                >
                  📉 UNDER
                </Button>
                <Button
                  onClick={() => setPrediction("exact")}
                  className={`w-full ${prediction === "exact" ? "bg-yellow-600" : "bg-yellow-500/30"} hover:bg-yellow-600 text-white`}
                  disabled={gameState !== "idle"}
                >
                  🎯 EXACT
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyan-400 mb-2">Target Number (1-100)</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(parseInt(e.target.value))}
                    disabled={gameState !== "idle"}
                    className="w-full"
                  />
                  <div className="text-center text-lg font-bold text-red-500 mt-2">{targetNumber}</div>
                </div>

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
                  onClick={rollDice}
                  disabled={gameState !== "idle" || !prediction || !balance || betAmount > balanceAmount}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3"
                >
                  {gameState === "idle" ? "ROLL DICE" : "ROLLING..."}
                </Button>

                {gameState === "finished" && (
                  <Button
                    onClick={() => {
                      setGameState("idle");
                      setDiceRoll(null);
                      setPrediction(null);
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2"
                  >
                    ROLL AGAIN
                  </Button>
                )}

                <div className="text-sm text-gray-400 pt-4 border-t border-slate-600">
                  <p>Balance: ${balanceAmount.toFixed(2)}</p>
                  <p>Over/Under: 1.98x</p>
                  <p>Exact: 100x</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
