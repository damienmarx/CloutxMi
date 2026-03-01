
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import { db } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a new MFA secret for a user.
 */
export async function generateMfaSecret(userId: number, username: string) {
  const secret = speakeasy.generateSecret({ name: `CloutScape:${username}` });
  await db.update(users).set({ mfaSecret: secret.base32 }).where(eq(users.id, userId));
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.ascii,
    label: `CloutScape:${username}`,
    issuer: "CloutScape",
  });
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
  return { secret: secret.base32, qrCodeDataUrl };
}

/**
 * Verify an MFA token.
 */
export async function verifyMfaToken(userId: number, token: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.mfaSecret) {
    return false;
  }
  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: "base32",
    token,
  });
}

/**
 * Enable MFA for a user.
 */
export async function enableMfa(userId: number, token: string): Promise<{ success: boolean; recoveryCodes?: string[] }> {
  const isValid = await verifyMfaToken(userId, token);
  if (isValid) {
    const recoveryCodes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10));
    await db.update(users).set({ mfaEnabled: true, mfaRecoveryCodes: JSON.stringify(recoveryCodes) }).where(eq(users.id, userId));
    return { success: true, recoveryCodes };
  }
  return { success: false };
}

/**
 * Disable MFA for a user.
 */
export async function disableMfa(userId: number): Promise<void> {
  await db.update(users).set({ mfaEnabled: false, mfaSecret: null, mfaRecoveryCodes: null }).where(eq(users.id, userId));
}
