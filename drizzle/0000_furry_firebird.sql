CREATE TABLE `alerts_sent` (
	`id` text PRIMARY KEY NOT NULL,
	`saved_search_id` text NOT NULL,
	`property_id` text NOT NULL,
	`channel` text DEFAULT 'in_app' NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`saved_search_id`) REFERENCES `saved_searches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_alerts_saved_property_channel` ON `alerts_sent` (`saved_search_id`,`property_id`,`channel`);--> statement-breakpoint
CREATE TABLE `inspection_media` (
	`id` text PRIMARY KEY NOT NULL,
	`inspection_id` text NOT NULL,
	`room` text NOT NULL,
	`object_key` text NOT NULL,
	`sha256` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`inspection_id`) REFERENCES `inspections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_inspection_media_inspection` ON `inspection_media` (`inspection_id`);--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`uploader_id` text NOT NULL,
	`coverage_pct` integer NOT NULL,
	`ai_findings` text NOT NULL,
	`disclaimer_ack` integer NOT NULL,
	`model_version` text DEFAULT 'coverage-rules-v1' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_inspections_property_created` ON `inspections` (`property_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`sender_id` text,
	`recipient_id` text NOT NULL,
	`body` text NOT NULL,
	`channel` text DEFAULT 'in_app' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_messages_property_created` ON `messages` (`property_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_messages_recipient_created` ON `messages` (`recipient_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `opportunity_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`price_value` integer NOT NULL,
	`condition_score` integer NOT NULL,
	`trust_score` integer NOT NULL,
	`location_fit` integer NOT NULL,
	`composite` integer NOT NULL,
	`model_version` text NOT NULL,
	`computed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_opportunity_scores_property_computed` ON `opportunity_scores` (`property_id`,`computed_at`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`neighborhood` text NOT NULL,
	`city` text DEFAULT 'Tunis' NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`price_dt` integer NOT NULL,
	`deposit_dt` integer DEFAULT 0 NOT NULL,
	`agency_fee_dt` integer DEFAULT 0 NOT NULL,
	`size_m2` integer NOT NULL,
	`rooms` text NOT NULL,
	`furnished` integer DEFAULT false NOT NULL,
	`parking` integer DEFAULT false NOT NULL,
	`elevator` integer DEFAULT false NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_preview` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_properties_status_created` ON `properties` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_properties_neighborhood_status` ON `properties` (`neighborhood`,`status`);--> statement-breakpoint
CREATE INDEX `idx_properties_rooms_price` ON `properties` (`rooms`,`price_dt`);--> statement-breakpoint
CREATE INDEX `idx_properties_owner_status` ON `properties` (`owner_id`,`status`);--> statement-breakpoint
CREATE TABLE `property_images` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`url` text NOT NULL,
	`object_key` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`source` text DEFAULT 'owner_upload' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_property_images_property_sort` ON `property_images` (`property_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `property_views` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`user_id` text,
	`session_hash` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_property_views_property_created` ON `property_views` (`property_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `saved_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'My rental search' NOT NULL,
	`filters` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_saved_searches_user_created` ON `saved_searches` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'renter' NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text NOT NULL,
	`identity_verified_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`identity_object_key` text NOT NULL,
	`property_proof_object_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_verification_requests_user_status` ON `verification_requests` (`user_id`,`status`);
--> statement-breakpoint
INSERT INTO `users` (`id`, `role`, `name`, `email`)
VALUES ('preview-owner', 'owner', 'DariRent launch preview', 'preview@darirent.tn');
--> statement-breakpoint
INSERT INTO `properties` (`id`, `owner_id`, `title`, `neighborhood`, `city`, `lat`, `lng`, `price_dt`, `deposit_dt`, `agency_fee_dt`, `size_m2`, `rooms`, `furnished`, `parking`, `elevator`, `description`, `status`, `is_preview`)
VALUES
  ('preview-ain-zaghouan', 'preview-owner', 'Bright furnished S+2', 'Aïn Zaghouan Nord', 'Tunis', 36.8667, 10.2833, 1450, 1450, 0, 105, 'S+2', 1, 1, 1, 'Launch preview demonstrating transparent costs, verified evidence, and a commute-aware rental decision.', 'published', 1),
  ('preview-el-aouina', 'preview-owner', 'Sunny S+2 near everyday services', 'El Aouina', 'Tunis', 36.8508, 10.2636, 1320, 1320, 0, 96, 'S+2', 0, 0, 1, 'Launch preview of an unfurnished apartment with clear fees and inspection status.', 'published', 1),
  ('preview-carthage', 'preview-owner', 'Furnished S+2 with garage', 'Jardins de Carthage', 'Tunis', 36.8519, 10.3200, 1850, 1850, 0, 112, 'S+2', 1, 1, 1, 'Launch preview for remote renters comparing condition, cost, and location fit.', 'published', 1);
--> statement-breakpoint
INSERT INTO `opportunity_scores` (`id`, `property_id`, `price_value`, `condition_score`, `trust_score`, `location_fit`, `composite`, `model_version`)
VALUES
  ('score-preview-1', 'preview-ain-zaghouan', 88, 91, 74, 87, 86, 'weighted-v1'),
  ('score-preview-2', 'preview-el-aouina', 91, 75, 68, 82, 82, 'weighted-v1'),
  ('score-preview-3', 'preview-carthage', 70, 94, 76, 91, 80, 'weighted-v1');
