ALTER TABLE `users` ADD `date_of_birth` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `is_age_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `self_exclusion_until` timestamp;