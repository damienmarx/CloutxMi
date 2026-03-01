
import { sql } from "drizzle-orm";
import crypto from "crypto";
import argon2 from "argon2";
import { db } from "./db";

/**
 * Hash a password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Argon2id is recommended by OWASP for password hashing
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 65536 KiB
      timeCost: 3, // Number of iterations
      parallelism: 1, // Number of threads
    });
    return hash;
  } catch (error) {
    console.error("[Auth] Password hashing error:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a hash, with PBKDF2 fallback and migration.
 */
export async function verifyPassword(
  password: string,
  hash: string,
  userId: number
): Promise<boolean> {
  try {
    // If the hash is in the old PBKDF2 format (salt:hash)
    if (hash.includes(":")) {
      const [salt, storedHash] = hash.split(":");
      if (!salt || !storedHash) {
        return false;
      }
      const computedHash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("hex");

      if (computedHash === storedHash) {
        // Password is correct, migrate to Argon2id
        const newHash = await hashPassword(password);
        await db.updateUserPassword(userId, newHash);
        return true;
      }
      return false;
    }

    // Otherwise, assume Argon2id and verify
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error("[Auth] Password verification error:", error);
    return false;
  }
}

