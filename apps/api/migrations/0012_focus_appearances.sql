CREATE TABLE focus_appearances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  phrase TEXT NOT NULL,
  context TEXT NOT NULL,
  domain TEXT NOT NULL,
  viewpoint TEXT NOT NULL,
  exercise_types TEXT NOT NULL,
  appeared_at INTEGER NOT NULL
);

CREATE INDEX focus_appearances_user_phrase_idx ON focus_appearances(user_id, phrase, appeared_at DESC);
CREATE INDEX focus_appearances_user_appeared_idx ON focus_appearances(user_id, appeared_at DESC);
CREATE UNIQUE INDEX focus_appearances_user_lesson_uidx ON focus_appearances(user_id, lesson_id);

-- Backfill from existing completed user_lessons joined with lessons.
-- INSERT OR IGNORE provides idempotency in case this migration is ever re-applied
-- manually (wrangler tracks applied migrations, so re-runs are not expected).
--
-- The phrase is sanitized in SQL to mirror sanitizePhrase() in lesson/appearances.ts:
-- newlines / tabs / quote chars are replaced with spaces, and the result is
-- truncated to 200 chars. Without this, legacy rows would bypass the runtime
-- sanitization and could carry prompt-injection payloads into the LLM via
-- formatProfileForPrompt().
INSERT OR IGNORE INTO focus_appearances
SELECT
  lower(hex(randomblob(16))) AS id,
  ul.user_id,
  ul.lesson_id,
  substr(
    trim(
      replace(replace(replace(replace(replace(replace(
        json_extract(l.content_json, '$.focus.phrase'),
        char(10), ' '),
        char(13), ' '),
        char(9),  ' '),
        '"',      ' '),
        '''',     ' '),
        '`',      ' ')
    ),
    1, 200
  ) AS phrase,
  l.context,
  l.domain,
  CASE l.context WHEN 'pr_comment' THEN 'reviewer' ELSE 'writer' END AS viewpoint,
  (
    SELECT json_group_array(json_extract(value, '$.type'))
    FROM json_each(l.content_json, '$.practice.exercises')
  ) AS exercise_types,
  ul.completed_at AS appeared_at
FROM user_lessons ul
JOIN lessons l ON ul.lesson_id = l.id
WHERE ul.completed_at IS NOT NULL
  AND l.context IS NOT NULL
  AND json_extract(l.content_json, '$.focus.phrase') IS NOT NULL;
