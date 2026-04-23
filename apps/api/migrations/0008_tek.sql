-- tek_balances: one row per user, stores current balance and last login bonus date
CREATE TABLE tek_balances (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  balance INTEGER NOT NULL DEFAULT 0,
  -- Teklin day (YYYY-MM-DD) of the last claimed login bonus
  last_login_bonus_at TEXT,
  updated_at INTEGER NOT NULL
);

-- tek_transactions: append-only audit log for every tek award
CREATE TABLE tek_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  -- Positive values only (spending not yet implemented)
  amount INTEGER NOT NULL,
  -- 'login_bonus' | 'lesson_complete' | 'card_review'
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX tek_transactions_user_created_idx ON tek_transactions(user_id, created_at DESC);
