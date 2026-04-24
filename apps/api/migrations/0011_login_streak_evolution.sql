-- Add login bonus streak tracking
ALTER TABLE tek_balances ADD COLUMN login_bonus_streak INTEGER NOT NULL DEFAULT 0;

-- Add evolution flag to gacha collection
ALTER TABLE gacha_collection ADD COLUMN evolved INTEGER NOT NULL DEFAULT 0;
