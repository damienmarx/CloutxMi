import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CloudRain, ArrowLeft, Gift } from "lucide-react";
import { toast } from "sonner";

interface RainEvent {
  id: number;
  totalAmount: number;
  participantCount: number;
  amountPerPlayer: number;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
}

export default function RainSystem() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [rainEvents, setRainEvents] = useState<RainEvent[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [totalAmount, setTotalAmount] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Queries and mutations
  const { data: rainHistory, refetch: refetchRainHistory } = trpc.live.rain.getHistory.useQuery(
    { limit: 20 },
    { enabled: true }
  );
  const { data: userRewards, refetch: refetchUserRewards } = trpc.live.rain.getUserRewards.useQuery(
    undefined,
    { enabled: !!user }
  );
  const startRainMutation = trpc.live.rain.startEvent.useMutation();

  // Load rain history
  useEffect(() => {
    if (rainHistory?.events) {
      setRainEvents(rainHistory.events);
    }
  }, [rainHistory]);

  // Load user rewards
  useEffect(() => {
    if (userRewards?.totalRewards) {
      setTotalRewards(userRewards.totalRewards);
    }
  }, [userRewards]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRainHistory();
      refetchUserRewards();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchRainHistory, refetchUserRewards]);

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

  const handleStartRain = async () => {
    if (!totalAmount || !participantCount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (user.role !== "admin") {
      toast.error("Only admins can start rain events");
      return;
    }

    setIsCreating(true);
    try {
      const result = await startRainMutation.mutateAsync({
        totalAmount: parseFloat(totalAmount),
        participantCount: parseInt(participantCount),
      });

      if (result.success) {
        setTotalAmount("");
        setParticipantCount("");
        refetchRainHistory();
        toast.success("Rain event started!");
      } else {
        toast.error(result.error || "Failed to start rain event");
      }
    } catch (error) {
      toast.error("Error starting rain event");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CloudRain className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Rain System</h1>
              <p className="text-gray-400">Random rewards for active players</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Rewards */}
            <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 border-cyan-500/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Your Total Rain Rewards</p>
                  <p className="text-4xl font-bold text-cyan-400">${totalRewards.toFixed(2)}</p>
                </div>
                <Gift className="w-12 h-12 text-cyan-400 opacity-50" />
              </div>
            </Card>

            {/* Rain Events History */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Rain Events</h2>
              <div className="space-y-3">
                {rainEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No rain events yet</p>
                ) : (
                  rainEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-cyan-400 font-semibold">
                            ${event.totalAmount.toFixed(2)} Rain Event
                          </p>
                          <p className="text-gray-400 text-sm">
                            {event.participantCount} participants • ${event.amountPerPlayer.toFixed(2)} each
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            event.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : event.status === "completed"
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {event.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Panel */}
            {user.role === "admin" && (
              <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-500/50 p-6">
                <h3 className="text-lg font-bold text-red-400 mb-4">Admin: Start Rain</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Total Amount ($)</label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      disabled={isCreating}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Participant Count</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={participantCount}
                      onChange={(e) => setParticipantCount(e.target.value)}
                      disabled={isCreating}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleStartRain}
                    disabled={isCreating || !totalAmount || !participantCount}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold"
                  >
                    {isCreating ? "Starting..." : "Start Rain Event"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Info */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
              <h3 className="text-cyan-400 font-bold mb-3">ℹ️ How It Works</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>✓ Admins start rain events</li>
                <li>✓ Rewards distributed randomly</li>
                <li>✓ All active players eligible</li>
                <li>✓ View history anytime</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
