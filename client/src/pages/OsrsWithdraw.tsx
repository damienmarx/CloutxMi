import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function OsrsWithdraw() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"initial" | "form" | "review" | "confirmation" | "complete">("initial");
  const [osrsUsername, setOsrsUsername] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [worldType, setWorldType] = useState<"f2p" | "p2p">("p2p");
  const [assignedWorld, setAssignedWorld] = useState<number | null>(null);
  const [assignedMule, setAssignedMule] = useState<string | null>(null);
  const [gpAmount, setGpAmount] = useState<number>(0);

  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const balanceAmount = balance ? parseFloat(balance.balance as any) : 0;

  const USD_TO_GP = 100_000; // Example rate: $1 = 100K GP

  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
    const usd = parseFloat(value) || 0;
    setGpAmount(usd * USD_TO_GP);
  };

  const handleStartWithdraw = () => {
    if (balanceAmount < 1) {
      toast.error("Insufficient balance to withdraw");
      return;
    }
    setStep("form");
  };

  const handleSubmitForm = () => {
    if (!osrsUsername || !usdAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^[a-zA-Z0-9 ]{1,12}$/.test(osrsUsername)) {
      toast.error("Invalid OSRS username");
      return;
    }

    const usd = parseFloat(usdAmount);
    if (usd < 1) {
      toast.error("Minimum withdrawal is $1");
      return;
    }

    if (usd > balanceAmount) {
      toast.error("Insufficient balance");
      return;
    }

    setStep("review");
  };

  const handleConfirm = () => {
    // Assign random world and mule
    const f2pWorlds = Array.from({ length: 14 }, (_, i) => i + 1);
    const p2pWorlds = Array.from({ length: 40 }, (_, i) => i + 1);
    const worlds = worldType === "f2p" ? f2pWorlds : p2pWorlds;
    const randomWorld = worlds[Math.floor(Math.random() * worlds.length)];

    const mules = [
      "Mule_Alpha",
      "Mule_Beta",
      "Mule_Gamma",
      "Mule_Delta",
      "Mule_Epsilon",
    ];
    const randomMule = mules[Math.floor(Math.random() * mules.length)];

    setAssignedWorld(randomWorld);
    setAssignedMule(randomMule);
    setStep("confirmation");
  };

  const handleComplete = () => {
    toast.success("Withdrawal initiated! Meet the mule in-game.");
    setStep("complete");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">💸</div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">OSRS GP Withdrawal</h1>
              <p className="text-cyan-400">Convert casino credits back to GP</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Back
          </Button>
        </div>

        {/* Initial Step */}
        {step === "initial" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                <h2 className="text-xl font-bold text-red-500 mb-3">🤖 Degens Den Withdrawal Bot</h2>
                <p className="text-gray-300 mb-4">
                  Ready to cash out? I'll guide you through converting your casino credits back to OSRS GP.
                </p>
                <p className="text-cyan-400 mb-4">
                  <strong>Current Balance:</strong> ${balanceAmount.toFixed(2)} USD
                </p>
                <p className="text-gray-400 text-sm">
                  Exchange Rate: $1 = {USD_TO_GP.toLocaleString()} GP
                </p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-gray-300 mb-3">
                  <strong>Your Current Balance:</strong>
                </p>
                <div className="text-3xl font-bold text-green-400">
                  ${balanceAmount.toFixed(2)}
                </div>
              </div>

              <Button
                onClick={handleStartWithdraw}
                disabled={balanceAmount < 1}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 text-lg disabled:opacity-50"
              >
                Start Withdrawal
              </Button>
            </div>
          </Card>
        )}

        {/* Form Step */}
        {step === "form" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                <p className="text-gray-300">
                  Provide your OSRS account details and the amount you'd like to withdraw.
                </p>
              </div>

              <div>
                <label className="block text-sm text-cyan-400 mb-2 font-bold">OSRS Username</label>
                <Input
                  type="text"
                  value={osrsUsername}
                  onChange={(e) => setOsrsUsername(e.target.value)}
                  placeholder="Your OSRS account name"
                  className="bg-slate-700 border-cyan-500/30 text-white"
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-sm text-cyan-400 mb-2 font-bold">USD Amount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    placeholder="10.00"
                    className="bg-slate-700 border-cyan-500/30 text-white flex-1"
                    max={balanceAmount}
                    step="0.01"
                  />
                  <div className="bg-slate-700 border border-cyan-500/30 rounded px-4 py-2 flex items-center">
                    <span className="text-cyan-400 font-bold">{gpAmount.toLocaleString()} GP</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Max: ${balanceAmount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm text-cyan-400 mb-2 font-bold">World Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={worldType === "f2p"}
                      onChange={() => setWorldType("f2p")}
                      className="w-4 h-4"
                    />
                    <span className="text-white">F2P Worlds</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={worldType === "p2p"}
                      onChange={() => setWorldType("p2p")}
                      className="w-4 h-4"
                    />
                    <span className="text-white">P2P Worlds</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep("initial")}
                  variant="outline"
                  className="flex-1 border-gray-500 text-gray-400"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitForm}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
                >
                  Review Withdrawal
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Review Step */}
        {step === "review" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">📋 Review Your Withdrawal</h3>
                <p className="text-gray-300">Please verify the details before proceeding.</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">OSRS Username:</span>
                  <span className="text-white font-bold">{osrsUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">USD Amount:</span>
                  <span className="text-cyan-400 font-bold">${parseFloat(usdAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GP Amount:</span>
                  <span className="text-white font-bold">{gpAmount.toLocaleString()} GP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">World Type:</span>
                  <span className="text-white font-bold">{worldType.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep("form")}
                  variant="outline"
                  className="flex-1 border-gray-500 text-gray-400"
                >
                  Edit
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
                >
                  Confirm & Continue
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Confirmation Step */}
        {step === "confirmation" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-green-400 mb-2">✅ Withdrawal Confirmed!</h3>
                <p className="text-gray-300">Meet the mule to collect your GP:</p>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg space-y-4">
                <div className="text-center">
                  <p className="text-gray-400 mb-1">Meet Mule:</p>
                  <p className="text-2xl font-bold text-red-500">{assignedMule}</p>
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <p className="text-gray-400 mb-1">World:</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {assignedWorld} ({worldType.toUpperCase()})
                  </p>
                </div>

                <div className="border-t border-slate-600 pt-4">
                  <p className="text-gray-400 mb-1">GP Waiting:</p>
                  <p className="text-2xl font-bold text-green-400">{gpAmount.toLocaleString()} GP</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mt-4">
                  <p className="text-sm text-yellow-400">
                    ⏱️ Please log in to OSRS within 15 minutes and meet the mule at the Grand Exchange.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3"
              >
                I've Received the GP - Complete Withdrawal
              </Button>
            </div>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-400">Withdrawal Successful!</h2>
              <p className="text-gray-300">
                {gpAmount.toLocaleString()} GP has been transferred to {osrsUsername}.
              </p>
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <p className="text-green-400 font-bold">Your balance has been updated.</p>
              </div>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3"
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
