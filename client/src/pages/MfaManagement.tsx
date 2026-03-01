
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MfaManagement() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSecretMutation = trpc.mfa.generateSecret.useMutation();
  const enableMfaMutation = trpc.mfa.enable.useMutation();
  const disableMfaMutation = trpc.mfa.disable.useMutation();

  const handleGenerateSecret = async () => {
    try {
      const result = await generateSecretMutation.mutateAsync();
      setQrCode(result.qrCodeDataUrl);
    } catch (err) {
      setError("Failed to generate MFA secret.");
    }
  };

  const handleEnableMfa = async () => {
    try {
      const result = await enableMfaMutation.mutateAsync({ token });
      if (result.success) {
        setRecoveryCodes(result.recoveryCodes || []);
        setQrCode(null);
      } else {
        setError("Invalid MFA token.");
      }
    } catch (err) {
      setError("Failed to enable MFA.");
    }
  };

  const handleDisableMfa = async () => {
    try {
      await disableMfaMutation.mutateAsync();
      window.location.reload();
    } catch (err) {
      setError("Failed to disable MFA.");
    }
  };

  useEffect(() => {
    if (user && !user.mfaEnabled) {
      handleGenerateSecret();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Multi-Factor Authentication</h1>
      {user.mfaEnabled ? (
        <Card className="p-4">
          <h2 className="text-xl font-semibold">MFA is Enabled</h2>
          <p className="text-gray-400 mb-4">You have successfully set up MFA.</p>
          <Button onClick={handleDisableMfa} variant="destructive">Disable MFA</Button>
        </Card>
      ) : (
        <Card className="p-4">
          <h2 className="text-xl font-semibold">Set up MFA</h2>
          {qrCode && (
            <div className="flex flex-col items-center">
              <p className="mb-2">Scan this QR code with your authenticator app:</p>
              <img src={qrCode} alt="MFA QR Code" className="mb-4" />
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter MFA token"
                className="mb-4"
              />
              <Button onClick={handleEnableMfa}>Enable MFA</Button>
            </div>
          )}
        </Card>
      )}
      {recoveryCodes && (
        <Card className="p-4 mt-4">
          <h2 className="text-xl font-semibold">Recovery Codes</h2>
          <p className="text-gray-400 mb-4">Save these recovery codes in a safe place. They can be used to access your account if you lose your MFA device.</p>
          <div className="grid grid-cols-2 gap-2">
            {recoveryCodes.map((code) => (
              <div key={code} className="bg-gray-800 p-2 rounded">{code}</div>
            ))}
          </div>
        </Card>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
