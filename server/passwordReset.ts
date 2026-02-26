import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import crypto from "crypto";

/**
 * Password Reset System
 * Handles secure password reset requests and token validation
 */

export interface PasswordResetToken {
  id: string;
  userId: number;
  token: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface PasswordResetRequest {
  success: boolean;
  message: string;
  resetToken?: string;
  expiresIn?: number; // seconds
}

/**
 * Generate a secure password reset token
 */
export function generateResetToken(): { token: string; hash: string } {
  const token = nanoid(32); // 32 character random token
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Create a password reset request for a user
 * Returns a token that should be sent via email to the user
 */
export async function createPasswordResetRequest(email: string): Promise<PasswordResetRequest> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  try {
    // Find user by email
    const userResult = await (await getDb()).execute(sql` SELECT id FROM users WHERE email = ? `); // Params: email

    if (!userResult || userResult.length === 0) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message: "If an account with this email exists, a password reset link has been sent",
      };
    }

    const userId = userResult[0].id;

    // Generate reset token
    const { token, hash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Store reset token in database
    const resetId = nanoid();
    await (await getDb()).execute(sql` INSERT INTO passwordResetTokens (id, userId, tokenHash, expiresAt, used)
       VALUES (?, ?, ?, ?, 0) `); // Params: resetId, userId, hash, expiresAt

    return {
      success: true,
      message: "Password reset request created successfully",
      resetToken: token,
      expiresIn: 3600, // 1 hour in seconds
    };
  } catch (error) {
    console.error("[Password Reset] Error creating reset request:", error);
    return {
      success: false,
      message: "Failed to create password reset request",
    };
  }
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string): Promise<{ valid: boolean; userId?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return {
      valid: false,
      error: "Database unavailable",
    };
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the reset token
    const result = await (await getDb()).execute(sql` SELECT * FROM passwordResetTokens WHERE tokenHash = ? `); // Params: tokenHash

    if (!result || result.length === 0) {
      return {
        valid: false,
        error: "Invalid reset token",
      };
    }

    const resetRecord = result[0];

    // Check if token is already used
    if (resetRecord.used === 1) {
      return {
        valid: false,
        error: "This reset token has already been used",
      };
    }

    // Check if token has expired
    if (new Date() > resetRecord.expiresAt) {
      return {
        valid: false,
        error: "This reset token has expired",
      };
    }

    return {
      valid: true,
      userId: resetRecord.userId,
    };
  } catch (error) {
    console.error("[Password Reset] Error validating token:", error);
    return {
      valid: false,
      error: "Failed to validate reset token",
    };
  }
}

/**
 * Reset password using a valid token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  try {
    // Validate token
    const validation = await validateResetToken(token);
    if (!validation.valid || !validation.userId) {
      return {
        success: false,
        message: validation.error || "Invalid reset token",
      };
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match",
      };
    }

    // Validate password strength (same as registration)
    if (newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
      };
    }
    if (!/[A-Z]/.test(newPassword)) {
      return {
        success: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!/[a-z]/.test(newPassword)) {
      return {
        success: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!/[0-9]/.test(newPassword)) {
      return {
        success: false,
        message: "Password must contain at least one number",
      };
    }

    // Hash new password
    const { hashPassword } = await import("./auth");
    const passwordHash = hashPassword(newPassword);

    // Update user password
    await (await getDb()).execute(sql` UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE id = ? `); // Params: passwordHash, validation.userId

    // Mark reset token as used
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await (await getDb()).execute(sql` UPDATE passwordResetTokens SET used = 1, usedAt = NOW() WHERE tokenHash = ? `); // Params: tokenHash

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    console.error("[Password Reset] Error resetting password:", error);
    return {
      success: false,
      message: "Failed to reset password",
    };
  }
}

/**
 * Clean up expired reset tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<{ success: boolean; deletedCount: number }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      deletedCount: 0,
    };
  }

  try {
    // Delete tokens that expired more than 24 hours ago
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await (await getDb()).execute(sql` DELETE FROM passwordResetTokens WHERE expiresAt < ? AND used = 1 `); // Params: cutoffDate

    console.log("[Password Reset] Cleaned up expired tokens");
    return {
      success: true,
      deletedCount: 0,
    };
  } catch (error) {
    console.error("[Password Reset] Error cleaning up tokens:", error);
    return {
      success: false,
      deletedCount: 0,
    };
  }
}
