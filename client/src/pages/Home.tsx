import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Dices, TrendingUp, LayoutGrid, Triangle, Rows3, Spade, Circle,
  Shield, Zap, Crown, Users, Trophy, BarChart3, ArrowRight, MessageSquare,
  ChevronRight
} from "lucide-react";

const games = [
  { id: "dice",     name: "Dice",         icon: Dices,       path: "/dice",        badge: "Popular",   desc: "High / Low / Exact" },
  { id: "crash",    name: "Crash",        icon: TrendingUp,  path: "/crash",       badge: "Live",      desc: "Cash out before crash" },
  { id: "plinko",   name: "Plinko",       icon: Triangle,    path: "/plinko",      badge: "New",       desc: "16-level physics board" },
  { id: "keno",     name: "Keno",         icon: LayoutGrid,  path: "/keno",        badge: "",          desc: "Pick up to 10 numbers" },
  { id: "slots-3d", name: "3D Slots",     icon: Rows3,       path: "/slots-3d",    badge: "OSRS",      desc: "5-reel OSRS themed" },
  { id: "blackjack",name: "Blackjack",    icon: Spade,       path: "/blackjack",   badge: "",          desc: "Classic 3:2 payout" },
  { id: "roulette", name: "Roulette",     icon: Circle,      path: "/roulette",    badge: "",          desc: "European wheel" },
];

const features = [
  { icon: Shield, title: "Provably Fair", desc: "Every result verifiable via HMAC-SHA256. Full transparency.", color: "text-amber-400", glow: "rgba(251,191,36,0.3)" },
  { icon: Zap,    title: "Instant Payouts", desc: "Withdraw winnings in seconds. No delays, no excuses.", color: "text-green-400", glow: "rgba(74,222,128,0.3)" },
  { icon: Crown,  title: "VIP Rewards",  desc: "5-tier loyalty program. Bronze → Diamond. Exclusive perks.", color: "text-yellow-300", glow: "rgba(253,224,71,0.3)" },
];

const stats = [
  { value: "$5M+",  label: "Total Wagered",  icon: BarChart3 },
  { value: "15K+",  label: "Active Players", icon: Users },
  { value: "98%",   label: "Average RTP",    icon: Trophy },
  { value: "24/7",  label: "Live Support",   icon: MessageSquare },
];

const recentWins = [
  { user: "v*****g", game: "Crash", amount: "$2,840", mult: "14.2x" },
  { user: "d*****n", game: "Dice",  amount: "$1,200", mult: "100x" },
  { user: "x*****7", game: "Plinko", amount: "$980",  mult: "16x" },
  { user: "r*****k", game: "Keno",  amount: "$3,100", mult: "120x" },
  { user: "s*****m", game: "Crash", amount: "$750",   mult: "7.5x" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const navigate = (path: string) => {
    if (isAuthenticated) setLocation(path);
    else setLocation("/login");
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#080808" }}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          background: "rgba(8,8,8,0.85)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(255,215,0,0.12)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-black text-lg"
              style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)" }}
            >¤</div>
            <span
              className="text-xl font-bold tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFD700" }}
            >
              Degens<span style={{ color: "#e5c100" }}>¤</span>Den
            </span>
            <span className="text-xs text-gray-500 hidden md:block" style={{ fontFamily: "Satoshi, sans-serif" }}>
              The Vault Where Degens Become Legends
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            {["Crash", "Dice", "Plinko"].map(g => (
              <button
                key={g}
                onClick={() => navigate(`/${g.toLowerCase()}`)}
                className="hover:text-amber-400 transition-colors font-medium"
              >{g}</button>
            ))}
            <button
              onClick={() => setLocation("/verifier")}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors font-medium"
            >
              <span className="text-amber-500">¤</span> Fairness Lab
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-400 hidden md:inline">
                  {user?.username}
                </span>
                <button
                  data-testid="dashboard-btn"
                  onClick={() => setLocation("/dashboard")}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", color: "#000" }}
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  data-testid="login-btn"
                  onClick={() => setLocation("/login")}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border border-gray-700 hover:border-amber-500/50 hover:text-amber-400 transition-all"
                >
                  Sign In
                </button>
                <button
                  data-testid="register-btn"
                  onClick={() => setLocation("/register")}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", color: "#000" }}
                >
                  Play Now
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Live Wins Ticker ───────────────────────────────────── */}
      <div
        className="fixed top-[65px] left-0 right-0 z-40 overflow-hidden py-2"
        style={{ background: "rgba(8,8,8,0.7)", borderBottom: "1px solid rgba(255,215,0,0.08)" }}
      >
        <div className="flex gap-8 animate-[ticker_25s_linear_infinite] whitespace-nowrap px-4">
          {[...recentWins, ...recentWins].map((w, i) => (
            <span key={i} className="text-xs text-gray-400 flex items-center gap-2 shrink-0">
              <span className="text-amber-400 font-semibold">{w.user}</span>
              won <span className="text-green-400 font-bold">{w.amount}</span>
              on {w.game} @ <span className="text-amber-300">{w.mult}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-4">
        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse,rgba(255,215,0,0.4),transparent 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 mb-8 text-sm text-amber-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            15,240 players online right now
          </div>

          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-black mb-6 leading-none tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: "linear-gradient(135deg,#FFD700 0%,#FFF8DC 40%,#B8860B 70%,#FFD700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 60px rgba(255,215,0,0.3))",
            }}
          >
            Degens<span>¤</span>Den
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-medium" style={{ fontFamily: "Satoshi, sans-serif" }}>
            The Vault Where Degens Become Legends
          </p>
          <p className="text-sm text-gray-500 mb-10 max-w-lg mx-auto">
            Provably fair crypto casino · Instant payouts · 7 premium games · 5-tier VIP
          </p>

          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <motion.button
                data-testid="hero-register-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/register")}
                className="px-10 py-4 rounded-xl font-bold text-black text-lg flex items-center gap-2"
                style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 40px rgba(255,215,0,0.3)" }}
              >
                Start Playing Free <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button
                onClick={() => setLocation("/verifier")}
                className="px-8 py-4 rounded-xl font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all text-lg"
              >
                ¤ Fairness Lab
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/crash")}
              className="px-10 py-4 rounded-xl font-bold text-black text-lg"
              style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 40px rgba(255,215,0,0.3)" }}
            >
              Play Crash Now
            </motion.button>
          )}
        </motion.div>
      </section>

      {/* ── Games Grid ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-20" data-testid="games-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFD700" }}>
            Premium Games
          </h2>
          <p className="text-gray-500">Every result provably fair. Every payout instant.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {games.map((game, idx) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => navigate(game.path)}
                data-testid={`game-card-${game.id}`}
                className="group cursor-pointer rounded-2xl p-6 transition-all duration-300"
                style={{
                  background: "rgba(14,14,22,0.7)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,215,0,0.12)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,215,0,0.5)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 48px rgba(255,215,0,0.15)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,215,0,0.12)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)";
                }}
              >
                {/* Top-right badge */}
                {game.badge && (
                  <span className="float-right text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: game.badge === "New" ? "rgba(74,222,128,0.15)" : game.badge === "Live" ? "rgba(239,68,68,0.15)" : "rgba(255,215,0,0.12)",
                      color: game.badge === "New" ? "#4ade80" : game.badge === "Live" ? "#ef4444" : "#FFD700",
                      border: `1px solid ${game.badge === "New" ? "rgba(74,222,128,0.3)" : game.badge === "Live" ? "rgba(239,68,68,0.3)" : "rgba(255,215,0,0.3)"}`,
                    }}
                  >{game.badge}</span>
                )}

                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                  style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}
                >
                  <Icon className="w-7 h-7" style={{ color: "#FFD700" }} />
                </div>

                <h3 className="text-lg font-bold mb-1 text-white group-hover:text-amber-300 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {game.name}
                </h3>
                <p className="text-sm text-gray-500">{game.desc}</p>

                <div className="mt-4 flex items-center text-amber-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Play Now <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-8"
                style={{
                  background: "rgba(14,14,22,0.7)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,215,0,0.1)",
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `rgba(${f.glow.slice(5,-1)},0.1)`, boxShadow: `0 0 20px ${f.glow}` }}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h4>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-10"
          style={{
            background: "rgba(14,14,22,0.8)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,215,0,0.15)",
            boxShadow: "0 0 60px rgba(255,215,0,0.05)",
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label}>
                  <Icon className="w-5 h-5 text-amber-500 mx-auto mb-3 opacity-70" />
                  <div className="text-4xl font-black mb-1" style={{ color: "#FFD700", fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="max-w-4xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 text-center"
            style={{
              background: "linear-gradient(135deg,rgba(255,215,0,0.1),rgba(184,134,11,0.15))",
              border: "1px solid rgba(255,215,0,0.3)",
              boxShadow: "0 0 80px rgba(255,215,0,0.08)",
            }}
          >
            <h3 className="text-4xl font-black mb-4 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ready to Become a Legend?
            </h3>
            <p className="text-gray-400 mb-8 text-lg">Join 15,000+ degens already winning at Degens¤Den</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              data-testid="cta-register-btn"
              onClick={() => setLocation("/register")}
              className="px-12 py-4 rounded-xl font-bold text-black text-xl"
              style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 0 40px rgba(255,215,0,0.4)" }}
            >
              Create Free Account
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t mt-20 py-12" style={{ borderColor: "rgba(255,215,0,0.08)", background: "rgba(4,4,4,0.9)" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded flex items-center justify-center font-bold text-black text-sm"
                  style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)" }}>¤</div>
                <span className="font-bold text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Degens¤Den</span>
              </div>
              <p className="text-gray-600 text-sm">The ultimate luxury crypto casino. The Vault Where Degens Become Legends.</p>
            </div>
            <div>
              <h5 className="font-bold text-white mb-4 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Games</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                {["Crash", "Dice", "Plinko", "Keno", "Blackjack"].map(g => (
                  <li key={g}>
                    <button onClick={() => navigate(`/${g.toLowerCase()}`)} className="hover:text-amber-400 transition-colors">{g}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-4 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Platform</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><button onClick={() => setLocation("/verifier")} className="hover:text-amber-400 transition-colors">¤ Fairness Lab</button></li>
                <li><button onClick={() => setLocation("/vip-progress")} className="hover:text-amber-400 transition-colors">VIP Program</button></li>
                <li><button onClick={() => setLocation("/live-community")} className="hover:text-amber-400 transition-colors">Community</button></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-4 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Legal</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/legal" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
                <li><a href="/legal" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                <li><span className="text-gray-600">18+ Only</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: "rgba(255,215,0,0.06)" }}>
            <p className="text-gray-600 text-sm">&copy; 2026 Degens¤Den. All rights reserved. 18+ · Play Responsibly.</p>
            <p className="text-gray-700 text-xs">cloutscape.org · All games provably fair via HMAC-SHA256</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
