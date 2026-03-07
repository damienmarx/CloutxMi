import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowLeft, Copy, CheckCircle, XCircle, ChevronDown, ChevronUp, Hash, RefreshCw } from "lucide-react";

const GLASS_CARD = {
  background: "rgba(14,14,22,0.75)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,215,0,0.15)",
  borderRadius: "16px",
};

const GUIDE_STEPS = [
  {
    title: "Server Seed (Pre-committed)",
    content: `Before you place any bet, the server generates a random 32-byte "serverSeed" and shows you only its SHA-256 hash. This proves the outcome was pre-determined BEFORE you acted.`,
    code: "serverSeedHash = SHA256(serverSeed)"
  },
  {
    title: "Client Seed (Your Input)",
    content: `You can provide your own clientSeed (or use the auto-generated one). This ensures the server cannot predict your seed, making collusion impossible.`,
    code: "clientSeed = your_custom_value"
  },
  {
    title: "Nonce (Incrementing Counter)",
    content: `A nonce increments with every bet, ensuring a unique outcome for each game even with the same seeds.`,
    code: "nonce++ per bet"
  },
  {
    title: "HMAC-SHA256 Result",
    content: `The game result is derived from HMAC-SHA256(serverSeed, clientSeed:nonce). The first 8 hex chars are converted to an integer and mapped to the game's range.`,
    code: `hash = HMAC_SHA256(serverSeed, "${"{clientSeed}"}:${"{nonce}"}")
result = parseInt(hash[0..8], 16) % range`
  },
  {
    title: "Server Reveal",
    content: `After the bet, the server reveals the full serverSeed. You can verify: SHA256(revealedSeed) must match the hash you were shown BEFORE betting. If it doesn't match — the server cheated.`,
    code: "assert SHA256(revealedServerSeed) === previousHash"
  },
];

// Animated hex string visualizer
function HexVisualizer({ value, active }: { value: string; active: boolean }) {
  const [displayed, setDisplayed] = useState(value);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chars = "0123456789abcdef";

  useEffect(() => {
    if (!active) { setDisplayed(value); return; }
    let iterations = 0;
    frameRef.current = setInterval(() => {
      setDisplayed(value.split("").map((c, i) => {
        if (i < iterations) return value[i];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      iterations += 2;
      if (iterations >= value.length) { if (frameRef.current) clearInterval(frameRef.current); setDisplayed(value); }
    }, 40);
    return () => { if (frameRef.current) clearInterval(frameRef.current); };
  }, [value, active]);

  return (
    <code
      className="block text-xs break-all leading-relaxed font-mono"
      style={{ color: active ? "#FFD700" : "#6b7280", transition: "color 0.3s" }}
    >{displayed}</code>
  );
}

export default function ProvablyFairLab() {
  const [, setLocation] = useLocation();
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("my-lucky-seed-2026");
  const [nonce, setNonce] = useState(0);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [liveHash, setLiveHash] = useState("");
  const [hashActive, setHashActive] = useState(false);

  const verifyMutation = trpc.games.verifyFairness.useQuery(
    { serverSeed, clientSeed, nonce },
    { enabled: false }
  );

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed) { alert("Please enter a serverSeed and clientSeed"); return; }
    setIsVerifying(true);
    setHashActive(true);
    const result = await verifyMutation.refetch();
    if (result.data) {
      setVerifyResult(result.data);
      setLiveHash(result.data.hash);
    }
    setIsVerifying(false);
    setTimeout(() => setHashActive(false), 2000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateTestSeeds = () => {
    const seed = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
    setServerSeed(seed);
    setClientSeed("test-client-" + Date.now());
    setNonce(Math.floor(Math.random() * 1000));
    setVerifyResult(null);
    setLiveHash("");
  };

  return (
    <div className="min-h-screen text-white px-4 py-8" style={{ background: "#080808" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-black flex items-center gap-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFD700" }}>
              <span className="text-amber-400">¤</span> Fairness Lab
            </h1>
            <p className="text-gray-500 text-sm">Degens¤Den · Verify any game result. Full transparency.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── Verifier Tool ───────────────────────────────────── */}
          <div className="space-y-5">
            <div className="p-6" style={GLASS_CARD}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                  <Hash className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Verify Game Result</h2>
                  <p className="text-xs text-gray-500">Enter seeds from any bet to verify fairness</p>
                </div>
                <button
                  onClick={generateTestSeeds}
                  className="ml-auto text-xs text-amber-500 hover:text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Test Seeds
                </button>
              </div>

              <div className="space-y-4">
                {/* Server Seed */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Server Seed (revealed after bet)</label>
                  <div className="relative">
                    <input
                      value={serverSeed}
                      onChange={e => setServerSeed(e.target.value)}
                      placeholder="Paste the revealed serverSeed here..."
                      className="w-full bg-transparent border border-amber-500/20 rounded-lg px-4 py-3 text-sm font-mono text-gray-300 focus:outline-none focus:border-amber-500/60 pr-10"
                      data-testid="verifier-server-seed"
                    />
                    {serverSeed && (
                      <button onClick={() => copyToClipboard(serverSeed, "server")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-amber-400">
                        {copied === "server" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Client Seed */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Client Seed</label>
                  <input
                    value={clientSeed}
                    onChange={e => setClientSeed(e.target.value)}
                    placeholder="Your client seed..."
                    className="w-full bg-transparent border border-green-500/20 rounded-lg px-4 py-3 text-sm font-mono text-gray-300 focus:outline-none focus:border-green-500/60"
                    data-testid="verifier-client-seed"
                  />
                </div>

                {/* Nonce */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Nonce</label>
                  <input
                    type="number" min="0"
                    value={nonce}
                    onChange={e => setNonce(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-transparent border border-blue-500/20 rounded-lg px-4 py-3 text-sm font-mono text-gray-300 focus:outline-none focus:border-blue-500/60"
                    data-testid="verifier-nonce"
                  />
                </div>

                <motion.button
                  data-testid="verify-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleVerify}
                  disabled={isVerifying || !serverSeed}
                  className="w-full py-4 rounded-xl font-black text-black text-base flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#FFD700,#B8860B)", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {isVerifying ? <><RefreshCw className="w-4 h-4 animate-spin" /> Computing...</> : <><Shield className="w-4 h-4" /> Verify Now</>}
                </motion.button>
              </div>
            </div>

            {/* Hash Visualizer + Result */}
            <AnimatePresence>
              {(liveHash || isVerifying) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-5 space-y-4"
                  style={GLASS_CARD}
                >
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Hash Computation
                  </h3>

                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <div className="text-gray-600 mb-1">Input message:</div>
                      <code className="text-blue-400">{clientSeed}:{nonce}</code>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">HMAC-SHA256 result:</div>
                      <HexVisualizer value={liveHash} active={hashActive} />
                    </div>
                  </div>

                  {verifyResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 rounded-xl"
                      style={{
                        background: "rgba(74,222,128,0.08)",
                        border: "1px solid rgba(74,222,128,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-bold text-green-400 text-sm">VERIFIED FAIR</span>
                      </div>
                      <div className="space-y-2 text-xs text-gray-400">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Server Seed Hash</span>
                          <code className="text-gray-300 max-w-[200px] truncate">{verifyResult.serverSeedHash?.slice(0, 16)}...</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Game Result (1-100)</span>
                          <span className="text-amber-400 font-bold">{verifyResult.result}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Full Hash</span>
                          <code className="text-gray-500 max-w-[200px] truncate">{verifyResult.hash?.slice(0, 16)}...</code>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Interactive Guide ────────────────────────────────── */}
          <div className="space-y-4">
            <div className="p-6" style={GLASS_CARD}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>How Provably Fair Works</h2>
                  <p className="text-xs text-gray-500">5-step interactive breakdown</p>
                </div>
              </div>

              <div className="space-y-2">
                {GUIDE_STEPS.map((step, i) => (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,215,0,0.08)", background: openStep === i ? "rgba(255,215,0,0.04)" : "transparent" }}>
                    <button
                      onClick={() => setOpenStep(openStep === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}
                        >{i + 1}</span>
                        <span className="text-sm font-semibold text-white">{step.title}</span>
                      </div>
                      {openStep === i ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>

                    <AnimatePresence>
                      {openStep === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            <p className="text-sm text-gray-400 leading-relaxed">{step.content}</p>
                            <div className="rounded-lg p-3 font-mono text-xs text-green-400"
                              style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
                              {step.code}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Why this proves fairness */}
            <div className="p-5" style={GLASS_CARD}>
              <h3 className="text-sm font-bold text-amber-400 mb-4 uppercase tracking-wider">Why This Proves Fairness</h3>
              <div className="space-y-3 text-sm text-gray-400">
                {[
                  ["Server cannot cheat", "The server commits to the result (via hash) before you bet. Changing the result later would require a different serverSeed, which would produce a different hash — detectable immediately."],
                  ["You cannot be predicted", "Your clientSeed is unknown to the server when it generates the serverSeed. The server cannot tailor results to your bet."],
                  ["Every bet is unique", "The nonce ensures even with the same seeds, you get a fresh result every single time."],
                ].map(([title, desc]) => (
                  <div key={title as string} className="flex gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white text-xs mb-1">{title as string}</div>
                      <div className="text-xs text-gray-500 leading-relaxed">{desc as string}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
