CREATE TABLE `blackjackGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`playerHand` text NOT NULL,
	`dealerHand` text NOT NULL,
	`result` enum('win','loss','push') NOT NULL,
	`payout` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blackjackGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crashGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`multiplier` decimal(5,2) NOT NULL,
	`cashoutMultiplier` decimal(5,2),
	`payout` decimal(15,2) DEFAULT '0.00',
	`status` enum('won','lost','pending') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crashGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`requirement` int NOT NULL,
	`reward` decimal(10,2) NOT NULL,
	`game` varchar(50) NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diceGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`prediction` varchar(20) NOT NULL,
	`roll` int NOT NULL,
	`multiplier` decimal(5,2) NOT NULL,
	`payout` decimal(15,2) NOT NULL,
	`result` enum('win','loss') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diceGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pokerGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`playerHand` text NOT NULL,
	`handRank` varchar(50) NOT NULL,
	`payout` decimal(15,2) NOT NULL,
	`result` enum('win','loss') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pokerGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`commissionPercentage` decimal(5,2) NOT NULL,
	`totalCommission` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `rouletteGames` (
	`id` varchar(100) NOT NULL,
	`userId` int NOT NULL,
	`betAmount` decimal(15,2) NOT NULL,
	`betType` varchar(50) NOT NULL,
	`winningNumber` int NOT NULL,
	`result` enum('win','loss') NOT NULL,
	`payout` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rouletteGames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournamentParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`rank` int,
	`prizeWon` decimal(10,2),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournamentParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`entryFee` decimal(10,2) NOT NULL,
	`prizePool` decimal(10,2) NOT NULL,
	`status` enum('active','completed','upcoming') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userChallengeProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` int NOT NULL DEFAULT 0,
	`claimedReward` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	CONSTRAINT `userChallengeProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vipTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('bronze','silver','gold','platinum','diamond') NOT NULL DEFAULT 'bronze',
	`totalWagered` decimal(15,2) NOT NULL DEFAULT '0',
	`cashbackPercentage` decimal(5,2) NOT NULL,
	`bonusMultiplier` decimal(5,2) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vipTiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `vipTiers_userId_unique` UNIQUE(`userId`)
);
