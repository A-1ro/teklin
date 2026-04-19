ALTER TABLE `phrase_cards` ADD COLUMN `created_by_user_id` text REFERENCES users(id);

CREATE TABLE `rewrite_history_cards` (
  `id` text PRIMARY KEY NOT NULL,
  `history_id` text NOT NULL REFERENCES ai_rewrite_history(id),
  `card_id` text NOT NULL REFERENCES phrase_cards(id),
  `change_index` integer NOT NULL,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `rewrite_history_cards_history_change_idx`
  ON `rewrite_history_cards` (`history_id`, `change_index`);

CREATE INDEX `rewrite_history_cards_history_idx`
  ON `rewrite_history_cards` (`history_id`);
