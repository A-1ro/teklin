CREATE TABLE exercise_scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  exercise_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  answered_at INTEGER NOT NULL
);

CREATE INDEX exercise_scores_user_type_idx ON exercise_scores(user_id, exercise_type);
CREATE INDEX exercise_scores_user_answered_idx ON exercise_scores(user_id, answered_at);
