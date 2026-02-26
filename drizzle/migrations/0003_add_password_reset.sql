-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS passwordResetTokens (
  id VARCHAR(100) PRIMARY KEY,
  userId INT NOT NULL,
  tokenHash VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  usedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt)
);

-- Add email verification status to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationToken VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationTokenExpiresAt TIMESTAMP NULL;

-- Add account lockout protection
ALTER TABLE users ADD COLUMN IF NOT EXISTS loginAttempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockedUntil TIMESTAMP NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
