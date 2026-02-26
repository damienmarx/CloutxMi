import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function OsrsDeposit() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"initial" | "form" | "review" | "confirmation" | "complete">("initial");
  const [osrsUsername, setOsrsUsername] = useState("");
  const [gpAmount, setGpAmount] = useState("");
  const [worldType, setWorldType] = useState<"f2p" | "p2p">("p2p");
  const [assignedWorld, setAssignedWorld] = useState<number | null>(null);
  const [assignedMule, setAssignedMule] = useState<string | null>(null);
  const [usdAmount, setUsdAmount] = useState<number>(0);

  const GP_TO_USD = 0.00001; // Example rate

  const handleGpChange = (value: string) => {
    setGpAmount(value);
    const gp = parseFloat(value) || 0;
    setUsdAmount(gp * GP_TO_USD);
  };

  const handleStartDeposit = () => {
    setStep("form");
  };

  const handleSubmitForm = () => {
    if (!osrsUsername || !gpAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^[a-zA-Z0-9 ]{1,12}$/.test(osrsUsername)) {
      toast.error("Invalid OSRS username");
      return;
    }

    const gp = parseFloat(gpAmount);
    if (gp < 100000) {
      toast.error("Minimum deposit is 100K GP");
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
    toast.success("Deposit initiated! Meet the mule in-game.");
    setStep("complete");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">💰</div>
            <div>
              <h1 className="text-3xl font-bold text-red-500">OSRS GP Deposit</h1>
              <p className="text-cyan-400">Convert your GP to casino credits</p>
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

        {/* Initial Step - Welcome */}
        {step === "initial" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                <h2 className="text-xl font-bold text-red-500 mb-3">🤖 Degens Den Deposit Bot</h2>
                <p className="text-gray-300 mb-4">
                  Welcome to the OSRS GP deposit system! I'll walk you through the process of converting your RuneScape gold to casino credits.
                </p>
                <p className="text-cyan-400 mb-4">
                  <strong>Current Exchange Rate:</strong> 1M GP = ${(1_000_000 * GP_TO_USD).toFixed(2)} USD
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  The process is simple: provide your OSRS username and GP amount, meet our mule in-game, and your credits will be instantly added!
                </p>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">📊 Exchange Rates</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">USD Rate</p>
                    <p className="text-white font-bold">${(GP_TO_USD * 1_000_000).toFixed(2)}/M</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Min Deposit</p>
                    <p className="text-white font-bold">100K GP</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStartDeposit}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 text-lg"
              >
                Start Deposit Process
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
                  Please provide your OSRS account details and the amount of GP you'd like to deposit.
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
                <p className="text-xs text-gray-400 mt-1">Max 12 characters</p>
              </div>

              <div>
                <label className="block text-sm text-cyan-400 mb-2 font-bold">GP Amount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={gpAmount}
                    onChange={(e) => handleGpChange(e.target.value)}
                    placeholder="100000 or 100K or 1M"
                    className="bg-slate-700 border-cyan-500/30 text-white flex-1"
                  />
                  <div className="bg-slate-700 border border-cyan-500/30 rounded px-4 py-2 flex items-center">
                    <span className="text-cyan-400 font-bold">${usdAmount.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 100K GP</p>
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
                    <span className="text-white">F2P Worlds (1-14)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={worldType === "p2p"}
                      onChange={() => setWorldType("p2p")}
                      className="w-4 h-4"
                    />
                    <span className="text-white">P2P Worlds (1-40)</span>
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
                  Review Deposit
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
                <h3 className="text-lg font-bold text-yellow-400 mb-2">📋 Review Your Deposit</h3>
                <p className="text-gray-300">Please verify the details below before proceeding.</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">OSRS Username:</span>
                  <span className="text-white font-bold">{osrsUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GP Amount:</span>
                  <span className="text-white font-bold">{parseFloat(gpAmount).toLocaleString()} GP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">USD Value:</span>
                  <span className="text-cyan-400 font-bold">${usdAmount.toFixed(2)}</span>
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
                <h3 className="text-lg font-bold text-green-400 mb-2">✅ Deposit Confirmed!</h3>
                <p className="text-gray-300">Your mule has been assigned. Here are your meeting details:</p>
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
                  <p className="text-gray-400 mb-1">Location:</p>
                  <p className="text-white">Grand Exchange</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mt-4">
                  <p className="text-sm text-yellow-400">
                    ⏱️ Please log in to OSRS within the next 15 minutes and meet the mule at the Grand Exchange.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3"
              >
                I've Met the Mule - Complete Deposit
              </Button>
            </div>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 p-8">
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-400">Deposit Successful!</h2>
              <p className="text-gray-300">
                ${usdAmount.toFixed(2)} has been added to your casino account.
              </p>
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <p className="text-green-400 font-bold">Your new balance will appear shortly.</p>
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
