-- Add phrase_normalized column to track normalized phrases for grouping
-- phrase_normalized is populated at runtime by normalizePhrase() when recording new appearances
-- Note: ASCII quotes ("/'/`) are already removed by sanitizePhrase() in PR #64.
-- Curly/CJK quotes ("/"/'/'/「/」/『/』) are NOT removed here (TS normalizePhrase removes them).
-- For existing rows containing curly/CJK quotes, the backfilled phrase_normalized may
-- differ from what runtime normalizePhrase() would produce. New INSERTs use TS normalizePhrase().
-- If full alignment is required, a separate one-off script can re-normalize affected rows.

ALTER TABLE focus_appearances ADD COLUMN phrase_normalized TEXT;

-- Backfill existing rows with normalized values
-- Applies: trim, trailing punctuation removal (. ! ? 。 ！ ？), lowercase
UPDATE focus_appearances
SET phrase_normalized = lower(
  trim(
    rtrim(trim(phrase), '.!?。！？')
  )
)
WHERE phrase_normalized IS NULL;
