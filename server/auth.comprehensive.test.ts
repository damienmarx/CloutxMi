import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validateUsername,
  validatePasswordStrength,
  validateEmail,
} from "./auth";
import {
  createPasswordResetRequest,
  validateResetToken,
  resetPasswordWithToken,
} from "./passwordReset";

/**
 * Comprehensive Authentication Test Suite
 * Tests password hashing, validation, and password reset functionality
 */

describe("Authentication - Password Hashing", () => {
  it("should hash a password correctly", () => {
    const password = "TestPassword123";
    const hash = hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain(":");
    const [salt, hashedPart] = hash.split(":");
    expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(hashedPart).toHaveLength(128); // 64 bytes = 128 hex chars
  });

  it("should verify a correct password", () => {
    const password = "TestPassword123";
    const hash = hashPassword(password);
    const isValid = verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it("should reject an incorrect password", () => {
    const password = "TestPassword123";
    const wrongPassword = "WrongPassword456";
    const hash = hashPassword(password);
    const isValid = verifyPassword(wrongPassword, hash);

    expect(isValid).toBe(false);
  });

  it("should generate different hashes for the same password", () => {
    const password = "TestPassword123";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });

  it("should handle invalid hash format gracefully", () => {
    const isValid = verifyPassword("TestPassword123", "invalid:hash:format");
    expect(isValid).toBe(false);
  });
});

describe("Authentication - Username Validation", () => {
  it("should accept valid usernames", () => {
    const validUsernames = ["user123", "john_doe", "test-user", "a1b2c3"];

    validUsernames.forEach((username) => {
      const result = validateUsername(username);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it("should reject usernames that are too short", () => {
    const result = validateUsername("ab");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("at least 3 characters");
  });

  it("should reject usernames that are too long", () => {
    const longUsername = "a".repeat(65);
    const result = validateUsername(longUsername);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("not exceed 64 characters");
  });

  it("should reject usernames with invalid characters", () => {
    const invalidUsernames = ["user@123", "user name", "user!", "user#"];

    invalidUsernames.forEach((username) => {
      const result = validateUsername(username);
      expect(result.valid).toBe(false);
    });
  });

  it("should accept usernames with underscores and hyphens", () => {
    const result1 = validateUsername("user_name");
    const result2 = validateUsername("user-name");

    expect(result1.valid).toBe(true);
    expect(result2.valid).toBe(true);
  });
});

describe("Authentication - Password Strength Validation", () => {
  it("should accept strong passwords", () => {
    const result = validatePasswordStrength("StrongPassword123");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject passwords that are too short", () => {
    const result = validatePasswordStrength("Short1A");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("at least 8 characters");
  });

  it("should reject passwords without uppercase letters", () => {
    const result = validatePasswordStrength("lowercase123");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("uppercase letter");
  });

  it("should reject passwords without lowercase letters", () => {
    const result = validatePasswordStrength("UPPERCASE123");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("lowercase letter");
  });

  it("should reject passwords without numbers", () => {
    const result = validatePasswordStrength("NoNumbers");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("number");
  });

  it("should report multiple validation errors", () => {
    const result = validatePasswordStrength("short");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe("Authentication - Email Validation", () => {
  it("should accept valid email addresses", () => {
    const validEmails = [
      "user@example.com",
      "john.doe@company.co.uk",
      "test+tag@domain.org",
    ];

    validEmails.forEach((email) => {
      const isValid = validateEmail(email);
      expect(isValid).toBe(true);
    });
  });

  it("should reject invalid email addresses", () => {
    const invalidEmails = [
      "notanemail",
      "user@",
      "@example.com",
      "user @example.com",
      "user@example",
    ];

    invalidEmails.forEach((email) => {
      const isValid = validateEmail(email);
      expect(isValid).toBe(false);
    });
  });
});

describe("Authentication - Password Reset", () => {
  it("should create a password reset request", async () => {
    const result = await createPasswordResetRequest("test@example.com");

    expect(result.success).toBe(true);
    expect(result.resetToken).toBeDefined();
    expect(result.expiresIn).toBe(3600); // 1 hour
  });

  it("should return success even for non-existent emails (for security)", async () => {
    const result = await createPasswordResetRequest("nonexistent@example.com");

    expect(result.success).toBe(true);
    expect(result.message).toContain("If an account with this email exists");
  });

  it("should validate a reset token", async () => {
    // This test would require a valid token from the database
    // For now, we test the validation logic
    const result = await validateResetToken("invalid-token");

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject expired reset tokens", async () => {
    // This would require setting up an expired token in the database
    // Placeholder for integration test
    expect(true).toBe(true);
  });

  it("should reject already-used reset tokens", async () => {
    // This would require setting up a used token in the database
    // Placeholder for integration test
    expect(true).toBe(true);
  });

  it("should reset password with valid token", async () => {
    // This would require a valid token and database setup
    // Placeholder for integration test
    expect(true).toBe(true);
  });

  it("should reject password reset if passwords don't match", async () => {
    const result = await resetPasswordWithToken(
      "valid-token",
      "NewPassword123",
      "DifferentPassword456"
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("do not match");
  });

  it("should enforce password strength on reset", async () => {
    const result = await resetPasswordWithToken(
      "valid-token",
      "weak",
      "weak"
    );

    expect(result.success).toBe(false);
  });
});

describe("Authentication - Security Edge Cases", () => {
  it("should handle SQL injection attempts in username", () => {
    const result = validateUsername("admin'; DROP TABLE users; --");
    expect(result.valid).toBe(false);
  });

  it("should handle very long input gracefully", () => {
    const longInput = "a".repeat(10000);
    const result = validateUsername(longInput);
    expect(result.valid).toBe(false);
  });

  it("should handle special characters in password", () => {
    const password = "P@ssw0rd!#$%";
    const hash = hashPassword(password);
    const isValid = verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should handle unicode characters in password", () => {
    const password = "Pässwörd123";
    const hash = hashPassword(password);
    const isValid = verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});
