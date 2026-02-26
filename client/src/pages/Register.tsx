import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("[Register] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          <span className="text-3xl font-bold text-cyan-400">CloutScape</span>
        </div>
        <p className="text-gray-400">Join the ultimate casino experience</p>
      </div>

      {/* Register Card */}
      <Card className="w-full max-w-md bg-gradient-to-br from-purple-900/50 to-black border-cyan-400/30 p-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Create Account</h2>

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

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username (3-64 characters)"
              disabled={isLoading}
              className="bg-black/50 border-cyan-400/30 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Letters, numbers, underscores, and hyphens only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isLoading}
              className="bg-black/50 border-cyan-400/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              disabled={isLoading}
              className="bg-black/50 border-cyan-400/30 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              At least 8 characters, uppercase, lowercase, and number required
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={isLoading}
              className="bg-black/50 border-cyan-400/30 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
            className="w-full bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-yellow-400 hover:text-yellow-300 font-semibold"
            >
              Login here
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-cyan-400/20">
          <button
            onClick={() => setLocation("/")}
            className="w-full text-gray-400 hover:text-gray-300 text-sm"
          >
            Back to Home
          </button>
        </div>
      </Card>

      {/* Terms */}
      <p className="text-xs text-gray-500 mt-8 text-center max-w-md">
        By creating an account, you agree to our Terms of Service and Privacy Policy. Please gamble responsibly.
      </p>
    </div>
  );
}
