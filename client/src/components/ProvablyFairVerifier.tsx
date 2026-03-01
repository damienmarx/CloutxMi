
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import crypto from "crypto-js";

export default function ProvablyFairVerifier() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleVerify = () => {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = crypto.SHA256(combined).toString(crypto.enc.Hex);
    const hexValue = hash.substring(0, 8);
    const intValue = parseInt(hexValue, 16);
    const gameResult = intValue / 0xffffffff;
    setResult(`Hash: ${hash}\nResult: ${gameResult}`);
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Provably Fair Verifier</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="serverSeed">Server Seed</Label>
          <Input id="serverSeed" value={serverSeed} onChange={(e) => setServerSeed(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="clientSeed">Client Seed</Label>
          <Input id="clientSeed" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="nonce">Nonce</Label>
          <Input id="nonce" value={nonce} onChange={(e) => setNonce(e.target.value)} />
        </div>
        <Button onClick={handleVerify}>Verify</Button>
        {result && (
          <div className="mt-4 p-2 bg-gray-800 rounded">
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </Card>
  );
}
