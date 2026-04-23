CREATE TABLE gacha_collection (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  tekki_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  first_pulled_at INTEGER NOT NULL,
  UNIQUE(user_id, tekki_id)
);

CREATE INDEX gacha_collection_user_idx ON gacha_collection(user_id);

CREATE TABLE gacha_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  tekki_id TEXT NOT NULL,
  rarity TEXT NOT NULL,
  is_bonus INTEGER NOT NULL DEFAULT 0,
  pulled_at INTEGER NOT NULL
);

CREATE INDEX gacha_history_user_pulled_idx ON gacha_history(user_id, pulled_at DESC);
