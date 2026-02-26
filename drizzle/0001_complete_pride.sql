CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameRoundId` varchar(64) NOT NULL,
	`gameId` varchar(64) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`betData` json,
	`result` enum('pending','win','loss','cancelled') NOT NULL DEFAULT 'pending',
	`payout` decimal(20,8) DEFAULT '0',
	`multiplier` decimal(10,4) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`settledAt` timestamp,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameRounds` (
	`id` varchar(64) NOT NULL,
	`gameId` varchar(64) NOT NULL,
	`serverSeed` varchar(255) NOT NULL,
	`serverSeedHash` varchar(255) NOT NULL,
	`clientSeed` varchar(255),
	`nonce` int NOT NULL,
	`outcome` json,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `gameRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('dice','crash','coinflip') NOT NULL,
	`description` text,
	`houseEdge` decimal(5,2) NOT NULL,
	`minBet` decimal(20,8) NOT NULL,
	`maxBet` decimal(20,8) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liveEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('bigWin','highRoller','rareOutcome','streak','jackpot','special') NOT NULL,
	`userId` int,
	`gameId` varchar(64),
	`betId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`metadata` json,
	`isNotified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liveEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketingCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('launch','promo','jackpot','newGame','custom') NOT NULL,
	`template` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`totalVolume` decimal(20,8) NOT NULL DEFAULT '0',
	`totalWagered` decimal(20,8) NOT NULL DEFAULT '0',
	`totalPayouts` decimal(20,8) NOT NULL DEFAULT '0',
	`activePlayerCount` int NOT NULL DEFAULT 0,
	`totalPlayerCount` int NOT NULL DEFAULT 0,
	`gameStats` json,
	CONSTRAINT `platformStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`walletId` int NOT NULL,
	`type` enum('deposit','withdrawal','bet','win','refund') NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`balanceBefore` decimal(20,8) NOT NULL,
	`balanceAfter` decimal(20,8) NOT NULL,
	`gameId` varchar(64),
	`betId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(20,8) NOT NULL DEFAULT '0',
	`totalDeposited` decimal(20,8) NOT NULL DEFAULT '0',
	`totalWithdrawn` decimal(20,8) NOT NULL DEFAULT '0',
	`totalWagered` decimal(20,8) NOT NULL DEFAULT '0',
	`totalWon` decimal(20,8) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('discord','telegram') NOT NULL,
	`url` text NOT NULL,
	`eventTypes` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;