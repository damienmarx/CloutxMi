
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertCircle, Shield, CheckCircle, ExternalLink, Calendar, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

const AgeVerificationSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

const SelfExclusionSchema = z.object({
  duration: z.enum(["1_month", "3_months", "6_months", "1_year", "5_years", "permanent"]),
});

export default function LegalCompliance() {
  const [activeTab, setActiveTab] = useState<"disclaimer" | "safety" | "responsible" | "age" | "self-exclusion">("disclaimer");

  const { data: user } = trpc.auth.me.useQuery();
  const verifyAgeMutation = trpc.auth.verifyAge.useMutation();
  const selfExcludeMutation = trpc.auth.selfExclude.useMutation();

  const ageForm = useForm<z.infer<typeof AgeVerificationSchema>>({
    resolver: zodResolver(AgeVerificationSchema),
    defaultValues: {
      dateOfBirth: user?.dateOfBirth || "",
    },
  });

  const selfExclusionForm = useForm<z.infer<typeof SelfExclusionSchema>>({
    resolver: zodResolver(SelfExclusionSchema),
    defaultValues: {
      duration: "1_month",
    },
  });

  const handleAgeVerification = async (values: z.infer<typeof AgeVerificationSchema>) => {
    try {
      await verifyAgeMutation.mutateAsync(values);
      alert("Age verification successful!");
    } catch (error: any) {
      alert(`Age verification failed: ${error.message}`);
    }
  };

  const handleSelfExclusion = async (values: z.infer<typeof SelfExclusionSchema>) => {
    try {
      await selfExcludeMutation.mutateAsync(values);
      alert("Self-exclusion request submitted.");
    } catch (error: any) {
      alert(`Self-exclusion failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold gradient-text-gold tracking-tight mb-2">Legal & Compliance</h1>
        <p className="text-muted-foreground text-lg">Important Information About CloutScape</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <Button variant={activeTab === "disclaimer" ? "default" : "ghost"} onClick={() => setActiveTab("disclaimer")}>
          <AlertCircle className="w-4 h-4 mr-2" />
          Disclaimer
        </Button>
        <Button variant={activeTab === "safety" ? "default" : "ghost"} onClick={() => setActiveTab("safety")}>
          <Shield className="w-4 h-4 mr-2" />
          Safe & Secure
        </Button>
        <Button variant={activeTab === "responsible" ? "default" : "ghost"} onClick={() => setActiveTab("responsible")}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Responsible Gaming
        </Button>
        <Button variant={activeTab === "age" ? "default" : "ghost"} onClick={() => setActiveTab("age")}>
          <Calendar className="w-4 h-4 mr-2" />
          Age Verification
        </Button>
        <Button variant={activeTab === "self-exclusion" ? "default" : "ghost"} onClick={() => setActiveTab("self-exclusion")}>
          <Ban className="w-4 h-4 mr-2" />
          Self-Exclusion
        </Button>
      </div>

      {/* Content */}
      <div className="legal-content space-y-8">
        {/* Disclaimer */}
        {activeTab === "disclaimer" && (
          <GlassCard accent="gold" className="p-6">
            <div className="disclaimer-section">
              <h2 className="text-2xl font-bold mb-4">Jagex Non-Affiliation Disclaimer</h2>

              <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-lg flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-300">Important Notice</h3>
                  <p className="text-red-200">
                    CloutScape is <strong>NOT affiliated with, endorsed by, or associated with Jagex Ltd.</strong> or RuneScape / Old School RuneScape (OSRS).
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <section>
                  <h4 className="text-lg font-semibold text-foreground">1. No Official Relationship</h4>
                  <p>
                    CloutScape is an independent gaming platform created and operated by third parties. We are not affiliated with, endorsed by, or connected to Jagex Ltd., RuneScape, or Old School RuneScape in any official capacity.
                  </p>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground">2. Intellectual Property</h4>
                  <p>
                    RuneScape, Old School RuneScape (OSRS), and all associated trademarks, logos, and intellectual property are owned and operated by Jagex Ltd. All rights reserved.
                  </p>
                  <p>
                    Any references to OSRS gold, items, or game mechanics are for informational purposes only. We do not claim ownership of any Jagex intellectual property.
                  </p>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground">3. OSRS Gold Trading</h4>
                  <p>
                    CloutScape facilitates the conversion of OSRS gold to fiat currency (USD/CAD) for entertainment purposes. Users acknowledge that:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Trading OSRS gold may violate Jagex's Terms of Service</li>
                    <li>Accounts involved in gold trading may be subject to suspension or permanent ban by Jagex</li>
                    <li>CloutScape is not responsible for any account actions taken by Jagex</li>
                    <li>Users assume all risk associated with OSRS gold trading</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground">4. No Warranty</h4>
                  <p>
                    CloutScape provides services "as is" without warranty. We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Account bans or suspensions from Jagex</li>
                    <li>Loss of OSRS gold or in-game items</li>
                    <li>Disruptions to OSRS services</li>
                    <li>Changes to OSRS game mechanics or policies</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground">5. User Responsibility</h4>
                  <p>
                    By using CloutScape, you acknowledge that:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You have read and understand Jagex's Terms of Service</li>
                    <li>You accept all risks associated with OSRS gold trading</li>
                    <li>You are responsible for your account security</li>
                    <li>You will not hold CloutScape liable for account-related issues</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground">6. Contact Jagex</h4>
                  <p>
                    For official information about RuneScape and OSRS, visit:
                  </p>
                  <p>
                    <a href="https://www.jagex.com" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline inline-flex items-center gap-1">
                      Jagex Official Website <ExternalLink className="w-4 h-4" />
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Safe & Secure */}
        {activeTab === "safety" && (
          <GlassCard accent="green" className="p-6">
            <div className="safety-section">
              <h2 className="text-2xl font-bold mb-4">Safe & Secure Platform</h2>

              <div className="p-4 bg-green-900/30 border border-green-500/40 rounded-lg flex items-start gap-3 mb-6">
                <Shield className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-green-300">Your Security is Our Priority</h3>
                  <p className="text-green-200">
                    CloutScape employs industry-leading security measures to protect your account and funds.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold text-foreground">🔐 Encryption & Data Protection</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>SSL/TLS Encryption:</strong> All data transmitted between your device and our servers is encrypted using 256-bit SSL/TLS</li>
                    <li><strong>Database Security:</strong> User data is encrypted at rest using industry-standard encryption</li>
                    <li><strong>Password Hashing:</strong> Passwords are hashed using Argon2id (industry best practice)</li>
                    <li><strong>Session Management:</strong> Secure session cookies with HttpOnly, Secure, and SameSite=Lax flags</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">🛡️ Account Security</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Two-Factor Authentication (2FA):</strong> Optional TOTP-based 2FA for enhanced account protection</li>
                    <li><strong>Rate Limiting:</strong> Protection against brute-force attacks and excessive requests</li>
                    <li><strong>Account Verification:</strong> Email verification for new accounts</li>
                    <li><strong>Suspicious Activity Detection:</strong> Automated monitoring for unusual account activity</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">💰 Financial Security</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>PCI Compliance:</strong> Payment processing complies with PCI DSS standards</li>
                    <li><strong>Transaction Verification:</strong> All transactions are verified and logged</li>
                    <li><strong>Fraud Detection:</strong> Advanced fraud detection systems monitor all transactions</li>
                    <li><strong>Secure Wallet:</strong> Your funds are stored in secure, audited wallets</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">📋 Deposit & Withdrawal Process</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                      <div>
                        <h4 className="font-semibold text-foreground">Initiate Transaction</h4>
                        <p className="text-sm">Enter your deposit/withdrawal amount and preferred method</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                      <div>
                        <h4 className="font-semibold text-foreground">Verification</h4>
                        <p className="text-sm">Our system verifies your identity and account status</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                      <div>
                        <h4 className="font-semibold text-foreground">Processing</h4>
                        <p className="text-sm">Transaction is securely processed and encrypted</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">4</div>
                      <div>
                        <h4 className="font-semibold text-foreground">Confirmation</h4>
                        <p className="text-sm">You receive email confirmation with transaction details</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">🔍 What We Do NOT Do</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>❌ We NEVER ask for your password via email or support</li>
                    <li>❌ We NEVER store full credit card numbers on our servers</li>
                    <li>❌ We NEVER share your personal information with third parties</li>
                    <li>❌ We NEVER conduct transactions without encryption</li>
                    <li>❌ We NEVER store unencrypted sensitive data</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">⚠️ Security Best Practices</h3>
                  <p>To keep your account secure, please:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use a strong, unique password (minimum 12 characters)</li>
                    <li>Enable two-factor authentication (2FA)</li>
                    <li>Never share your password or 2FA codes</li>
                    <li>Use a secure internet connection (avoid public WiFi for sensitive transactions)</li>
                    <li>Keep your device and browser updated</li>
                    <li>Report suspicious activity immediately</li>
                  </ul>
                </section>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Responsible Gaming */}
        {activeTab === "responsible" && (
          <GlassCard accent="red" className="p-6">
            <div className="responsible-section">
              <h2 className="text-2xl font-bold mb-4">Responsible Gaming</h2>

              <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-lg flex items-start gap-3 mb-6">
                <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-300">Gaming Should Be Fun</h3>
                  <p className="text-red-200">
                    CloutScape is committed to promoting responsible gaming practices and player well-being.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold text-foreground">🎮 Responsible Gaming Guidelines</h3>
                  <p>Gambling should be an enjoyable pastime, not a source of financial or personal distress. We encourage all our players to gamble responsibly by:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Setting limits on deposits, wagers, and losses</li>
                    <li>Never gambling more than you can afford to lose</li>
                    <li>Avoiding gambling when under the influence of alcohol or drugs</li>
                    <li>Not chasing losses</li>
                    <li>Taking regular breaks from gambling</li>
                    <li>Balancing gambling with other activities</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">🛠️ Tools for Responsible Gaming</h3>
                  <p>CloutScape provides several tools to help you manage your gaming habits:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Deposit Limits:</strong> Set daily, weekly, or monthly limits on how much you can deposit.</li>
                    <li><strong>Loss Limits:</strong> Set limits on how much you can lose over a specific period.</li>
                    <li><strong>Session Limits:</strong> Set a maximum duration for your gaming sessions.</li>
                    <li><strong>Self-Exclusion:</strong> If you feel you need a break from gambling, you can self-exclude for a set period or permanently.</li>
                    <li><strong>Reality Checks:</strong> Receive periodic notifications about your session duration and spending.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">🆘 Seeking Help</h3>
                  <p>If you or someone you know is struggling with problem gambling, please seek help from professional organizations:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline inline-flex items-center gap-1">
                        National Council on Problem Gambling <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.gamblersanonymous.org/ga/" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline inline-flex items-center gap-1">
                        Gamblers Anonymous <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline inline-flex items-center gap-1">
                        GamCare (UK) <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-foreground">📞 Contact Support</h3>
                  <p>Our support team is available 24/7 to assist you with responsible gaming tools or any concerns you may have. Please contact us via live chat or email.</p>
                </section>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Age Verification */}
        {activeTab === "age" && (
          <GlassCard accent="blue" className="p-6">
            <h2 className="text-2xl font-bold mb-4">Age Verification</h2>
            <p className="text-muted-foreground mb-6">
              To comply with regulations, we require all users to verify their age. You must be 18 years or older to use CloutScape.
            </p>

            {user?.isAgeVerified ? (
              <div className="p-4 bg-green-900/30 border border-green-500/40 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-green-300">Age Verified</h3>
                  <p className="text-green-200">Thank you for verifying your age. You have full access to CloutScape.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={ageForm.handleSubmit(handleAgeVerification)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...ageForm.register("dateOfBirth")}
                    className={ageForm.formState.errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {ageForm.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{ageForm.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={ageForm.formState.isSubmitting} className="w-full">
                  {ageForm.formState.isSubmitting ? "Verifying..." : "Verify Age"}
                </Button>
              </form>
            )}
          </GlassCard>
        )}

        {/* Self-Exclusion */}
        {activeTab === "self-exclusion" && (
          <GlassCard accent="red" className="p-6">
            <h2 className="text-2xl font-bold mb-4">Self-Exclusion</h2>
            <p className="text-muted-foreground mb-6">
              If you wish to take a break from gambling, you can self-exclude yourself from CloutScape for a specified period.
            </p>

            {user?.selfExclusionUntil && new Date(user.selfExclusionUntil) > new Date() ? (
              <div className="p-4 bg-orange-900/30 border border-orange-500/40 rounded-lg flex items-start gap-3">
                <Ban className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-300">Self-Excluded</h3>
                  <p className="text-orange-200">
                    You are self-excluded until {format(new Date(user.selfExclusionUntil), "PPP")} (PST).
                    During this period, you will not be able to access our gaming services.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={selfExclusionForm.handleSubmit(handleSelfExclusion)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="duration">Exclusion Duration</Label>
                  <select
                    id="duration"
                    {...selfExclusionForm.register("duration")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="1_month">1 Month</option>
                    <option value="3_months">3 Months</option>
                    <option value="6_months">6 Months</option>
                    <option value="1_year">1 Year</option>
                    <option value="5_years">5 Years</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <Button type="submit" disabled={selfExclusionForm.formState.isSubmitting} className="w-full">
                  {selfExclusionForm.formState.isSubmitting ? "Submitting..." : "Self-Exclude"}
                </Button>
              </form>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}
