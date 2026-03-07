/**
 * Degens¤Den — Refer a Degen
 * Referral program coming soon
 */
import { ArrowLeft, Gift, Users, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";

const GLASS = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

export default function ReferADegen() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const referralLink = user
    ? `https://cloutscape.org/register?ref=${user.username}`
    : "https://cloutscape.org/register";

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Refer a Degen
            </h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Earn rewards for every player you bring</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 text-center" style={GLASS}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
              <Gift className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Referral Program
            </h2>
            <p className="text-gray-500 mb-6">
              Earn 10% of your referred players' rake for life. The more degens you bring, the more you earn.
            </p>
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="flex-1 text-sm text-gray-400 font-mono truncate">{referralLink}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)" }}
                data-testid="copy-referral-link"
              >
                <Copy className="w-3.5 h-3.5" />Copy
              </button>
            </div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700" }}
            >
              Full referral dashboard launching soon
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Referred Players", value: "—" },
              { icon: Gift, label: "Total Earned", value: "$—" },
              { icon: Copy, label: "Pending Rewards", value: "$—" },
            ].map(({ icon: Icon, label, value }) => (
              <motion.div
                key={label}
                className="p-4 text-center"
                style={GLASS}
                whileHover={{ scale: 1.02 }}
              >
                <Icon className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <div className="text-xl font-black text-white mb-1">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
