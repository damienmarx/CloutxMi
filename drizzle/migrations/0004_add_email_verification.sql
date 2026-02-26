-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS emailVerificationTokens (
  id VARCHAR(100) PRIMARY KEY,
  userId INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  tokenHash VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verifiedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt),
  INDEX idx_verified (verified)
);

-- Add email verification columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationToken VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationTokenExpiresAt TIMESTAMP NULL;
