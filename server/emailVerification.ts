import { sql } from "drizzle-orm";
import { getDb } from "./db";
import crypto from "crypto";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";

/**
 * Email Verification System
 * Handles email verification tokens and notifications
 */

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Generate a verification token
 */
export function generateVerificationToken(): { token: string; hash: string } {
  const token = nanoid(32);
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Create an email verification request
 */
export async function createEmailVerificationRequest(
  userId: number,
  email: string
): Promise<{ success: boolean; message: string; verificationToken?: string; expiresIn?: number }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  try {
    // Check if user exists
    const userResult = await db.execute(sql` SELECT id FROM users WHERE id = ${userId} `);
    const userRows = userResult[0] as unknown as any[];

    if (!userRows || userRows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Generate verification token
    const { token, hash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiration

    // Store verification token in database
    const tokenId = nanoid();
    await db.execute(sql` INSERT INTO emailVerificationTokens 
       (id, userId, email, tokenHash, expiresAt, verified)
       VALUES (${tokenId}, ${userId}, ${email}, ${hash}, ${expiresAt.toISOString()}, 0) `);

    return {
      success: true,
      message: "Email verification request created successfully",
      verificationToken: token,
      expiresIn: 86400, // 24 hours in seconds
    };
  } catch (error) {
    console.error("[Email Verification] Error creating verification request:", error);
    return {
      success: false,
      message: "Failed to create email verification request",
    };
  }
}

/**
 * Validate an email verification token
 */
export async function validateVerificationToken(token: string): Promise<{ valid: boolean; userId?: number; email?: string; error?: string }> {
  const db = await getDb();
  if (!db) {
    return {
      valid: false,
      error: "Database unavailable",
    };
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the verification token
    const result = await db.execute(sql` SELECT * FROM emailVerificationTokens WHERE tokenHash = ${tokenHash} `);
    const rows = result[0] as unknown as any[];

    if (!rows || rows.length === 0) {
      return {
        valid: false,
        error: "Invalid verification token",
      };
    }

    const verificationRecord = rows[0];

    // Check if already verified
    if (verificationRecord.verified === 1) {
      return {
        valid: false,
        error: "This email has already been verified",
      };
    }

    // Check if token has expired
    if (new Date() > new Date(verificationRecord.expiresAt)) {
      return {
        valid: false,
        error: "This verification token has expired",
      };
    }

    return {
      valid: true,
      userId: verificationRecord.userId,
      email: verificationRecord.email,
    };
  } catch (error) {
    console.error("[Email Verification] Error validating token:", error);
    return {
      valid: false,
      error: "Failed to validate verification token",
    };
  }
}

/**
 * Mark email as verified
 */
export async function markEmailAsVerified(token: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find and update the verification token
    const result = await db.execute(sql` SELECT * FROM emailVerificationTokens WHERE tokenHash = ${tokenHash} `);
    const rows = result[0] as unknown as any[];

    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: "Verification token not found",
      };
    }

    const verificationRecord = rows[0];

    // Update user email verification status
    await db.execute(sql` UPDATE users SET email = ${verificationRecord.email} WHERE id = ${verificationRecord.userId} `);

    // Mark token as verified
    await db.execute(sql` UPDATE emailVerificationTokens SET verified = 1 WHERE tokenHash = ${tokenHash} `);

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("[Email Verification] Error marking email as verified:", error);
    return {
      success: false,
      message: "Failed to verify email",
    };
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  userName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || "Support@cloutscape.org",
      to: email,
      subject: "Verify your CloutScape email",
      html: `
        <h2>Email Verification</h2>
        <p>Hi ${userName || "User"},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br/>CloutScape Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Verification email sent successfully",
    };
  } catch (error) {
    console.error("[Email Verification] Error sending verification email:", error);
    return {
      success: false,
      message: "Failed to send verification email",
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable",
    };
  }

  try {
    // Get user details
    const userResult = await db.execute(sql` SELECT email, name FROM users WHERE id = ${userId} `);
    const userRows = userResult[0] as unknown as any[];

    if (!userRows || userRows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const user = userRows[0];

    // Create new verification request
    const verificationRequest = await createEmailVerificationRequest(userId, user.email);

    if (!verificationRequest.success || !verificationRequest.verificationToken) {
      return {
        success: false,
        message: "Failed to create verification request",
      };
    }

    // Send verification email
    return await sendVerificationEmail(user.email, verificationRequest.verificationToken, user.name);
  } catch (error) {
    console.error("[Email Verification] Error resending verification email:", error);
    return {
      success: false,
      message: "Failed to resend verification email",
    };
  }
}
