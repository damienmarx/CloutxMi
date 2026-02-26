import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { Sparkles, Zap, Flame, Crown } from "lucide-react";

interface Game {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  badge?: string;
  rtp: string;
  volatility: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
}

const GAMES: Game[] = [
  {
    id: "slots-3d",
    name: "3D CLOUT SLOTS",
    icon: "⚡",
    description: "Immersive 3D experience with Provable Fairness",
    path: "/slots-3d",
    badge: "NEW",
    rtp: "98.5%",
    volatility: "EXTREME",
  },
  {
    id: "keno",
    name: "KENO",
    icon: "🎲",
    description: "Pick your numbers and watch them get drawn",
    path: "/keno",
    rtp: "96.0%",
    volatility: "HIGH",
  },
  {
    id: "crash",
    name: "CRASH",
    icon: "📈",
    description: "Ride the multiplier before it crashes",
    path: "/crash",
    rtp: "97.0%",
    volatility: "EXTREME",
  },
  {
    id: "blackjack",
    name: "BLACKJACK",
    icon: "🎴",
    description: "Beat the dealer to 21",
    path: "/blackjack",
    rtp: "99.5%",
    volatility: "LOW",
  },
  {
    id: "roulette",
    name: "ROULETTE",
    icon: "🎡",
    description: "Spin the wheel and test your luck",
    path: "/roulette",
    rtp: "97.3%",
    volatility: "MEDIUM",
  },
  {
    id: "dice",
    name: "DICE",
    icon: "🎲",
    description: "Roll high, roll low, or roll exact",
    path: "/dice",
    rtp: "98.0%",
    volatility: "HIGH",
  },
  {
    id: "slots",
    name: "CLASSIC SLOTS",
    icon: "🎰",
    description: "Traditional slots with multiple paylines",
    path: "/slots",
    rtp: "96.5%",
    volatility: "MEDIUM",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [displayedGames, setDisplayedGames] = useState<Game[]>(GAMES);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "new" | "high-rtp">("all");

  // Simulate API call to fetch games dynamically
  useEffect(() => {
    const fetchGames = async () => {
      // This is the API stub - in production, this would call your backend
      try {
        // const response = await fetch('/api/games');
        // const data = await response.json();
        // setDisplayedGames(data);
        
        // For now, filter locally
        let filtered = GAMES;
        if (selectedFilter === "new") {
          filtered = GAMES.filter(g => g.badge === "NEW");
        } else if (selectedFilter === "high-rtp") {
          filtered = GAMES.filter(g => parseFloat(g.rtp) >= 98);
        }
        setDisplayedGames(filtered);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      }
    };

    fetchGames();
  }, [selectedFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-red-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <Crown className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              ♧ Degens Den
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-300">Welcome, {user?.name || user?.email}</span>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setLocation("/register")}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mb-12">
            <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tighter">
              <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent drop-shadow-lg">
                DEGENS ♧ DEN
              </span>
            </h1>
            <p className="text-2xl text-gray-300 mb-2">Where Legends Are Made</p>
            <p className="text-gray-400">High-stakes OSRS-themed crypto casino for the fearless</p>
          </div>

          {/* CTA Buttons */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-lg font-bold rounded-lg shadow-lg shadow-red-500/50 h-auto"
              >
                <Zap className="w-5 h-5 mr-2" />
                Enter the Den
              </Button>
              <Button
                onClick={() => setLocation("/register")}
                variant="outline"
                className="border-2 border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-6 text-lg font-bold rounded-lg h-auto"
              >
                Create Account
              </Button>
            </div>
          )}
        </section>

        {/* Game Filter */}
        {isAuthenticated && (
          <section className="container mx-auto px-4 mb-12">
            <div className="flex justify-center gap-4 flex-wrap">
              <Button
                onClick={() => setSelectedFilter("all")}
                variant={selectedFilter === "all" ? "default" : "outline"}
                className={selectedFilter === "all" ? "bg-red-600 hover:bg-red-700" : "border-red-500 text-red-500"}
              >
                All Games
              </Button>
              <Button
                onClick={() => setSelectedFilter("new")}
                variant={selectedFilter === "new" ? "default" : "outline"}
                className={selectedFilter === "new" ? "bg-red-600 hover:bg-red-700" : "border-red-500 text-red-500"}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                New
              </Button>
              <Button
                onClick={() => setSelectedFilter("high-rtp")}
                variant={selectedFilter === "high-rtp" ? "default" : "outline"}
                className={selectedFilter === "high-rtp" ? "bg-red-600 hover:bg-red-700" : "border-red-500 text-red-500"}
              >
                High RTP
              </Button>
            </div>
          </section>
        )}

        {/* Games Grid */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedGames.map((game) => (
              <div
                key={game.id}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-lg p-6 hover:border-red-500 transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] relative overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 transition-all"></div>

                <div className="relative z-10">
                  {game.badge && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-tighter">
                      {game.badge}
                    </div>
                  )}

                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {game.icon}
                  </div>

                  <h3 className="text-xl font-bold text-red-500 mb-2 italic">
                    {game.name}
                  </h3>

                  <p className="text-gray-300 text-sm mb-4">{game.description}</p>

                  {/* Game Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-slate-700/50 rounded p-2">
                      <p className="text-gray-400">RTP</p>
                      <p className="text-green-400 font-bold">{game.rtp}</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <p className="text-gray-400">Volatility</p>
                      <p className={`font-bold ${
                        game.volatility === "EXTREME" ? "text-red-500" :
                        game.volatility === "HIGH" ? "text-orange-500" :
                        game.volatility === "MEDIUM" ? "text-yellow-500" :
                        "text-green-500"
                      }`}>
                        {game.volatility}
                      </p>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <Button
                      onClick={() => setLocation(game.path)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 rounded transition-all group-hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                      PLAY NOW
                    </Button>
                  ) : (
                    <Button
                      onClick={() => (window.location.href = getLoginUrl())}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 rounded"
                    >
                      PLAY NOW
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-black/30 py-16 border-y border-red-500/20 mb-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Why Degens Den?
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🔐", title: "Secure", desc: "Military-grade encryption & provably fair games" },
                { icon: "⚡", title: "Instant", desc: "Real-time payouts to your wallet" },
                { icon: "🎯", title: "Fair", desc: "Provably fair RNG verified on-chain" },
                { icon: "💎", title: "Premium", desc: "Exclusive VIP rewards & bonuses" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-red-500/20 rounded-lg p-6 hover:border-red-500/50 transition"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-white mb-2 text-lg">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section for Authenticated Users */}
        {isAuthenticated && (
          <section className="container mx-auto px-4 py-16 text-center mb-20">
            <h2 className="text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Ready to Play?
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation("/slots-3d")}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-lg font-bold rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.5)] h-auto"
              >
                <Flame className="w-5 h-5 mr-2" />
                Play 3D Slots
              </Button>
              <Button
                onClick={() => setLocation("/keno")}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-lg font-bold rounded-lg h-auto"
              >
                Play Keno
              </Button>
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="border-2 border-red-500 text-red-500 hover:bg-red-500/10 px-8 py-6 text-lg font-bold rounded-lg h-auto"
              >
                View Wallet
              </Button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-red-500/20 bg-black/50 py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p className="mb-2">© 2026 Degens ♧ Den. All rights reserved.</p>
            <p className="text-sm">Play responsibly. Must be 18+</p>
            <p className="text-xs mt-4 text-gray-500">
              Powered by Manus AI | OSRS-Themed Crypto Casino Platform
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
