-- Create login attempts tracking table
CREATE TABLE IF NOT EXISTS loginAttempts (
  id VARCHAR(100) PRIMARY KEY,
  userId INT NOT NULL,
  ipAddress VARCHAR(45) NOT NULL, -- Support IPv4 and IPv6
  userAgent VARCHAR(500),
  success BOOLEAN NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_success (success),
  INDEX idx_createdAt (createdAt),
  INDEX idx_userId_success (userId, success),
  INDEX idx_userId_createdAt (userId, createdAt DESC)
);

-- Create security logs table
CREATE TABLE IF NOT EXISTS securityLogs (
  id VARCHAR(100) PRIMARY KEY,
  userId INT NOT NULL,
  eventType VARCHAR(100) NOT NULL,
  ipAddress VARCHAR(45),
  userAgent VARCHAR(500),
  details JSON NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_eventType (eventType),
  INDEX idx_createdAt (createdAt),
  INDEX idx_userId_eventType (userId, eventType),
  INDEX idx_userId_createdAt (userId, createdAt DESC)
);

-- Add security columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS loginAttempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockedUntil TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastLoginAt TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastLoginIp VARCHAR(45) NULL;

-- Create index for faster account lock checks
CREATE INDEX IF NOT EXISTS idx_users_lockedUntil ON users(lockedUntil);
