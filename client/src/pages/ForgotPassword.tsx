import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Sparkles, AlertCircle, CheckCircle, Mail } from "lucide-react";

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
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <span className="text-3xl font-bold text-yellow-400">CloutScape</span>
        </div>
        <p className="text-gray-400">Reset your password</p>
      </div>

      <Card className="w-full max-w-md bg-gradient-to-br from-purple-900/50 to-black border-yellow-400/30 p-8">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Forgot Password</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  disabled={isLoading}
                  className="pl-10 bg-black/50 border-yellow-400/30 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => setLocation("/login")}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300"
          >
            Back to Login
          </Button>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setLocation("/login")}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            Remembered your password? Login
          </button>
        </div>
      </Card>
    </div>
  );
}
