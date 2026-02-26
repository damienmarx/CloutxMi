import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { nanoid } from "nanoid";

/**
 * Account Security System
 * Handles login attempt tracking, account lockout, and security monitoring
 */

export interface LoginAttempt {
  id: string;
  userId: number;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
}

export interface SecurityLog {
  id: string;
  userId: number;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface AccountLockoutStatus {
  isLocked: boolean;
  lockedUntil?: Date;
  remainingTime?: number; // in seconds
  failedAttempts: number;
  maxAttempts: number;
}

// Security configuration
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  ATTEMPT_RESET_TIME: 60 * 60 * 1000, // 1 hour in milliseconds
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10, // failed attempts in 1 hour
};

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  userId: number,
  ipAddress: string,
  userAgent: string,
  success: boolean
): Promise<LoginAttempt | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const attemptId = nanoid();

    await (await getDb()).execute(sql`
      INSERT INTO loginAttempts (id, userId, ipAddress, userAgent, success)
      VALUES (?, ?, ?, ?, ?)
    `); // Params: attemptId, userId, ipAddress, userAgent, success ? 1 : 0

    // If failed attempt, check for lockout
    if (!success) {
      await checkAndApplyLockout(userId);
    } else {
      // Reset failed attempts on successful login
      await resetFailedAttempts(userId);
    }

    return {
      id: attemptId,
      userId,
      ipAddress,
      userAgent,
      success,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Account Security] Error recording login attempt:", error);
    return null;
  }
}

/**
 * Get failed login attempts for a user
 */
export async function getFailedLoginAttempts(userId: number, timeWindowMs: number = SECURITY_CONFIG.ATTEMPT_RESET_TIME): Promise<LoginAttempt[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const cutoffTime = new Date(Date.now() - timeWindowMs);

    const result = await (await getDb()).execute(sql`
      SELECT * FROM loginAttempts
      WHERE userId = ? AND success = 0 AND createdAt >= ?
      ORDER BY createdAt DESC
    `); // Params: userId, cutoffTime

    return (result || []).map((attempt: any) => ({
      id: attempt.id,
      userId: attempt.userId,
      ipAddress: attempt.ipAddress,
      userAgent: attempt.userAgent,
      success: false,
      timestamp: attempt.createdAt,
    }));
  } catch (error) {
    console.error("[Account Security] Error getting failed login attempts:", error);
    return [];
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(userId: number): Promise<AccountLockoutStatus> {
  const db = await getDb();
  if (!db) {
    return {
      isLocked: false,
      failedAttempts: 0,
      maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
    };
  }

  try {
    const result = await (await getDb()).execute(sql`
      SELECT lockedUntil, loginAttempts FROM users WHERE id = ?
    `); // Params: userId

    if (!result || result.length === 0) {
      return {
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      };
    }

    const user = result[0];
    const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil) : null;
    const now = new Date();

    // Check if lockout has expired
    if (lockedUntil && lockedUntil <= now) {
      // Unlock account
      await (await getDb()).execute(sql`
        UPDATE users SET lockedUntil = NULL, loginAttempts = 0 WHERE id = ?
      `); // Params: userId

      return {
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      };
    }

    const isLocked = lockedUntil ? lockedUntil > now : false;

    return {
      isLocked,
      lockedUntil: isLocked ? lockedUntil : undefined,
      remainingTime: isLocked && lockedUntil ? Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000) : undefined,
      failedAttempts: user.loginAttempts || 0,
      maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
    };
  } catch (error) {
    console.error("[Account Security] Error checking account lock status:", error);
    return {
      isLocked: false,
      failedAttempts: 0,
      maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
    };
  }
}

/**
 * Check and apply lockout if needed
 */
export async function checkAndApplyLockout(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get failed attempts in the last hour
    const failedAttempts = await getFailedLoginAttempts(userId);

    if (failedAttempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      // Lock the account
      const lockedUntil = new Date(Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION);

      await (await getDb()).execute(sql`
        UPDATE users SET lockedUntil = ?, loginAttempts = ? WHERE id = ?
      `); // Params: lockedUntil, failedAttempts.length, userId

      console.warn(`[Account Security] Account ${userId} locked until ${lockedUntil}`);
    } else {
      // Update failed attempt count
      await (await getDb()).execute(sql`
        UPDATE users SET loginAttempts = ? WHERE id = ?
      `); // Params: failedAttempts.length + 1, userId
    }
  } catch (error) {
    console.error("[Account Security] Error applying lockout:", error);
  }
}

/**
 * Reset failed login attempts
 */
export async function resetFailedAttempts(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await (await getDb()).execute(sql`
      UPDATE users SET loginAttempts = 0, lockedUntil = NULL WHERE id = ?
    `); // Params: userId
  } catch (error) {
    console.error("[Account Security] Error resetting failed attempts:", error);
  }
}

/**
 * Record a security event
 */
export async function recordSecurityEvent(
  userId: number,
  eventType: string,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, any>
): Promise<SecurityLog | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const logId = nanoid();

    await (await getDb()).execute(sql`
      INSERT INTO securityLogs (id, userId, eventType, ipAddress, userAgent, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `); // Params: logId, userId, eventType, ipAddress, userAgent, details ? JSON.stringify(details) : null

    return {
      id: logId,
      userId,
      eventType,
      ipAddress,
      userAgent,
      details,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[Account Security] Error recording security event:", error);
    return null;
  }
}

/**
 * Get security logs for a user
 */
export async function getSecurityLogs(userId: number, limit: number = 50): Promise<SecurityLog[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await (await getDb()).execute(sql`
      SELECT * FROM securityLogs
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `); // Params: userId, limit

    return (result || []).map((log: any) => ({
      id: log.id,
      userId: log.userId,
      eventType: log.eventType,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details ? JSON.parse(log.details) : undefined,
      timestamp: log.createdAt,
    }));
  } catch (error) {
    console.error("[Account Security] Error getting security logs:", error);
    return [];
  }
}

/**
 * Detect suspicious activity
 */
export async function detectSuspiciousActivity(userId: number): Promise<{ suspicious: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) {
    return { suspicious: false };
  }

  try {
    // Check for multiple failed login attempts
    const failedAttempts = await getFailedLoginAttempts(userId);
    if (failedAttempts.length >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
      return {
        suspicious: true,
        reason: `${failedAttempts.length} failed login attempts in the last hour`,
      };
    }

    // Check for multiple IP addresses in short time
    const recentLogins = await (await getDb()).execute(sql`
      SELECT DISTINCT ipAddress FROM loginAttempts
      WHERE userId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `); // Params: userId

    if (recentLogins && recentLogins.length > 5) {
      return {
        suspicious: true,
        reason: `Login attempts from ${recentLogins.length} different IP addresses in the last hour`,
      };
    }

    // Check for unusual activity patterns
    const largeTransactions = await (await getDb()).execute(sql`
      SELECT COUNT(*) as count FROM transactions
      WHERE userId = ? AND amount > 10000 AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `); // Params: userId

    if (largeTransactions && largeTransactions[0].count > 3) {
      return {
        suspicious: true,
        reason: "Multiple large transactions detected",
      };
    }

    return { suspicious: false };
  } catch (error) {
    console.error("[Account Security] Error detecting suspicious activity:", error);
    return { suspicious: false };
  }
}

/**
 * Clean up old login attempts (should be run periodically)
 */
export async function cleanupOldLoginAttempts(daysToKeep: number = 30): Promise<{ success: boolean; deletedCount: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, deletedCount: 0 };
  }

  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    await (await getDb()).execute(sql`
      DELETE FROM loginAttempts WHERE createdAt < ?
    `); // Params: cutoffDate

    console.log(`[Account Security] Cleaned up login attempts older than ${daysToKeep} days`);
    return { success: true, deletedCount: 0 };
  } catch (error) {
    console.error("[Account Security] Error cleaning up login attempts:", error);
    return { success: false, deletedCount: 0 };
  }
}
