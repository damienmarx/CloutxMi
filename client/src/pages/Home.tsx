import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const games = [
    { id: "slots-3d", name: "3D Slots", icon: "🎰", path: "/slots-3d" },
    { id: "keno", name: "Keno", icon: "🎲", path: "/keno" },
    { id: "crash", name: "Crash", icon: "📈", path: "/crash" },
    { id: "blackjack", name: "Blackjack", icon: "🎴", path: "/blackjack" },
    { id: "roulette", name: "Roulette", icon: "🎡", path: "/roulette" },
    { id: "dice", name: "Dice", icon: "🎲", path: "/dice" },
    { id: "slots", name: "Classic Slots", icon: "🎰", path: "/slots" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white overflow-y-auto">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-red-500/20 sticky top-0 z-50 shadow-lg shadow-red-500/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-pulse">🎰</span>
            <h1 className="text-3xl font-black text-red-500 tracking-wider">DEGENS DEN</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-300 hidden md:inline">Welcome, {user?.username || user?.name}</span>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="bg-red-600 hover:bg-red-700 font-bold transition-all"
                  data-testid="dashboard-btn"
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-600 hover:text-white font-semibold"
                  data-testid="login-btn"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setLocation("/register")}
                  className="bg-red-600 hover:bg-red-700 font-bold"
                  data-testid="register-btn"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center max-w-6xl">
        <div className="animate-fade-in">
          <h2 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-red-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
            DEGENS DEN
          </h2>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-bold">
            The Ultimate Crypto Casino
          </p>
          <p className="text-lg text-gray-400 mb-10">
            🎲 Play Provably Fair Games • 💰 Instant Payouts • 👑 VIP Rewards
          </p>
          {!isAuthenticated && (
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white text-xl font-bold px-12 py-8 rounded-xl shadow-2xl shadow-red-500/50 transform hover:scale-105 transition-all"
              data-testid="hero-register-btn"
            >
              🚀 Start Playing Now
            </Button>
          )}
        </div>
      </section>

      {/* Games Grid */}
      <section className="container mx-auto px-4 py-16 max-w-7xl" data-testid="games-section">
        <h3 className="text-4xl font-black mb-12 text-center bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
          🎮 PLAY NOW
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => isAuthenticated ? setLocation(game.path) : window.location.href = getLoginUrl()}
              className="group bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-red-500/30 rounded-2xl p-8 cursor-pointer hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/30 transform hover:-translate-y-2 transition-all duration-300"
              data-testid={`game-card-${game.id}`}
            >
              <div className="text-6xl mb-6 text-center transform group-hover:scale-110 transition-transform">
                {game.icon}
              </div>
              <h4 className="text-2xl font-bold mb-2 text-red-400 text-center group-hover:text-red-300">
                {game.name}
              </h4>
              <div className="text-center mt-4">
                <span className="inline-block bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full">
                  Play Now →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-all">
            <div className="text-6xl mb-4">🔒</div>
            <h4 className="text-2xl font-bold mb-3 text-red-400">Provably Fair</h4>
            <p className="text-gray-400 text-lg">Every game result is verifiable with cryptographic proof</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-all">
            <div className="text-6xl mb-4">⚡</div>
            <h4 className="text-2xl font-bold mb-3 text-red-400">Instant Payouts</h4>
            <p className="text-gray-400 text-lg">Withdraw your winnings in seconds, no delays</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-all">
            <div className="text-6xl mb-4">👑</div>
            <h4 className="text-2xl font-bold mb-3 text-red-400">VIP Rewards</h4>
            <p className="text-gray-400 text-lg">Exclusive cashback and bonuses for loyal players</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 backdrop-blur-sm border border-red-500/30 rounded-3xl p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-red-400 mb-2">$1M+</div>
              <div className="text-gray-400">Total Wagered</div>
            </div>
            <div>
              <div className="text-4xl font-black text-red-400 mb-2">5K+</div>
              <div className="text-gray-400">Active Players</div>
            </div>
            <div>
              <div className="text-4xl font-black text-red-400 mb-2">98%</div>
              <div className="text-gray-400">Average RTP</div>
            </div>
            <div>
              <div className="text-4xl font-black text-red-400 mb-2">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="container mx-auto px-4 py-20 text-center max-w-4xl">
          <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
            <h3 className="text-5xl font-black mb-6 text-white">Ready to Win Big?</h3>
            <p className="text-xl text-white/90 mb-8">Join thousands of players already winning at Degens Den</p>
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-white text-red-600 hover:bg-gray-100 text-2xl font-black px-16 py-8 rounded-2xl transform hover:scale-105 transition-all"
              data-testid="cta-register-btn"
            >
              🎰 Sign Up Now
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-black border-t border-red-500/20 mt-20 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h5 className="text-xl font-bold text-red-400 mb-4">Degens Den</h5>
              <p className="text-gray-400">The ultimate crypto casino experience</p>
            </div>
            <div>
              <h5 className="text-lg font-bold text-white mb-4">Games</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/slots-3d" className="hover:text-red-400">3D Slots</a></li>
                <li><a href="/crash" className="hover:text-red-400">Crash</a></li>
                <li><a href="/blackjack" className="hover:text-red-400">Blackjack</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-bold text-white mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/legal" className="hover:text-red-400">Legal</a></li>
                <li><a href="#" className="hover:text-red-400">Terms</a></li>
                <li><a href="#" className="hover:text-red-400">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-bold text-white mb-4">Connect</h5>
              <p className="text-gray-400">Join our community on Discord</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Degens Den. All rights reserved. Play responsibly. 18+</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
