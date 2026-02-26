import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, ArrowLeft, RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";

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

export default function Slots3DGame() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // Game state
  const [betAmount, setBetAmount] = useState("10.00");
  const [clientSeed, setClientSeed] = useState(Math.random().toString(36).substring(7));
  const [nonce, setNonce] = useState(0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showFairness, setShowFairness] = useState(false);

  const { data: balance, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const play3DSlotsMutation = trpc.games.playSlots.useMutation();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) { setLocation("/login"); return null; }

  const handleSpin = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    setIsSpinning(true);
    
    try {
      const result = await play3DSlotsMutation.mutateAsync({
        betAmount: parseFloat(betAmount),
        clientSeed,
        nonce,
      });

      if (result.success) {
        // Delay result for animation feel
        await new Promise(r => setTimeout(r, 1500));
        setGameResult(result.result);
        setNonce(prev => prev + 1);
        refetchBalance();
        if (result.result.winAmount > 0) {
          toast.success(`🎉 BIG WIN: $${result.result.winAmount.toFixed(2)}!`);
        }
      } else {
        toast.error(result.error || "Game failed");
      }
    } catch (error) {
      console.error("[3D Slots] Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSpinning(false);
    }
  };

  const displayReels = gameResult?.reels || [
    ["gold", "seven", "bar"],
    ["seven", "bar", "bell"],
    ["bar", "bell", "plum"],
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-12 overflow-x-hidden">
      {/* Provocative Header */}
      <nav className="border-b border-red-500/30 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
              <Zap className="text-white fill-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-red-500">
              CLOUT SLOTS 3D
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest">Live Balance</p>
              <p className="text-2xl font-mono font-bold text-white">${balance?.balance || "0.00"}</p>
            </div>
            <Button onClick={() => setLocation("/dashboard")} variant="ghost" className="text-red-500 hover:bg-red-500/10 border border-red-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> EXIT
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* 3D Visual Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative group">
              {/* Neon Glow Background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              
              <Card className="relative bg-black border-red-500/40 p-12 overflow-hidden rounded-2xl shadow-2xl">
                {/* 3D Reel Container */}
                <div className="grid grid-cols-3 gap-8 perspective-1000">
                  {displayReels.map((reel: string[], i: number) => (
                    <div key={i} className={`relative h-[450px] bg-gradient-to-b from-zinc-900 to-black border-x-2 border-red-500/20 rounded-xl overflow-hidden shadow-inner ${isSpinning ? 'animate-slot-spin' : ''}`}>
                      <div className="absolute inset-0 flex flex-col justify-around py-4">
                        {reel.map((symbol, j) => (
                          <div key={j} className={`flex flex-col items-center justify-center transition-all duration-500 ${j === 1 ? 'scale-125 z-10' : 'opacity-40 grayscale'}`}>
                            <span className="text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{SYMBOL_EMOJIS[symbol]}</span>
                            {j === 1 && <div className="mt-2 text-xs font-black text-red-500 uppercase tracking-tighter">{symbol}</div>}
                          </div>
                        ))}
                      </div>
                      {/* Glass Reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                    </div>
                  ))}
                </div>

                {/* Win Overlay */}
                {gameResult?.winAmount > 0 && !isSpinning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-600/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="text-center">
                      <h2 className="text-8xl font-black text-white drop-shadow-2xl italic tracking-tighter">WINNER</h2>
                      <p className="text-5xl font-mono font-bold text-yellow-400 mt-4">${gameResult.winAmount.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Provable Fairness Info */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
              <button onClick={() => setShowFairness(!showFairness)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-widest">Provably Fair System Active</span>
              </button>
              
              {showFairness && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Client Seed</p>
                    <p className="text-xs font-mono bg-black p-2 rounded border border-white/10 truncate">{clientSeed}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Nonce</p>
                    <p className="text-xs font-mono bg-black p-2 rounded border border-white/10">{nonce}</p>
                  </div>
                  {gameResult?.provable && (
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Result Hash (SHA-256)</p>
                      <p className="text-xs font-mono bg-black p-2 rounded border border-white/10 break-all">{gameResult.provable.hash}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Betting Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-zinc-900 border-red-500/20 p-8 rounded-2xl">
              <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tighter italic">Command Center</h3>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Wager Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">$</span>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="bg-black border-zinc-800 text-white text-2xl font-mono font-bold pl-8 h-16 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["10", "50", "100", "500"].map(amt => (
                      <button key={amt} onClick={() => setBetAmount(amt)} className="py-2 bg-zinc-800 hover:bg-red-600 text-[10px] font-black rounded transition-colors">
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Client Seed</label>
                  <Input
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    className="bg-black border-zinc-800 text-zinc-400 font-mono text-sm h-12"
                  />
                </div>

                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || !betAmount}
                  className="w-full h-24 bg-red-600 hover:bg-red-500 text-white text-3xl font-black italic tracking-tighter shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSpinning ? "SPINNING..." : "SPIN REELS"}
                </Button>

                <div className="pt-6 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-bold uppercase">RTP</span>
                    <span className="text-green-500 font-bold">98.5%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-bold uppercase">Volatility</span>
                    <span className="text-red-500 font-bold">EXTREME</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Wins Ticker */}
            <Card className="bg-black border-zinc-800 p-6 rounded-2xl">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Live Winners</h4>
              <div className="space-y-4">
                {[
                  { user: "CloutKing", win: 1250, game: "3D Slots" },
                  { user: "No6love9", win: 450, game: "Crash" },
                  { user: "ManusAI", win: 8900, game: "3D Slots" }
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div>
                      <p className="text-xs font-bold text-white">{w.user}</p>
                      <p className="text-[10px] text-zinc-500">{w.game}</p>
                    </div>
                    <p className="text-sm font-mono font-bold text-green-500">+${w.win}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        @keyframes slot-spin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-20px); }
        }
        .animate-slot-spin {
          animation: slot-spin 0.1s linear infinite;
        }
      `}</style>
    </div>
  );
}
