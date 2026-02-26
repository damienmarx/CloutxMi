import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface CardType {
  suit: string;
  rank: string;
  value: number;
}

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const getCardValue = (rank: string): number => {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
};

const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank),
      });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateHandValue = (hand: CardType[]): { value: number; isBust: boolean } => {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    value += card.value;
    if (card.rank === "A") aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return { value, isBust: value > 21 };
};

const formatHand = (hand: CardType[]): string => {
  return hand.map((c) => `${c.rank}${c.suit}`).join(" ");
};

export default function BlackjackGame() {
  const [, setLocation] = useLocation();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [result, setResult] = useState<"win" | "loss" | "push" | null>(null);
  const [message, setMessage] = useState<string>("");
  const [canDouble, setCanDouble] = useState(false);

  const playMutation = trpc.games.playBlackjack.useMutation();
  const { data: balance, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const balanceAmount = balance ? parseFloat(balance.balance as any) : 0;

  const startGame = async () => {
    if (!balance || betAmount > balanceAmount) {
      toast.error("Insufficient balance");
      return;
    }

    const newDeck = createDeck();
    const playerCards = [newDeck.pop()!, newDeck.pop()!];
    const dealerCards = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);
    setGameState("playing");
    setResult(null);
    setMessage("");
    setCanDouble(true);

    // Check for blackjack
    const playerValue = calculateHandValue(playerCards);
    if (playerValue.value === 21) {
      endGame(playerCards, dealerCards, newDeck, "blackjack");
    }
  };

  const hit = () => {
    if (deck.length === 0) return;

    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(deck);
    setCanDouble(false);

    const { value, isBust } = calculateHandValue(newHand);
    if (isBust) {
      endGame(newHand, dealerHand, deck, "bust");
    }
  };

  const stand = () => {
    dealerTurn(playerHand, dealerHand, deck);
  };

  const doubleDown = () => {
    if (!canDouble || betAmount * 2 > balanceAmount) {
      toast.error("Cannot double down");
      return;
    }

    setBetAmount(betAmount * 2);
    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(deck);
    setCanDouble(false);

    const { isBust } = calculateHandValue(newHand);
    if (isBust) {
      endGame(newHand, dealerHand, deck, "bust");
    } else {
      dealerTurn(newHand, dealerHand, deck);
    }
  };

  const dealerTurn = (pHand: CardType[], dHand: CardType[], remainingDeck: CardType[]) => {
    let dealerCards = [...dHand];
    let newDeck = [...remainingDeck];

    while (true) {
      const { value } = calculateHandValue(dealerCards);
      if (value >= 17) break;
      dealerCards.push(newDeck.pop()!);
    }

    setDealerHand(dealerCards);
    determineWinner(pHand, dealerCards);
  };

  const determineWinner = (pHand: CardType[], dHand: CardType[]) => {
    const playerValue = calculateHandValue(pHand);
    const dealerValue = calculateHandValue(dHand);

    let gameResult: "win" | "loss" | "push";
    let msg: string;

    if (dealerValue.isBust) {
      gameResult = "win";
      msg = "Dealer bust! You win!";
    } else if (playerValue.value > dealerValue.value) {
      gameResult = "win";
      msg = "You win!";
    } else if (playerValue.value < dealerValue.value) {
      gameResult = "loss";
      msg = "Dealer wins!";
    } else {
      gameResult = "push";
      msg = "Push!";
    }

    endGame(pHand, dHand, [], gameResult, msg);
  };

  const endGame = (
    pHand: CardType[],
    dHand: CardType[],
    remainingDeck: CardType[],
    gameResult: "win" | "loss" | "push" | "blackjack" | "bust",
    customMsg?: string
  ) => {
    let finalResult: "win" | "loss" | "push";
    let msg: string;

    if (gameResult === "blackjack") {
      finalResult = "win";
      msg = "Blackjack! You win!";
    } else if (gameResult === "bust") {
      finalResult = "loss";
      msg = "Bust! You lose!";
    } else {
      finalResult = gameResult;
      msg = customMsg || "";
    }

    setResult(finalResult);
    setMessage(msg);
    setGameState("finished");

    // Record game result
    playMutation.mutate({
      betAmount,
      playerHand: formatHand(pHand),
      dealerHand: formatHand(dHand),
      result: finalResult,
    });

    refetchBalance();
    toast.success(msg);
  };

  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎴</div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">BLACKJACK</h1>
              <p className="text-cyan-400">Beat the dealer to 21</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dealer's Hand */}
            <Card className="bg-gradient-to-br from-green-900/50 to-green-950/50 border-cyan-500/30 p-8">
              <h3 className="text-cyan-400 text-lg mb-4 font-bold">Dealer's Hand</h3>
              <div className="flex items-end justify-between">
                <div className="text-5xl font-bold text-white">{formatHand(dealerHand)}</div>
                {gameState !== "idle" && (
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className={`text-3xl font-bold ${dealerValue.isBust ? "text-red-400" : "text-cyan-400"}`}>
                      {dealerValue.value}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Player's Hand */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/30 p-8">
              <h3 className="text-red-400 text-lg mb-4 font-bold">Your Hand</h3>
              <div className="flex items-end justify-between">
                <div className="text-5xl font-bold text-white">{formatHand(playerHand)}</div>
                {gameState !== "idle" && (
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className={`text-3xl font-bold ${playerValue.isBust ? "text-red-400" : "text-green-400"}`}>
                      {playerValue.value}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Result Message */}
            {result && (
              <Card
                className={`p-6 border-0 text-center text-2xl font-bold ${
                  result === "win"
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
                    : result === "push"
                      ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white"
                      : "bg-gradient-to-r from-red-600 to-red-700 text-white"
                }`}
              >
                {message}
              </Card>
            )}

            {/* Action Buttons */}
            {gameState === "playing" && (
              <div className="flex gap-3">
                <Button
                  onClick={hit}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold py-3"
                >
                  HIT
                </Button>
                <Button
                  onClick={stand}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-3"
                >
                  STAND
                </Button>
                <Button
                  onClick={doubleDown}
                  disabled={!canDouble || betAmount * 2 > balanceAmount}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 disabled:opacity-50"
                >
                  DOUBLE DOWN
                </Button>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div>
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/30 p-6 sticky top-4 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-red-500 mb-4">Game Controls</h3>

                {/* Bet Amount */}
                <div className="mb-4">
                  <label className="block text-sm text-cyan-400 mb-2">Bet Amount</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    disabled={gameState !== "idle"}
                    className="w-full bg-slate-700 border border-cyan-500/30 text-white p-2 rounded"
                    min="1"
                    step="1"
                  />
                </div>

                {/* Deal Button */}
                <Button
                  onClick={startGame}
                  disabled={gameState !== "idle" || !balance || betAmount > balanceAmount}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 mb-4"
                >
                  {gameState === "idle" ? "DEAL" : "PLAYING..."}
                </Button>

                {/* Play Again Button */}
                {gameState === "finished" && (
                  <Button
                    onClick={() => {
                      setGameState("idle");
                      setResult(null);
                      setPlayerHand([]);
                      setDealerHand([]);
                      setMessage("");
                    }}
                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold py-2"
                  >
                    PLAY AGAIN
                  </Button>
                )}

                {/* Stats */}
                <div className="text-sm text-gray-400 pt-4 border-t border-slate-600 space-y-2">
                  <p>Balance: <span className="text-cyan-400 font-bold">${balanceAmount.toFixed(2)}</span></p>
                  <p>Bet: <span className="text-yellow-400 font-bold">${betAmount.toFixed(2)}</span></p>
                  {result === "win" && <p>Payout: <span className="text-green-400 font-bold">${(betAmount * 2).toFixed(2)}</span></p>}
                </div>
              </div>

              {/* Rules */}
              <div className="pt-4 border-t border-slate-600">
                <h4 className="text-cyan-400 font-bold mb-2 text-sm">📋 Rules</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Get closer to 21 than dealer</li>
                  <li>• Ace = 1 or 11</li>
                  <li>• Hit: Take another card</li>
                  <li>• Stand: Keep your total</li>
                  <li>• Bust: Over 21 = Loss</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
