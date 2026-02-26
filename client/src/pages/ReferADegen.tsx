import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Copy, Gift, Users, TrendingUp, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import ShellLayout from "@/components/ShellLayout";

export default function ReferADegen() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  // Queries
  const { data: referralCode, refetch: refetchCode } = trpc.referral.generateReferralCode.useQuery(undefined, {
    enabled: !!user
  });

  const { data: stats } = trpc.referral.getReferralStats.useQuery(undefined, {
    enabled: !!user
  });

  const { data: rewards } = trpc.referral.getReferralRewards.useQuery(undefined, {
    enabled: !!user
  });

  // Mutations
  const claimRewardsMutation = trpc.referral.claimReferralRewards.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleCopyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/register?ref=${referralCode?.code}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!");
  };

  const handleClaimRewards = async () => {
    try {
      const result = await claimRewardsMutation.mutateAsync();
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error("Failed to claim rewards");
    }
  };

  return (
    <ShellLayout>
      <div className="refer-a-degen-page space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white">REFER-A-DEGEN</h1>
            <p className="text-zinc-400">Bring Your Crew, Get the Clout</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Your Referral Code */}
          <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-500/50 p-6 col-span-1 md:col-span-2">
            <h2 className="text-xl font-bold text-red-400 mb-4">Your Referral Code</h2>
            <div className="space-y-4">
              <div className="bg-slate-950/50 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
                <code className="text-2xl font-mono font-bold text-red-400">
                  {referralCode?.code || "LOADING..."}
                </code>
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <Copy size={16} className="mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <Button
                onClick={handleShareLink}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold"
              >
                <Share2 size={16} className="mr-2" />
                Share Referral Link
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 border-cyan-500/50 p-6">
            <h3 className="text-cyan-400 font-bold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div>
                <p className="text-zinc-400 text-sm">Total Referred</p>
                <p className="text-3xl font-bold text-cyan-400">{stats?.totalReferred || 0}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Total Rewards</p>
                <p className="text-2xl font-bold text-green-400">${(rewards?.totalRewards || 0).toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Rewards Breakdown */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Rewards Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="text-green-500" size={20} />
                <p className="text-zinc-400 text-sm">Signup Bonus</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${(rewards?.rewardBreakdown?.signupBonus || 0).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-2">$10 per signup</p>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-500" size={20} />
                <p className="text-zinc-400 text-sm">Wager Bonus</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                ${(rewards?.rewardBreakdown?.wagerBonus || 0).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-2">From referred wagers</p>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="text-purple-500" size={20} />
                <p className="text-zinc-400 text-sm">Rain Bonus</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                ${(rewards?.rewardBreakdown?.rainBonus || 0).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-2">From rain events</p>
            </div>
          </div>
        </Card>

        {/* Claim Rewards */}
        {(rewards?.totalRewards || 0) > 0 && (
          <Card className="bg-gradient-to-br from-green-900/30 to-green-950/30 border-green-500/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Claim Your Rewards</h3>
                <p className="text-zinc-400">You have ${(rewards?.totalRewards || 0).toFixed(2)} available to claim</p>
              </div>
              <Button
                onClick={handleClaimRewards}
                disabled={claimRewardsMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-8"
              >
                {claimRewardsMutation.isPending ? "Claiming..." : "Claim Rewards"}
              </Button>
            </div>
          </Card>
        )}

        {/* Referred Users */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Referred Degens</h2>
          {stats?.referredUsers && stats.referredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-950/50 text-zinc-400 text-xs uppercase">
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {stats.referredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                      <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-zinc-500 py-8">No referrals yet. Start spreading the Clout!</p>
          )}
        </Card>

        {/* How It Works */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-cyan-400 font-bold mb-4">How It Works</h3>
          <div className="space-y-3 text-sm text-zinc-300">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">1</div>
              <p>Share your unique referral code with your crew.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">2</div>
              <p>They sign up using your code and get a welcome bonus.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">3</div>
              <p>You earn $10 for each signup + bonuses from their activity.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">4</div>
              <p>Claim your rewards anytime and stack that Clout.</p>
            </div>
          </div>
        </Card>
      </div>
    </ShellLayout>
  );
}
