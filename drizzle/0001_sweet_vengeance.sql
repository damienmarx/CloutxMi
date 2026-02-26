CREATE TABLE `kenoGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`selectedNumbers` text NOT NULL,
	`drawnNumbers` text,
	`matchedCount` int DEFAULT 0,
	`multiplier` decimal(5,2) DEFAULT '1.00',
	`winAmount` decimal(15,2) DEFAULT '0.00',
	`turboMode` int DEFAULT 0,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `kenoGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slotsGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`reels` text NOT NULL,
	`paylines` int DEFAULT 1,
	`matchedPaylines` text,
	`multiplier` decimal(5,2) DEFAULT '1.00',
	`winAmount` decimal(15,2) DEFAULT '0.00',
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `slotsGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','tip','game_win','game_loss') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`description` text,
	`relatedUserId` int,
	`gameType` varchar(50),
	`gameId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`totalDeposited` decimal(15,2) NOT NULL DEFAULT '0.00',
	`totalWithdrawn` decimal(15,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'username';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);