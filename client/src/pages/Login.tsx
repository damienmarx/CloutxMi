import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Sparkles, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        username,
        password,
      });

      if (result.success) {
        // Redirect to dashboard
        setLocation("/dashboard");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("[Login] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <span className="text-3xl font-bold text-yellow-400">CloutScape</span>
        </div>
        <p className="text-gray-400">Welcome back to your casino</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-gradient-to-br from-purple-900/50 to-black border-yellow-400/30 p-8">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Login</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              className="bg-black/50 border-yellow-400/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="bg-black/50 border-yellow-400/30 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          
          <div className="text-right">
            <button
              type="button"
              onClick={() => setLocation("/forgot-password")}
              className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Register here
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-yellow-400/20">
          <button
            onClick={() => setLocation("/")}
            className="w-full text-gray-400 hover:text-gray-300 text-sm"
          >
            Back to Home
          </button>
        </div>
      </Card>
    </div>
  );
}
