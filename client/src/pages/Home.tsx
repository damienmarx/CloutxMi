import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { Sparkles, Zap, Flame, Crown, Gem, Trophy, Shield, TrendingUp, Users, Star, Dice1, Heart, Coins } from "lucide-react";

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

const FEATURES = [
  {
    icon: Shield,
    title: "Provably Fair",
    description: "100% transparent and verifiable game outcomes"
  },
  {
    icon: Zap,
    title: "Instant Payouts",
    description: "Withdraw your winnings in seconds"
  },
  {
    icon: Crown,
    title: "VIP Rewards",
    description: "Exclusive benefits for loyal players"
  },
  {
    icon: Users,
    title: "Live Community",
    description: "Chat, compete, and win together"
  }
];

const STATS = [
  { label: "Total Wagered", value: "$12.5M+", icon: TrendingUp },
  { label: "Players", value: "10K+", icon: Users },
  { label: "Games Played", value: "500K+", icon: Dice1 },
  { label: "Win Rate", value: "96.8%", icon: Trophy },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [displayedGames, setDisplayedGames] = useState<Game[]>(GAMES);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "new" | "high-rtp">("all");

  useEffect(() => {
    const fetchGames = async () => {
      try {
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Navigation */}
      <nav className="glass-card border-0 border-b border-[var(--glass-border)] sticky top-0 z-50 rounded-none">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--neon-gold)] to-[var(--gold-dark)] rounded-xl flex items-center justify-center shadow-[0_0_30px_var(--neon-gold)] pulse-glow">
              <Crown className="text-[var(--obsidian-black)] w-7 h-7" />
            </div>
            <span className="text-3xl font-display font-bold text-gold-gradient tracking-wider">
              CloutScape
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-[var(--foreground)] font-medium">Welcome, {user?.username || user?.name}</span>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="btn-luxury"
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="btn-luxury"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setLocation("/register")}
                  className="glass-card border-2 border-[var(--neon-gold)] text-[var(--neon-gold)] hover:bg-[var(--neon-gold)]/10 font-semibold px-6 py-2 transition-all duration-300"
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
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass-card px-6 py-3 mb-8 shimmer">
              <Gem className="w-5 h-5 text-neon-gold" />
              <span className="text-[var(--neon-gold)] font-semibold">2026 Luxury Edition</span>
            </div>
            
            <h1 className="text-8xl md:text-9xl font-display font-black mb-8 tracking-tighter leading-none">
              <span className="text-gold-gradient drop-shadow-[0_0_40px_var(--neon-gold)]">
                CLOUT
              </span>
              <br />
              <span className="text-neon-gold drop-shadow-[0_0_40px_var(--neon-gold)]">
                SCAPE
              </span>
            </h1>
            
            <p className="text-3xl font-luxury text-[var(--foreground)] mb-4 font-semibold">
              Where Fortune Favors the Bold
            </p>
            <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Experience the pinnacle of crypto gaming. Provably fair, instantly rewarding, eternally luxurious.
            </p>
          </div>

          {/* CTA Buttons */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="btn-luxury text-xl px-12 py-8 h-auto"
              >
                <Zap className="w-6 h-6 mr-3" />
                Enter CloutScape
              </Button>
              <Button
                onClick={() => setLocation("/register")}
                className="glass-card border-2 border-[var(--neon-gold)] text-[var(--neon-gold)] hover:bg-[var(--neon-gold)]/10 text-xl px-12 py-8 h-auto font-display font-bold tracking-wide transition-all duration-300"
              >
                <Crown className="w-6 h-6 mr-3" />
                Join the Elite
              </Button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-20">
            {STATS.map((stat, index) => (
              <div key={index} className="stat-card float" style={{ animationDelay: `${index * 0.2}s` }}>
                <stat.icon className="w-8 h-8 text-neon-gold mb-3 mx-auto" />
                <div className="text-4xl font-display font-bold text-gold-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--muted-foreground)] font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 mb-24">
          <h2 className="text-5xl font-display font-bold text-center text-gold-gradient mb-16">
            Why CloutScape?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <div key={index} className="glass-card tilted-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[var(--neon-gold)] to-[var(--gold-dark)] rounded-2xl flex items-center justify-center pulse-glow">
                  <feature.icon className="w-8 h-8 text-[var(--obsidian-black)]" />
                </div>
                <h3 className="text-2xl font-display font-bold text-[var(--foreground)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Game Filter */}
        <section className="container mx-auto px-4 mb-12">
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={() => setSelectedFilter("all")}
              className={selectedFilter === "all" ? "btn-luxury" : "glass-card border-2 border-[var(--gold-primary)] text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10"}
            >
              All Games
            </Button>
            <Button
              onClick={() => setSelectedFilter("new")}
              className={selectedFilter === "new" ? "btn-luxury" : "glass-card border-2 border-[var(--gold-primary)] text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10"}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              New
            </Button>
            <Button
              onClick={() => setSelectedFilter("high-rtp")}
              className={selectedFilter === "high-rtp" ? "btn-luxury" : "glass-card border-2 border-[var(--gold-primary)] text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10"}
            >
              <Trophy className="w-4 h-4 mr-2" />
              High RTP
            </Button>
          </div>
        </section>

        {/* Games Grid */}
        <section className="container mx-auto px-4 mb-24">
          <h2 className="text-5xl font-display font-bold text-center text-gold-gradient mb-12">
            Featured Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedGames.map((game, index) => (
              <div
                key={game.id}
                className="game-card cursor-pointer"
                onClick={() => isAuthenticated ? setLocation(game.path) : window.location.href = getLoginUrl()}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {game.badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-[var(--neon-red)] to-[var(--neon-gold)] text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                    {game.badge}
                  </div>
                )}

                <div className="relative z-10 text-center">
                  <div className="text-7xl mb-6 inline-block transform transition-transform duration-300 hover:scale-110 hover:rotate-12">
                    {game.icon}
                  </div>

                  <h3 className="text-2xl font-display font-bold text-gold-gradient mb-3 tracking-wide">
                    {game.name}
                  </h3>

                  <p className="text-[var(--muted-foreground)] mb-6">
                    {game.description}
                  </p>

                  <div className="flex justify-center gap-4 mb-6">
                    <div className="glass-card px-4 py-2 border border-[var(--gold-primary)]">
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">RTP</div>
                      <div className="text-lg font-bold text-neon-gold">{game.rtp}</div>
                    </div>
                    <div className="glass-card px-4 py-2 border border-[var(--gold-primary)]">
                      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Risk</div>
                      <div className="text-lg font-bold text-neon-gold">{game.volatility}</div>
                    </div>
                  </div>

                  <Button className="btn-luxury w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Play Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated && (
          <section className="container mx-auto px-4 mb-24">
            <div className="glass-card p-16 text-center tilted-card max-w-4xl mx-auto border-2 border-[var(--gold-primary)]">
              <Star className="w-16 h-16 text-neon-gold mx-auto mb-6 pulse-glow" />
              <h2 className="text-5xl font-display font-bold text-gold-gradient mb-6">
                Ready to Win Big?
              </h2>
              <p className="text-xl text-[var(--foreground)] mb-8 max-w-2xl mx-auto">
                Join thousands of players already winning at CloutScape. Your fortune awaits.
              </p>
              <Button
                onClick={() => setLocation("/register")}
                className="btn-luxury text-2xl px-16 py-8 h-auto"
              >
                <Crown className="w-6 h-6 mr-3" />
                Start Playing Now
              </Button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="glass-card border-0 border-t border-[var(--glass-border)] rounded-none py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-neon-gold" />
                  <span className="text-2xl font-display font-bold text-gold-gradient">CloutScape</span>
                </div>
                <p className="text-[var(--muted-foreground)]">
                  The world's most luxurious crypto casino. Est. 2026.
                </p>
              </div>
              
              <div>
                <h4 className="font-display font-bold text-[var(--foreground)] mb-4 text-lg">Games</h4>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Slots</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Blackjack</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Roulette</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Crash</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-display font-bold text-[var(--foreground)] mb-4 text-lg">Community</h4>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Live Chat</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Leaderboards</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">VIP Program</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Rain System</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-display font-bold text-[var(--foreground)] mb-4 text-lg">Support</h4>
                <ul className="space-y-2 text-[var(--muted-foreground)]">
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Provably Fair</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-neon-gold transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-[var(--glass-border)] pt-8 text-center text-[var(--muted-foreground)]">
              <p>&copy; 2026 CloutScape. All rights reserved. Play responsibly.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
