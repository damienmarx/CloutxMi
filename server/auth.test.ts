import { sql } from "drizzle-orm";
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  validateUsername,
  validateEmail,
} from "./auth";

describe("Authentication Utilities", () => {
  describe("Password Hashing", () => {
    it("should hash a password", () => {
      const password = "TestPassword123";
      const hash = hashPassword(password);
      expect(hash).toBeTruthy();
      expect(hash).toContain(":");
    });

    it("should verify a correct password", () => {
      const password = "TestPassword123";
      const hash = hashPassword(password);
      expect(verifyPassword(password, hash)).toBe(true);
    });

    it("should reject an incorrect password", () => {
      const password = "TestPassword123";
      const hash = hashPassword(password);
      expect(verifyPassword("WrongPassword", hash)).toBe(false);
    });

    it("should produce different hashes for the same password", () => {
      const password = "TestPassword123";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it("should handle invalid hash format", () => {
      expect(verifyPassword("password", "invalid")).toBe(false);
    });
  });

  describe("Password Validation", () => {
    it("should accept a strong password", () => {
      const result = validatePasswordStrength("StrongPass123");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject a password that is too short", () => {
      const result = validatePasswordStrength("Short1A");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should reject a password without uppercase", () => {
      const result = validatePasswordStrength("lowercase123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should reject a password without lowercase", () => {
      const result = validatePasswordStrength("UPPERCASE123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should reject a password without numbers", () => {
      const result = validatePasswordStrength("NoNumbers");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });
  });

  describe("Username Validation", () => {
    it("should accept a valid username", () => {
      const result = validateUsername("validuser123");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept usernames with underscores and hyphens", () => {
      const result = validateUsername("valid_user-123");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject a username that is too short", () => {
      const result = validateUsername("ab");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Username must be at least 3 characters long");
    });

    it("should reject a username that is too long", () => {
      const result = validateUsername("a".repeat(65));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Username must not exceed 64 characters");
    });

    it("should reject a username with invalid characters", () => {
      const result = validateUsername("invalid@user");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Username can only contain letters, numbers, underscores, and hyphens");
    });
  });

  describe("Email Validation", () => {
    it("should accept a valid email", () => {
      expect(validateEmail("user@example.com")).toBe(true);
    });

    it("should accept emails with subdomains", () => {
      expect(validateEmail("user@mail.example.com")).toBe(true);
    });

    it("should reject an email without @", () => {
      expect(validateEmail("userexample.com")).toBe(false);
    });

    it("should reject an email without domain", () => {
      expect(validateEmail("user@")).toBe(false);
    });

    it("should reject an email without local part", () => {
      expect(validateEmail("@example.com")).toBe(false);
    });
  });
});
