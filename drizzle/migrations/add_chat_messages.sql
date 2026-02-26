-- Add chat messages table for live chat functionality
CREATE TABLE IF NOT EXISTS chatMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add rain pool tracking table
CREATE TABLE IF NOT EXISTS rainPool (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
  maxAmount DECIMAL(18, 8) NOT NULL DEFAULT 10000,
  participantCount INT NOT NULL DEFAULT 0,
  status ENUM('accumulating', 'raining', 'completed') DEFAULT 'accumulating',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add rain pool participants tracking
CREATE TABLE IF NOT EXISTS rainPoolParticipants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rainPoolId INT NOT NULL,
  userId INT NOT NULL,
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shareAmount DECIMAL(18, 8) DEFAULT 0,
  
  FOREIGN KEY (rainPoolId) REFERENCES rainPool(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_pool_user (rainPoolId, userId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add chat restriction logs (for moderation)
CREATE TABLE IF NOT EXISTS chatRestrictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  reason VARCHAR(255),
  restrictedUntil TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_restrictedUntil (restrictedUntil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
