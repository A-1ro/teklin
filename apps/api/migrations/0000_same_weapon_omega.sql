CREATE TABLE `ai_rewrite_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`original_text` text NOT NULL,
	`rewritten_text` text NOT NULL,
	`explanation` text NOT NULL,
	`context` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`domain` text NOT NULL,
	`level` text NOT NULL,
	`content_json` text NOT NULL,
	`type` text NOT NULL,
	`target_weaknesses` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phrase_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`phrase` text NOT NULL,
	`translation` text NOT NULL,
	`context` text NOT NULL,
	`domain` text NOT NULL,
	`level` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `placement_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reading_score` integer NOT NULL,
	`writing_score` integer NOT NULL,
	`vocabulary_score` integer NOT NULL,
	`nuance_score` integer NOT NULL,
	`level` text NOT NULL,
	`weaknesses` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `placement_results_user_created_idx` ON `placement_results` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_learned_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`score` integer NOT NULL,
	`feedback` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_lessons_user_lesson_idx` ON `user_lessons` (`user_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `user_srs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`interval` integer NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`next_review` integer NOT NULL,
	`repetitions` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_id`) REFERENCES `phrase_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_srs_user_card_idx` ON `user_srs` (`user_id`,`card_id`);--> statement-breakpoint
CREATE INDEX `user_srs_user_next_review_idx` ON `user_srs` (`user_id`,`next_review`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`oauth_provider` text NOT NULL,
	`oauth_id` text NOT NULL,
	`avatar_url` text,
	`level` text NOT NULL,
	`domain` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_oauth_provider_id_idx` ON `users` (`oauth_provider`,`oauth_id`);