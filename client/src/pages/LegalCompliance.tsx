import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, Shield, CheckCircle, ExternalLink } from "lucide-react";
import "../styles/legal-compliance.css";

export default function LegalCompliance() {
  const [activeTab, setActiveTab] = useState<"disclaimer" | "safety" | "responsible">("disclaimer");

  return (
    <div className="legal-compliance-container">
      <div className="legal-header">
        <h1>Legal & Compliance</h1>
        <p>Important Information About CloutScape / Degens Den</p>
      </div>

      {/* Tabs */}
      <div className="legal-tabs">
        <button
          className={`legal-tab ${activeTab === "disclaimer" ? "active" : ""}`}
          onClick={() => setActiveTab("disclaimer")}
        >
          <AlertCircle className="icon" />
          Jagex Disclaimer
        </button>
        <button
          className={`legal-tab ${activeTab === "safety" ? "active" : ""}`}
          onClick={() => setActiveTab("safety")}
        >
          <Shield className="icon" />
          Safe & Secure
        </button>
        <button
          className={`legal-tab ${activeTab === "responsible" ? "active" : ""}`}
          onClick={() => setActiveTab("responsible")}
        >
          <CheckCircle className="icon" />
          Responsible Gaming
        </button>
      </div>

      {/* Content */}
      <div className="legal-content">
        {/* Jagex Disclaimer */}
        {activeTab === "disclaimer" && (
          <Card className="legal-card">
            <div className="disclaimer-section">
              <h2>Jagex Non-Affiliation Disclaimer</h2>

              <div className="disclaimer-box">
                <AlertCircle className="icon" />
                <div>
                  <h3>Important Notice</h3>
                  <p>
                    CloutScape / Degens Den is <strong>NOT affiliated with, endorsed by, or associated with Jagex Ltd.</strong> or RuneScape / Old School RuneScape (OSRS).
                  </p>
                </div>
              </div>

              <div className="disclaimer-content">
                <h3>Full Disclaimer</h3>

                <section>
                  <h4>1. No Official Relationship</h4>
                  <p>
                    CloutScape and Degens Den are independent gaming platforms created and operated by third parties. We are not affiliated with, endorsed by, or connected to Jagex Ltd., RuneScape, or Old School RuneScape in any official capacity.
                  </p>
                </section>

                <section>
                  <h4>2. Intellectual Property</h4>
                  <p>
                    RuneScape, Old School RuneScape (OSRS), and all associated trademarks, logos, and intellectual property are owned and operated by Jagex Ltd. All rights reserved.
                  </p>
                  <p>
                    Any references to OSRS gold, items, or game mechanics are for informational purposes only. We do not claim ownership of any Jagex intellectual property.
                  </p>
                </section>

                <section>
                  <h4>3. OSRS Gold Trading</h4>
                  <p>
                    CloutScape facilitates the conversion of OSRS gold to fiat currency (USD/CAD) for entertainment purposes. Users acknowledge that:
                  </p>
                  <ul>
                    <li>Trading OSRS gold may violate Jagex's Terms of Service</li>
                    <li>Accounts involved in gold trading may be subject to suspension or permanent ban by Jagex</li>
                    <li>CloutScape is not responsible for any account actions taken by Jagex</li>
                    <li>Users assume all risk associated with OSRS gold trading</li>
                  </ul>
                </section>

                <section>
                  <h4>4. No Warranty</h4>
                  <p>
                    CloutScape provides services "as is" without warranty. We are not responsible for:
                  </p>
                  <ul>
                    <li>Account bans or suspensions from Jagex</li>
                    <li>Loss of OSRS gold or in-game items</li>
                    <li>Disruptions to OSRS services</li>
                    <li>Changes to OSRS game mechanics or policies</li>
                  </ul>
                </section>

                <section>
                  <h4>5. User Responsibility</h4>
                  <p>
                    By using CloutScape, you acknowledge that:
                  </p>
                  <ul>
                    <li>You have read and understand Jagex's Terms of Service</li>
                    <li>You accept all risks associated with OSRS gold trading</li>
                    <li>You are responsible for your account security</li>
                    <li>You will not hold CloutScape liable for account-related issues</li>
                  </ul>
                </section>

                <section>
                  <h4>6. Contact Jagex</h4>
                  <p>
                    For official information about RuneScape and OSRS, visit:
                  </p>
                  <p>
                    <a href="https://www.jagex.com" target="_blank" rel="noopener noreferrer" className="external-link">
                      Jagex Official Website <ExternalLink className="icon" />
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </Card>
        )}

        {/* Safe & Secure */}
        {activeTab === "safety" && (
          <Card className="legal-card">
            <div className="safety-section">
              <h2>Safe & Secure Platform</h2>

              <div className="safety-box">
                <Shield className="icon" />
                <div>
                  <h3>Your Security is Our Priority</h3>
                  <p>
                    CloutScape employs industry-leading security measures to protect your account and funds.
                  </p>
                </div>
              </div>

              <div className="safety-content">
                <section>
                  <h3>🔐 Encryption & Data Protection</h3>
                  <ul>
                    <li><strong>SSL/TLS Encryption:</strong> All data transmitted between your device and our servers is encrypted using 256-bit SSL/TLS</li>
                    <li><strong>Database Security:</strong> User data is encrypted at rest using industry-standard encryption</li>
                    <li><strong>Password Hashing:</strong> Passwords are hashed using bcrypt with 10+ rounds</li>
                    <li><strong>Session Management:</strong> Secure session cookies with HttpOnly and Secure flags</li>
                  </ul>
                </section>

                <section>
                  <h3>🛡️ Account Security</h3>
                  <ul>
                    <li><strong>Two-Factor Authentication (2FA):</strong> Optional 2FA for enhanced account protection</li>
                    <li><strong>Rate Limiting:</strong> Protection against brute-force attacks</li>
                    <li><strong>Account Verification:</strong> Email verification for new accounts</li>
                    <li><strong>Suspicious Activity Detection:</strong> Automated monitoring for unusual account activity</li>
                  </ul>
                </section>

                <section>
                  <h3>💰 Financial Security</h3>
                  <ul>
                    <li><strong>PCI Compliance:</strong> Payment processing complies with PCI DSS standards</li>
                    <li><strong>Transaction Verification:</strong> All transactions are verified and logged</li>
                    <li><strong>Fraud Detection:</strong> Advanced fraud detection systems monitor all transactions</li>
                    <li><strong>Secure Wallet:</strong> Your funds are stored in secure, audited wallets</li>
                  </ul>
                </section>

                <section>
                  <h3>📋 Deposit & Withdrawal Process</h3>
                  <div className="process-steps">
                    <div className="step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Initiate Transaction</h4>
                        <p>Enter your deposit/withdrawal amount and preferred method</p>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Verification</h4>
                        <p>Our system verifies your identity and account status</p>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Processing</h4>
                        <p>Transaction is securely processed and encrypted</p>
                      </div>
                    </div>
                    <div className="step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <h4>Confirmation</h4>
                        <p>You receive email confirmation with transaction details</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3>🔍 What We Do NOT Do</h3>
                  <ul>
                    <li>❌ We NEVER ask for your password via email or support</li>
                    <li>❌ We NEVER store full credit card numbers on our servers</li>
                    <li>❌ We NEVER share your personal information with third parties</li>
                    <li>❌ We NEVER conduct transactions without encryption</li>
                    <li>❌ We NEVER store unencrypted sensitive data</li>
                  </ul>
                </section>

                <section>
                  <h3>⚠️ Security Best Practices</h3>
                  <p>To keep your account secure, please:</p>
                  <ul>
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
          </Card>
        )}

        {/* Responsible Gaming */}
        {activeTab === "responsible" && (
          <Card className="legal-card">
            <div className="responsible-section">
              <h2>Responsible Gaming</h2>

              <div className="responsible-box">
                <CheckCircle className="icon" />
                <div>
                  <h3>Gaming Should Be Fun</h3>
                  <p>
                    CloutScape is committed to promoting responsible gaming practices and player well-being.
                  </p>
                </div>
              </div>

              <div className="responsible-content">
                <section>
                  <h3>🎮 Responsible Gaming Guidelines</h3>
                  <ul>
                    <li><strong>Set Limits:</strong> Set daily, weekly, or monthly spending limits for yourself</li>
                    <li><strong>Take Breaks:</strong> Take regular breaks during gaming sessions</li>
                    <li><strong>Never Chase Losses:</strong> Accept losses and don't try to recover them immediately</li>
                    <li><strong>Budget Wisely:</strong> Only gamble with money you can afford to lose</li>
                    <li><strong>Avoid Alcohol:</strong> Don't gamble while under the influence</li>
                  </ul>
                </section>

                <section>
                  <h3>⚠️ Warning Signs of Problem Gaming</h3>
                  <p>If you experience any of the following, seek help immediately:</p>
                  <ul>
                    <li>Gambling more than intended</li>
                    <li>Spending more money than budgeted</li>
                    <li>Neglecting work, school, or relationships due to gaming</li>
                    <li>Lying about gaming activities or spending</li>
                    <li>Feeling anxious or irritable when not gaming</li>
                    <li>Borrowing money to gamble</li>
                    <li>Chasing losses</li>
                  </ul>
                </section>

                <section>
                  <h3>🆘 Get Help</h3>
                  <p>If you or someone you know needs help with gaming addiction, please reach out:</p>
                  <ul>
                    <li>
                      <strong>National Council on Problem Gambling (USA):</strong>
                      <a href="tel:1-800-522-4700" className="external-link">1-800-522-4700</a>
                    </li>
                    <li>
                      <strong>Gamblers Anonymous:</strong>
                      <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="external-link">
                        www.gamblersanonymous.org <ExternalLink className="icon" />
                      </a>
                    </li>
                    <li>
                      <strong>Begambleaware (UK):</strong>
                      <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="external-link">
                        www.begambleaware.org <ExternalLink className="icon" />
                      </a>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3>🔧 Account Controls</h3>
                  <p>CloutScape provides tools to help you manage your gaming:</p>
                  <ul>
                    <li><strong>Deposit Limits:</strong> Set maximum daily/weekly/monthly deposits</li>
                    <li><strong>Loss Limits:</strong> Set maximum losses before account is locked</li>
                    <li><strong>Session Limits:</strong> Set maximum gaming session duration</li>
                    <li><strong>Self-Exclusion:</strong> Temporarily or permanently exclude yourself from the platform</li>
                    <li><strong>Reality Checks:</strong> Receive periodic reminders about your gaming time and spending</li>
                  </ul>
                </section>

                <section>
                  <h3>📊 Transparency</h3>
                  <p>
                    CloutScape is committed to transparency in all gaming operations:
                  </p>
                  <ul>
                    <li>All games use provably fair algorithms</li>
                    <li>Return-to-player (RTP) rates are clearly displayed</li>
                    <li>House edge is disclosed for all games</li>
                    <li>Random number generation is independently audited</li>
                    <li>Complete transaction history is available to players</li>
                  </ul>
                </section>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Notice */}
      <div className="legal-footer">
        <p>
          By using CloutScape / Degens Den, you acknowledge that you have read and understood these legal terms and disclaimers.
        </p>
        <p>
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
