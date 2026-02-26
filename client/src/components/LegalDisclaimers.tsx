import React from "react";
import { ShieldAlert, Scale, Info } from "lucide-react";

export const LegalDisclaimers: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-12 text-gray-400 text-sm">
      <section className="bg-slate-900/50 border border-red-500/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <ShieldAlert size={24} />
          <h2 className="text-xl font-bold uppercase tracking-tighter italic">Responsible Gaming</h2>
        </div>
        <p className="mb-4">
          Degens Den is a high-stakes entertainment platform. Gambling involves significant risk and can be addictive. 
          Please play responsibly. Only wager what you can afford to lose.
        </p>
        <p>
          Must be 18 years or older to participate. By using cloutscape.org, you confirm you are of legal age 
          in your jurisdiction.
        </p>
      </section>

      <section className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4 text-blue-500">
          <Scale size={24} />
          <h2 className="text-xl font-bold uppercase tracking-tighter italic">Platform Rights & Terms</h2>
        </div>
        <p className="mb-4">
          © 2026 CloutScape. All rights reserved. The "Degens Den" brand, software, and OSRS-themed assets 
          are the property of CloutScape.
        </p>
        <p>
          We reserve the right to refuse service, terminate accounts, or cancel wagers at our discretion 
          to maintain platform integrity and security.
        </p>
      </section>

      <section className="bg-slate-900/50 border border-green-500/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4 text-green-500">
          <Info size={24} />
          <h2 className="text-xl font-bold uppercase tracking-tighter italic">Provably Fair & RNG</h2>
        </div>
        <p>
          All games on cloutscape.org utilize a cryptographically secure Provably Fair system. 
          Results are generated using a combination of server seeds, client seeds, and nonces, 
          allowing any user to independently verify the fairness of every single wager.
        </p>
      </section>
    </div>
  );
};
