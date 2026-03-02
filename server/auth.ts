
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

/**
 * Validate a username for length and characters.
 */
export function validateUsername(username: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (username.length < 3) errors.push("Username must be at least 3 characters long");
  if (username.length > 64) errors.push("Username must be at most 64 characters long");
  if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push("Username can only contain letters, numbers, and underscores");
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate password strength.
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simple email validation.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
