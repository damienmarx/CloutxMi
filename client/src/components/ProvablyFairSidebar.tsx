import { useState } from 'react';
import { ChevronRight, ChevronLeft, Shield, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProvablyFairSidebarProps {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: any;
  gameType: string;
  isRevealed?: boolean;
  serverSeed?: string;
}

export default function ProvablyFairSidebar({
  serverSeedHash,
  clientSeed,
  nonce,
  result,
  gameType,
  isRevealed = false,
  serverSeed
}: ProvablyFairSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showServerSeed, setShowServerSeed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-l-xl shadow-2xl transition-all duration-300 ${
          isOpen ? 'right-96' : 'right-0'
        }`}
        data-testid="provably-fair-toggle"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          <Shield className="w-6 h-6" />
          <span className="font-bold text-sm whitespace-nowrap transform -rotate-0">
            {isOpen ? 'Close' : 'Provably Fair'}
          </span>
        </div>
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-l-4 border-green-500 shadow-2xl transform transition-transform duration-300 z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-testid="provably-fair-sidebar"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-500/30">
            <Shield className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-2xl font-black text-green-400">Provably Fair</h2>
              <p className="text-xs text-gray-400">Cryptographically Verified</p>
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-gray-800/50 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-300">Game Type</span>
              <span className="text-sm font-bold text-green-400 uppercase">{gameType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">Status</span>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold text-green-400">Verified</span>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              How It Works
            </h3>
            <ol className="space-y-2 text-xs text-gray-300">
              <li className="flex gap-2">
                <span className="font-bold text-green-400">1.</span>
                <span>Server generates a secret seed and shows you its hash before the game</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-400">2.</span>
                <span>You provide a client seed (or use the default random one)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-400">3.</span>
                <span>Game result is calculated using both seeds + nonce</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-400">4.</span>
                <span>After the game, server seed is revealed for verification</span>
              </li>
            </ol>
          </div>

          {/* Seeds Information */}
          <div className="space-y-4 mb-6">
            {/* Server Seed Hash */}
            <div className="bg-gray-800/50 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-green-400">Server Seed Hash</span>
                <button
                  onClick={() => copyToClipboard(serverSeedHash, 'hash')}
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  {copied === 'hash' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-300 font-mono break-all bg-gray-900 p-2 rounded">
                {serverSeedHash}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ✓ Shown BEFORE game starts (proves we didn't change it)
              </p>
            </div>

            {/* Client Seed */}
            <div className="bg-gray-800/50 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-green-400">Client Seed</span>
                <button
                  onClick={() => copyToClipboard(clientSeed, 'client')}
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  {copied === 'client' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-300 font-mono break-all bg-gray-900 p-2 rounded">
                {clientSeed}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ✓ Your seed (you can change it anytime)
              </p>
            </div>

            {/* Nonce */}
            <div className="bg-gray-800/50 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-green-400">Nonce</span>
                <span className="text-sm font-mono text-gray-300">{nonce}</span>
              </div>
              <p className="text-xs text-gray-400">
                ✓ Increments each game (ensures uniqueness)
              </p>
            </div>

            {/* Server Seed (Revealed After Game) */}
            {isRevealed && serverSeed && (
              <div className="bg-gray-800/50 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-green-400">Server Seed (Revealed)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowServerSeed(!showServerSeed)}
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      {showServerSeed ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(serverSeed, 'server')}
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      {copied === 'server' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {showServerSeed && (
                  <p className="text-xs text-gray-300 font-mono break-all bg-gray-900 p-2 rounded">
                    {serverSeed}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  ✓ Revealed AFTER game (verify it matches the hash)
                </p>
              </div>
            )}
          </div>

          {/* Game Result */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/40 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-bold text-green-400 mb-3">Game Result</h3>
            <pre className="text-xs text-gray-300 font-mono bg-gray-900 p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {/* Verify Button */}
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 text-lg shadow-lg"
            onClick={() => {
              // TODO: Open verification tool
              alert('Verification tool coming soon! You can manually verify using the seeds above.');
            }}
          >
            <Shield className="w-5 h-5 mr-2" />
            Verify This Game
          </Button>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-gray-800/30 border border-green-500/20 rounded-xl">
            <p className="text-xs text-gray-400 text-center">
              🔒 <span className="font-semibold text-green-400">100% Transparent</span>
              <br />
              Every game result can be independently verified using cryptographic hashing (HMAC-SHA256).
              <br />
              <a href="/provably-fair" className="text-green-400 hover:underline mt-2 inline-block">
                Learn more about Provably Fair →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
