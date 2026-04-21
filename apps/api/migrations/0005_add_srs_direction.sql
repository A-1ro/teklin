-- Add direction column to user_srs for EN→JP / JP→EN independent SRS tracking.
-- Existing rows default to 'jp_to_en' (the original and only direction until now).

ALTER TABLE `user_srs` ADD COLUMN `direction` text NOT NULL DEFAULT 'jp_to_en';
--> statement-breakpoint
DROP INDEX IF EXISTS `user_srs_user_card_idx`;
--> statement-breakpoint
CREATE UNIQUE INDEX `user_srs_user_card_dir_idx` ON `user_srs` (`user_id`, `card_id`, `direction`);
--> statement-breakpoint
DROP INDEX IF EXISTS `user_srs_user_next_review_idx`;
--> statement-breakpoint
CREATE INDEX `user_srs_user_next_review_dir_idx` ON `user_srs` (`user_id`, `next_review`, `direction`);
