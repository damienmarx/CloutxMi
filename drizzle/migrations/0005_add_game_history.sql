-- Create game history table for detailed tracking
CREATE TABLE IF NOT EXISTS gameHistory (
  id VARCHAR(100) PRIMARY KEY,
  userId INT NOT NULL,
  gameType VARCHAR(50) NOT NULL,
  betAmount DECIMAL(15, 2) NOT NULL,
  winAmount DECIMAL(15, 2) NOT NULL,
  multiplier DECIMAL(10, 2) NOT NULL,
  won BOOLEAN NOT NULL,
  duration INT DEFAULT 0, -- in seconds
  details JSON NULL, -- Game-specific details (symbols, numbers, etc.)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_gameType (gameType),
  INDEX idx_won (won),
  INDEX idx_createdAt (createdAt),
  INDEX idx_userId_gameType (userId, gameType),
  INDEX idx_userId_won (userId, won)
);

-- Create index for faster queries on timestamp range
CREATE INDEX idx_gameHistory_timestamp ON gameHistory(userId, createdAt DESC);

-- Add game history statistics table for caching
CREATE TABLE IF NOT EXISTS gameHistoryStats (
  id VARCHAR(100) PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  totalGames INT DEFAULT 0,
  totalWagered DECIMAL(15, 2) DEFAULT 0,
  totalWon DECIMAL(15, 2) DEFAULT 0,
  totalLost DECIMAL(15, 2) DEFAULT 0,
  winRate DECIMAL(5, 2) DEFAULT 0,
  largestWin DECIMAL(15, 2) DEFAULT 0,
  largestLoss DECIMAL(15, 2) DEFAULT 0,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
);
