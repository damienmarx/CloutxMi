import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TermsModal } from "@/components/TermsModal";
import { CheckCircle, ArrowRight, Gift } from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to CloutScape",
    description: "You've entered the Den. Prepare yourself for the chaos, the gains, and the Clout.",
    icon: "🎰"
  },
  {
    id: 2,
    title: "Understand the Rules",
    description: "Master the Code of the Clout. High stakes, diamond hands, and respect the pump.",
    icon: "📜"
  },
  {
    id: 3,
    title: "Deposit Your First Clout",
    description: "Fund your wallet and start your degenerate journey. OSRS GP or USD—your choice.",
    icon: "💰"
  },
  {
    id: 4,
    title: "Play Your First Game",
    description: "Test the waters with Dice, Crash, or Coinflip. Provably fair, always transparent.",
    icon: "🎲"
  },
  {
    id: 5,
    title: "Refer Your Crew",
    description: "Bring your degens and stack rewards. Refer-a-Degen gets you paid.",
    icon: "👥"
  }
];

export default function OnboardingFlow() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    toast.success("Terms accepted! Welcome to the Den.");
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
    }, 500);
  };

  const handleNextStep = () => {
    if (currentStep === 2 && !termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setLocation("/dashboard");
    }
  };

  const handleSkip = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">♧</div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to CloutScape</h1>
          <p className="text-zinc-400">Your Journey to Degenerate Glory Starts Here</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-zinc-400">STEP {currentStep} OF {ONBOARDING_STEPS.length}</span>
            <span className="text-sm text-zinc-500">{Math.round((currentStep / ONBOARDING_STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
              style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="flex justify-between mb-12">
          {ONBOARDING_STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all ${
                  currentStep >= step.id
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white"
                    : "bg-slate-800 text-zinc-500"
                }`}
              >
                {currentStep > step.id ? <CheckCircle size={24} /> : step.id}
              </div>
              <p className="text-xs text-zinc-500 text-center hidden md:block">{step.title}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/30 p-12 mb-8">
          <div className="text-center mb-8">
            <div className="text-7xl mb-6">{ONBOARDING_STEPS[currentStep - 1].icon}</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {ONBOARDING_STEPS[currentStep - 1].title}
            </h2>
            <p className="text-lg text-zinc-400">
              {ONBOARDING_STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Step-Specific Content */}
          {currentStep === 3 && (
            <div className="bg-slate-950/50 rounded-lg p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Choose Your Deposit Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-20 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">💵</span>
                  <span>Deposit USD</span>
                </Button>
                <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white h-20 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🪙</span>
                  <span>Deposit OSRS GP</span>
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-slate-950/50 rounded-lg p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Pick Your First Game</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 h-20 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🎲</span>
                  <span>Dice</span>
                </Button>
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 h-20 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">📈</span>
                  <span>Crash</span>
                </Button>
                <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 h-20 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🪙</span>
                  <span>Coinflip</span>
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="bg-slate-950/50 rounded-lg p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Get Your Referral Code</h3>
              <div className="bg-slate-900 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-zinc-400 text-sm mb-2">Your Referral Code:</p>
                <code className="text-2xl font-mono font-bold text-red-400">CLOUT{Math.random().toString(36).substring(2, 8).toUpperCase()}</code>
              </div>
              <p className="text-zinc-400 text-sm">Share this code with your crew and earn rewards for every signup!</p>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:bg-zinc-900"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleNextStep}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8"
          >
            {currentStep === ONBOARDING_STEPS.length ? (
              <>
                <span>Enter the Den</span>
                <ArrowRight size={16} className="ml-2" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onReject={() => setShowTermsModal(false)}
        title="Degens♧Den: The Code of the Clout"
        showDegenCode={true}
      />
    </div>
  );
}
