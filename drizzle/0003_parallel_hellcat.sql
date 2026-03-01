ALTER TABLE `users` ADD `mfaSecret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `mfaEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `mfaRecoveryCodes` text;