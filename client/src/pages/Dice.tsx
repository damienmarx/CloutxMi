import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/_core/trpc';
import { Button } from '@/components/ui/button';
import ProvablyFairSidebar from '@/components/ProvablyFairSidebar';
import { Dices, TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function Dice() {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState<'high' | 'low' | 'mid' | 'exact'>('high');
  const [targetNumber, setTargetNumber] = useState(50);
  const [currency, setCurrency] = useState<'crypto' | 'gp'>('crypto');
  const [result, setResult] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [balance, setBalance] = useState({ crypto: 0, gp: 0 });

  // Fetch balance
  const { data: walletData } = trpc.wallet.getBalance.useQuery();
  
  // Play mutation
  const playMutation = trpc.games.playDice.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsRolling(false);
      // Refresh balance
      if (walletData) {
        setBalance(walletData);
      }
    },
    onError: (error) => {
      alert(error.message);
      setIsRolling(false);
    }
  });

  const handleRoll = async () => {
    if (!user) {
      alert('Please login to play');
      return;
    }

    setIsRolling(true);
    setResult(null);

    try {
      await playMutation.mutateAsync({
        betAmount,
        currency,
        gameData: {
          prediction,
          target: prediction === 'exact' ? targetNumber : undefined
        }
      });
    } catch (error) {
      console.error('Roll error:', error);
      setIsRolling(false);
    }
  };

  const getMultiplier = () => {
    switch (prediction) {
      case 'high':
      case 'low':
        return '1.98x';
      case 'mid':
        return '9.0x';
      case 'exact':
        return '100x';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
            DICE
          </h1>
          <p className="text-xl text-gray-300">Roll High, Low, Mid, or Exact!</p>
        </div>

        {/* Main Game Area */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Balance */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 text-purple-400">Your Balance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Crypto:</span>
                  <span className="font-bold text-green-400">${walletData?.cryptoBalance?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">OSRS GP:</span>
                  <span className="font-bold text-yellow-400">{walletData?.osrsGpBalance?.toLocaleString() || '0'} GP</span>
                </div>
              </div>
            </div>

            {/* Bet Amount */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl p-6">
              <label className="block text-sm font-bold mb-2 text-purple-400">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-gray-900 border-2 border-purple-500/50 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-purple-500"
                min="0.01"
                step="0.01"
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={() => setBetAmount(betAmount / 2)} variant="outline" className="flex-1">1/2</Button>
                <Button onClick={() => setBetAmount(betAmount * 2)} variant="outline" className="flex-1">2x</Button>
                <Button onClick={() => setBetAmount(100)} variant="outline" className="flex-1">$100</Button>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl p-6">
              <label className="block text-sm font-bold mb-2 text-purple-400">Currency</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrency('crypto')}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    currency === 'crypto'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  💰 Crypto
                </button>
                <button
                  onClick={() => setCurrency('gp')}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    currency === 'gp'
                      ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  🏆 OSRS GP
                </button>
              </div>
            </div>

            {/* Prediction Selection */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl p-6">
              <label className="block text-sm font-bold mb-4 text-purple-400">Prediction</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPrediction('high')}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    prediction === 'high'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <TrendingUp className="inline w-5 h-5 mr-2" />
                  High (&gt;50)
                  <div className="text-xs mt-1">1.98x</div>
                </button>
                <button
                  onClick={() => setPrediction('low')}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    prediction === 'low'
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-500/50'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <TrendingDown className="inline w-5 h-5 mr-2" />
                  Low (&lt;50)
                  <div className="text-xs mt-1">1.98x</div>
                </button>
                <button
                  onClick={() => setPrediction('mid')}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    prediction === 'mid'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <Target className="inline w-5 h-5 mr-2" />
                  Mid (45-55)
                  <div className="text-xs mt-1">9.0x</div>
                </button>
                <button
                  onClick={() => setPrediction('exact')}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    prediction === 'exact'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <Dices className="inline w-5 h-5 mr-2" />
                  Exact
                  <div className="text-xs mt-1">100x</div>
                </button>
              </div>

              {prediction === 'exact' && (
                <div className="mt-4">
                  <label className="block text-sm font-bold mb-2">Target Number (1-100)</label>
                  <input
                    type="number"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(Number(e.target.value))}
                    className="w-full bg-gray-900 border-2 border-purple-500/50 rounded-xl px-4 py-2 text-xl font-bold text-white"
                    min="1"
                    max="100"
                  />
                </div>
              )}
            </div>

            {/* Roll Button */}
            <Button
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-2xl py-8 rounded-2xl shadow-2xl shadow-purple-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRolling ? (
                <span className="animate-pulse">🎲 Rolling...</span>
              ) : (
                <>🎲 ROLL DICE - {getMultiplier()}</>
              )}
            </Button>
          </div>

          {/* Right: Result Display */}
          <div className="space-y-6">
            {/* Dice Display */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-6 text-purple-400">Result</h3>
              {result ? (
                <div className="space-y-6">
                  {/* Rolled Number */}
                  <div className={`text-9xl font-black ${isRolling ? 'animate-bounce' : ''} ${
                    result.win ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.result.roll}
                  </div>

                  {/* Win/Loss */}
                  {result.win ? (
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 animate-pulse">
                      <div className="text-4xl font-black mb-2">🎉 YOU WON! 🎉</div>
                      <div className="text-3xl font-bold">+{currency === 'crypto' ? '$' : ''}{result.winAmount.toLocaleString()}{currency === 'gp' ? ' GP' : ''}</div>
                      <div className="text-xl mt-2">{result.multiplier}x Multiplier</div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6">
                      <div className="text-3xl font-black mb-2">Better Luck Next Time!</div>
                      <div className="text-xl">Try Again</div>
                    </div>
                  )}

                  {/* New Balance */}
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">New Balance</div>
                    <div className="text-2xl font-bold">
                      {currency === 'crypto' ? '$' : ''}{result.newBalance.toLocaleString()}{currency === 'gp' ? ' GP' : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-8xl opacity-30 py-16">
                  <Dices className="inline-block w-32 h-32" />
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 text-purple-400">How to Play</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <strong>High</strong>: Roll &gt;50 for 1.98x</li>
                <li>• <strong>Low</strong>: Roll &lt;50 for 1.98x</li>
                <li>• <strong>Mid</strong>: Roll 45-55 for 9.0x</li>
                <li>• <strong>Exact</strong>: Hit exact number for 100x</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Provably Fair Sidebar */}
      {result && (
        <ProvablyFairSidebar
          serverSeedHash={result.serverSeedHash}
          clientSeed={result.clientSeed}
          nonce={result.nonce}
          result={result.result}
          gameType="DICE"
          isRevealed={true}
          serverSeed={result.serverSeed}
        />
      )}
    </div>
  );
}
