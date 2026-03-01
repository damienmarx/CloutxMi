
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Mail, Zap } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await forgotPasswordMutation.mutateAsync({ email });
      if (result.success) {
        setSuccess("If an account exists with this email, you will receive a reset link shortly.");
      } else {
        setError(result.error || "Failed to process request");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-8 h-8 text-neon-gold" />
          <span className="text-3xl font-extrabold gradient-text-gold tracking-tight">CloutScape</span>
        </div>
        <p className="text-muted-foreground text-sm">Password recovery</p>
      </div>

      <GlassCard accent="gold" className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Enter your registered email and we will send you a reset link.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-900/30 border border-red-500/40 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-900/30 border border-green-500/40 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{success}</p>
            </div>
            <Button onClick={() => setLocation("/login")} className="w-full">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !email} className="w-full">
              {isLoading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <button onClick={() => setLocation("/login")} className="text-neon-gold hover:underline font-semibold">
            Sign in
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
