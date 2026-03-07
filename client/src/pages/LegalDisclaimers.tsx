import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ShieldAlert, Ban } from "lucide-react";

export default function LegalDisclaimers() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-5xl font-display font-bold text-gold-gradient mb-8 text-center">
        Legal Disclaimers & Terms
      </h1>

      <div className="space-y-6">
        {/* No Jagex Affiliation */}
        <Card className="glass-card border-2 border-[var(--neon-red)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-neon-red">
              <Ban className="w-8 h-8" />
              No Jagex Affiliation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[var(--foreground)] text-lg leading-relaxed">
              <strong>IMPORTANT DISCLAIMER:</strong> Degens¤Den is an independent cryptocurrency casino platform and is <strong>NOT</strong> affiliated with, endorsed by, or connected to Jagex Ltd, the creators of Old School RuneScape (OSRS), in any way.
            </p>
            
            <div className="glass-card p-4 border border-[var(--neon-red)]">
              <ul className="list-disc list-inside space-y-2 text-[var(--muted-foreground)]">
                <li>Degens¤Den is not an official Jagex product or service</li>
                <li>We are not authorized or licensed by Jagex Ltd</li>
                <li>OSRS themes and references are for entertainment purposes only</li>
                <li>All trademarks belong to their respective owners</li>
                <li>We do not claim ownership of any Jagex intellectual property</li>
              </ul>
            </div>

            <p className="text-[var(--muted-foreground)] italic">
              Old School RuneScape™ and RuneScape™ are trademarks of Jagex Ltd. Use of these trademarks is for descriptive purposes only and does not imply endorsement.
            </p>
          </CardContent>
        </Card>

        {/* No Refunds Policy */}
        <Card className="glass-card border-2 border-[var(--neon-gold)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-neon-gold">
              <ShieldAlert className="w-8 h-8" />
              No Refunds Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[var(--foreground)] text-lg font-semibold">
              ALL TRANSACTIONS ARE FINAL AND NON-REFUNDABLE
            </p>
            
            <div className="space-y-3 text-[var(--foreground)]">
              <p><strong>1. Deposits:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-[var(--muted-foreground)]">
                <li>All deposits are final once credited to your account</li>
                <li>Cryptocurrency transactions cannot be reversed</li>
                <li>You are responsible for verifying deposit addresses</li>
              </ul>

              <p><strong>2. Withdrawals:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-[var(--muted-foreground)]">
                <li>Withdrawals are processed to the address you provide</li>
                <li>We are not responsible for incorrect withdrawal addresses</li>
                <li>Blockchain transactions are irreversible</li>
              </ul>

              <p><strong>3. Gaming Transactions:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-[var(--muted-foreground)]">
                <li>All bets placed are final and cannot be refunded</li>
                <li>Game results are provably fair and verifiable</li>
                <li>Technical issues may result in bet cancellation (at our discretion)</li>
              </ul>

              <p><strong>4. Exception - Foul Play:</strong></p>
              <div className="glass-card p-4 border border-[var(--neon-green)] bg-[var(--neon-green)]/5">
                <p className="text-[var(--foreground)]">
                  Refunds may ONLY be issued in cases of proven foul play, including:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-[var(--muted-foreground)]">
                  <li>Unauthorized account access</li>
                  <li>System errors that affect game outcomes</li>
                  <li>Duplicate charges due to technical glitches</li>
                  <li>Verified fraud or security breaches</li>
                </ul>
                <p className="mt-2 text-[var(--foreground)] font-semibold">
                  All refund requests must be submitted to support@cloutscape.org with evidence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Verification */}
        <Card className="glass-card border-2 border-[var(--neon-blue)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-neon-blue">
              <AlertTriangle className="w-8 h-8" />
              Age Verification & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass-card p-4 border-2 border-[var(--neon-red)] bg-[var(--neon-red)]/5">
              <p className="text-[var(--foreground)] text-xl font-bold text-center">
                YOU MUST BE 18+ TO USE THIS PLATFORM
              </p>
            </div>

            <div className="space-y-3 text-[var(--foreground)]">
              <p><strong>By using Degens¤Den, you confirm:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-[var(--muted-foreground)]">
                <li>You are at least 18 years of age (or legal gambling age in your jurisdiction)</li>
                <li>Online gambling is legal in your country/state of residence</li>
                <li>You are using your own funds and not gambling with borrowed money</li>
                <li>You understand the risks of gambling and can afford potential losses</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Responsible Gambling */}
        <Card className="glass-card border-2 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="text-2xl text-neon-purple">
              Responsible Gambling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[var(--foreground)]">
            <p>
              Degens¤Den is committed to promoting responsible gambling. We provide tools to help you stay in control:
            </p>

            <div className="glass-card p-4">
              <h3 className="font-bold text-neon-gold mb-2">DEGEN BOX 🔒</h3>
              <p className="text-[var(--muted-foreground)] mb-2">
                Lock your funds for a set period to prevent impulsive gambling during emotional states.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-[var(--muted-foreground)]">
                <li>Self-exclusion periods: 24h, 7d, 30d, or permanent</li>
                <li>Cannot be unlocked early (except by admin in emergencies)</li>
                <li>Helps prevent problem gambling behavior</li>
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="font-bold text-neon-gold mb-2">Support Resources</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-[var(--muted-foreground)]">
                <li>National Council on Problem Gambling: 1-800-522-4700</li>
                <li>Gamblers Anonymous: www.gamblersanonymous.org</li>
                <li>SAMHSA National Helpline: 1-800-662-4357</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Provably Fair */}
        <Card className="glass-card border-2 border-[var(--neon-green)]">
          <CardHeader>
            <CardTitle className="text-2xl text-neon-green">
              Provably Fair Gaming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[var(--foreground)]">
            <p>
              <strong>All games on Degens¤Den are provably fair.</strong> Every game result can be independently verified using cryptographic hashing.
            </p>

            <div className="glass-card p-4">
              <h3 className="font-bold mb-2">How It Works:</h3>
              <ol className="list-decimal list-inside ml-4 space-y-2 text-[var(--muted-foreground)]">
                <li>Before each game, we generate a server seed (kept secret)</li>
                <li>You provide a client seed (or use the default)</li>
                <li>The hash of the server seed is shown before the game</li>
                <li>After the game, the server seed is revealed</li>
                <li>You can verify the result using the revealed seeds</li>
              </ol>
            </div>

            <p className="text-[var(--muted-foreground)]">
              Visit <strong className="text-neon-gold">/provably-fair</strong> to verify any game result.
            </p>
          </CardContent>
        </Card>

        {/* Jurisdiction */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl text-[var(--foreground)]">
              Jurisdiction & Governing Law
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[var(--muted-foreground)]">
            <p>
              These terms are governed by international law. Users are responsible for ensuring compliance with local gambling laws.
            </p>
            <p>
              Degens¤Den reserves the right to refuse service to users from prohibited jurisdictions.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="glass-card border-2 border-[var(--gold-primary)]">
          <CardHeader>
            <CardTitle className="text-2xl text-gold-gradient">
              Contact & Disputes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[var(--foreground)]">
              For questions, concerns, or to report issues:
            </p>
            <div className="glass-card p-4">
              <p className="text-neon-gold font-semibold">📧 Email: support@cloutscape.org</p>
              <p className="text-[var(--muted-foreground)] mt-2">
                Response time: 24-48 hours
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Agreement */}
        <div className="glass-card p-8 text-center border-2 border-[var(--gold-primary)]">
          <p className="text-xl text-[var(--foreground)] font-semibold mb-4">
            By using Degens¤Den, you acknowledge that you have read, understood, and agree to all terms and disclaimers stated above.
          </p>
          <p className="text-[var(--muted-foreground)]">
            Last Updated: March 2026
          </p>
        </div>
      </div>
    </div>
  );
}
