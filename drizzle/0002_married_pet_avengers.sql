CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`mentions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rainEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalAmount` decimal(15,2) NOT NULL,
	`participantCount` int NOT NULL,
	`amountPerPlayer` decimal(15,2) NOT NULL,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `rainEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rainParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rainEventId` int NOT NULL,
	`userId` int NOT NULL,
	`amountReceived` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rainParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `discordId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramId` varchar(64);