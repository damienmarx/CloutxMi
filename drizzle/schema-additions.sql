-- Chat Messages Table
CREATE TABLE IF NOT EXISTS `chatMessages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `username` varchar(64) NOT NULL,
  `message` text NOT NULL,
  `mentions` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chatMessages_id` PRIMARY KEY (`id`),
  CONSTRAINT `chatMessages_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Rain Events Table
CREATE TABLE IF NOT EXISTS `rainEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `totalAmount` decimal(15,2) NOT NULL,
  `participantCount` int NOT NULL,
  `amountPerPlayer` decimal(15,2) NOT NULL,
  `status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` timestamp,
  CONSTRAINT `rainEvents_id` PRIMARY KEY (`id`)
);

-- Rain Participants Table
CREATE TABLE IF NOT EXISTS `rainParticipants` (
  `id` int AUTO_INCREMENT NOT NULL,
  `rainEventId` int NOT NULL,
  `userId` int NOT NULL,
  `amountReceived` decimal(15,2) NOT NULL,
  `claimedAt` timestamp,
  CONSTRAINT `rainParticipants_id` PRIMARY KEY (`id`),
  CONSTRAINT `rainParticipants_rainEventId_fk` FOREIGN KEY (`rainEventId`) REFERENCES `rainEvents`(`id`) ON DELETE CASCADE,
  CONSTRAINT `rainParticipants_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- User Stats Table
CREATE TABLE IF NOT EXISTS `userStats` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL UNIQUE,
  `totalWagered` decimal(15,2) DEFAULT '0' NOT NULL,
  `totalWon` decimal(15,2) DEFAULT '0' NOT NULL,
  `totalLost` decimal(15,2) DEFAULT '0' NOT NULL,
  `gamesPlayed` int DEFAULT 0 NOT NULL,
  `winRate` decimal(5,2) DEFAULT '0' NOT NULL,
  `level` int DEFAULT 1 NOT NULL,
  `experience` int DEFAULT 0 NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `userStats_id` PRIMARY KEY (`id`),
  CONSTRAINT `userStats_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX `chatMessages_createdAt` ON `chatMessages`(`createdAt`);
CREATE INDEX `rainEvents_status` ON `rainEvents`(`status`);
CREATE INDEX `rainParticipants_userId` ON `rainParticipants`(`userId`);
CREATE INDEX `userStats_userId` ON `userStats`(`userId`);
