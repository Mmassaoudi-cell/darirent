CREATE TABLE `rate_limit_counters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rate_limit_user_action_window` ON `rate_limit_counters` (`user_id`,`action`,`window_start`);
--> statement-breakpoint
PRAGMA optimize;
