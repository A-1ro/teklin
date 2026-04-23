import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

// @teklin/shared types (referenced as comments; SQLite has no enum type):
//   Level       = "L1" | "L2" | "L3" | "L4"
//   Domain      = "web" | "infra" | "ml" | "mobile"
//   SkillAxis   = "reading" | "writing" | "vocabulary" | "nuance"
//   RewriteContext = "commit_message" | "pr_comment" | "github_issue" | "slack" | "general"
//   CardCategory = "commit_messages" | "pr_comments" | "code_review" | "slack_chat" | "github_issues"

/**
 * users
 * Stores OAuth-authenticated user accounts.
 * level: Level, domain: Domain
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    oauthProvider: text("oauth_provider").notNull(),
    oauthId: text("oauth_id").notNull(),
    avatarUrl: text("avatar_url"),
    // Level: "L1" | "L2" | "L3" | "L4"
    level: text("level").notNull(),
    // Domain: "web" | "infra" | "ml" | "mobile"
    domain: text("domain").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("users_oauth_provider_id_idx").on(
      table.oauthProvider,
      table.oauthId
    ),
  ]
);

/**
 * placement_results
 * Stores the result of the initial placement test per user.
 * level: Level, weaknesses: JSON array of SkillAxis
 */
export const placementResults = sqliteTable(
  "placement_results",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    readingScore: integer("reading_score").notNull(),
    writingScore: integer("writing_score").notNull(),
    vocabularyScore: integer("vocabulary_score").notNull(),
    nuanceScore: integer("nuance_score").notNull(),
    // Level: "L1" | "L2" | "L3" | "L4"
    level: text("level").notNull(),
    // JSON string: SkillAxis[] e.g. '["reading","writing"]'
    weaknesses: text("weaknesses").notNull(),
    // JSON string: PlacementAnswerRecord[] — stored for answer review
    answers: text("answers"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("placement_results_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
);

/**
 * lessons
 * Content units for learning. content_json holds the full lesson payload.
 * domain: Domain, level: Level, type: lesson type string
 */
export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  // Domain: "web" | "infra" | "ml" | "mobile"
  domain: text("domain").notNull(),
  // Level: "L1" | "L2" | "L3" | "L4"
  level: text("level").notNull(),
  // JSON string containing lesson content
  contentJson: text("content_json").notNull(),
  // LessonType: "vocabulary" | "rewrite" | "reading" | "listening"
  type: text("type").notNull(),
  // RewriteContext: "commit_message" | "pr_comment" | "github_issue" | "slack" | "general"
  context: text("context"),
  // JSON string: SkillAxis[] e.g. '["reading","writing"]'
  targetWeaknesses: text("target_weaknesses"),
  createdAt: integer("created_at").notNull(),
});

/**
 * user_lessons
 * Tracks lesson completion per user.
 */
export const userLessons = sqliteTable(
  "user_lessons",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    startedAt: integer("started_at"),
    completedAt: integer("completed_at"),
    score: integer("score").notNull(),
    feedback: text("feedback"),
  },
  (table) => [
    uniqueIndex("user_lessons_user_lesson_idx").on(
      table.userId,
      table.lessonId
    ),
  ]
);

/**
 * phrase_cards
 * Flashcard-style phrase entries used in SRS.
 * domain: Domain, level: Level, category: CardCategory
 */
export const phraseCards = sqliteTable("phrase_cards", {
  id: text("id").primaryKey(),
  phrase: text("phrase").notNull(),
  translation: text("translation").notNull(),
  context: text("context").notNull(),
  createdByUserId: text("created_by_user_id").references(() => users.id),
  // Domain: "web" | "infra" | "ml" | "mobile"
  domain: text("domain").notNull(),
  // Level: "L1" | "L2" | "L3" | "L4"
  level: text("level").notNull(),
  // CardCategory: "commit_messages" | "pr_comments" | "code_review" | "slack_chat" | "github_issues"
  category: text("category").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const rewriteHistoryCards = sqliteTable(
  "rewrite_history_cards",
  {
    id: text("id").primaryKey(),
    historyId: text("history_id")
      .notNull()
      .references(() => aiRewriteHistory.id),
    cardId: text("card_id")
      .notNull()
      .references(() => phraseCards.id),
    changeIndex: integer("change_index").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("rewrite_history_cards_history_change_idx").on(
      table.historyId,
      table.changeIndex
    ),
    index("rewrite_history_cards_history_idx").on(table.historyId),
  ]
);

/**
 * user_srs
 * Spaced-repetition state per user per phrase card (SM-2 algorithm).
 * ease_factor: default 2.5, next_review / updated_at: Unix epoch ms
 */
export const userSrs = sqliteTable(
  "user_srs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    cardId: text("card_id")
      .notNull()
      .references(() => phraseCards.id),
    // CardDirection: "jp_to_en" | "en_to_jp"
    direction: text("direction").notNull().default("jp_to_en"),
    interval: integer("interval").notNull(),
    // SM-2 ease factor, default 2.5
    easeFactor: real("ease_factor").notNull().default(2.5),
    nextReview: integer("next_review").notNull(),
    repetitions: integer("repetitions").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("user_srs_user_card_dir_idx").on(
      table.userId,
      table.cardId,
      table.direction
    ),
    index("user_srs_user_next_review_dir_idx").on(
      table.userId,
      table.nextReview,
      table.direction
    ),
  ]
);

/**
 * ai_rewrite_history
 * Log of AI-powered rewrite requests.
 * context: RewriteContext
 */
export const aiRewriteHistory = sqliteTable("ai_rewrite_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  originalText: text("original_text").notNull(),
  rewrittenText: text("rewritten_text").notNull(),
  explanation: text("explanation").notNull(),
  // RewriteContext: "commit_message" | "pr_comment" | "github_issue" | "slack" | "general"
  context: text("context").notNull(),
  createdAt: integer("created_at").notNull(),
});

/**
 * push_subscriptions
 * Web Push API subscriptions for push notifications.
 */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint),
    index("push_subscriptions_user_id_idx").on(table.userId),
  ]
);

/**
 * exercise_scores
 * Per-exercise-type score records for adaptive lesson composition.
 * exerciseType: ExerciseType = "fill_in_blank" | "reorder" | "free_text" | "error_correction" | "paraphrase"
 */
export const exerciseScores = sqliteTable(
  "exercise_scores",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    exerciseType: text("exercise_type").notNull(),
    score: integer("score").notNull(),
    answeredAt: integer("answered_at").notNull(),
  },
  (table) => [
    index("exercise_scores_user_type_idx").on(
      table.userId,
      table.exerciseType
    ),
    index("exercise_scores_user_answered_idx").on(
      table.userId,
      table.answeredAt
    ),
  ]
);

/**
 * streaks
 * Daily learning streak per user (one row per user).
 * last_learned_at: Unix epoch ms of the most recent learning session
 */
export const streaks = sqliteTable("streaks", {
  userId: text("user_id").primaryKey().references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastLearnedAt: integer("last_learned_at"),
});
