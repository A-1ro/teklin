// Shared types and utilities for Teklin

/** User proficiency levels */
export type Level = "L1" | "L2" | "L3" | "L4";

/** Learning domains */
export type Domain = "web" | "infra" | "ml" | "mobile";

/** Skill axes measured in the placement test */
export type SkillAxis = "reading" | "writing" | "vocabulary" | "nuance";

/** Lesson context types for AI Rewrite */
export type RewriteContext =
  | "commit_message"
  | "pr_comment"
  | "github_issue"
  | "slack"
  | "general";

/** SRS answer quality (SM-2 algorithm) */
export type SrsQuality = 0 | 1 | 2 | 3 | 4 | 5;

/** Phrase card categories */
export type CardCategory =
  | "commit_messages"
  | "pr_comments"
  | "code_review"
  | "slack_chat"
  | "github_issues";

/** Lesson content types */
export type LessonType = "vocabulary" | "rewrite" | "reading" | "listening";

/** Difficulty feedback from the user */
export type DifficultyFeedback = "too_easy" | "just_right" | "too_hard";

/** Exercise types within a lesson */
export type ExerciseType = "fill_in_blank" | "reorder" | "free_text";

// ---------------------------------------------------------------------------
// Lesson types
// ---------------------------------------------------------------------------

/** A single warm-up review quiz question */
export interface WarmupQuestion {
  id: string;
  phrase: string;
  translation: string;
  context: string;
  type: "multiple_choice";
  choices: { id: string; text: string }[];
  correctChoiceId: string;
}

/** Today's focus content — a phrase/pattern to learn */
export interface FocusContent {
  phrase: string;
  explanation: string;
  examples: { english: string; japanese: string; context: RewriteContext }[];
  tips: string[];
}

/** A practice exercise */
export interface Exercise {
  id: string;
  type: ExerciseType;
  instruction: string;
  /** For fill_in_blank: sentence with ___ blank */
  sentence?: string;
  /** For reorder: shuffled words */
  words?: string[];
  /** For free_text: the prompt/scenario */
  prompt?: string;
  /** Correct answer (for fill_in_blank and reorder) */
  correctAnswer?: string;
  /** Acceptable answers (for fill_in_blank, multiple valid options) */
  acceptableAnswers?: string[];
}

/** Wrap-up summary content */
export interface WrapupContent {
  summary: string;
  keyPoints: string[];
  nextPreview: string;
}

/** Full lesson content stored as JSON in D1 */
export interface LessonContent {
  warmup: { questions: Omit<WarmupQuestion, "correctChoiceId">[] };
  focus: FocusContent;
  practice: { exercises: Omit<Exercise, "correctAnswer" | "acceptableAnswers">[] };
  wrapup: WrapupContent;
}

/** Internal lesson content with answers (server-side only) */
export interface LessonContentInternal {
  warmup: { questions: WarmupQuestion[] };
  focus: FocusContent;
  practice: { exercises: Exercise[] };
  wrapup: WrapupContent;
}

/** Lesson step identifiers */
export type LessonStep = "warmup" | "focus" | "practice" | "wrapup";

// ---------------------------------------------------------------------------
// Lesson API types
// ---------------------------------------------------------------------------

/** Response from GET /api/lessons/today */
export interface TodayLessonResponse {
  lesson: {
    id: string;
    domain: Domain;
    level: Level;
    type: LessonType;
    content: LessonContent;
    createdAt: string;
  } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
  isCompleted: boolean;
}

/** Response from POST /api/lessons/:id/start */
export interface LessonStartResponse {
  lessonId: string;
  startedAt: string;
}

/** Request body for POST /api/lessons/:id/answer */
export interface LessonAnswerPayload {
  step: LessonStep;
  exerciseId: string;
  answer: string;
}

/** Response from POST /api/lessons/:id/answer */
export interface LessonAnswerResponse {
  correct: boolean;
  score: number;
  correctAnswer?: string;
  feedback?: string;
}

/** Response from POST /api/lessons/:id/complete */
export interface LessonCompleteResponse {
  score: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    isNewRecord: boolean;
  };
  completedAt: string;
}

/** Request body for POST /api/lessons/:id/feedback */
export interface LessonFeedbackPayload {
  difficulty: DifficultyFeedback;
}

/** Response from POST /api/lessons/:id/feedback */
export interface LessonFeedbackResponse {
  recorded: boolean;
}

// ---------------------------------------------------------------------------
// Card / SRS API types
// ---------------------------------------------------------------------------

/** UI-facing card rating (maps to SM-2 quality internally) */
export type CardRating = "again" | "hard" | "good" | "easy";

/** Phrase card with optional SRS state */
export interface PhraseCardWithSrs {
  id: string;
  phrase: string;
  translation: string;
  context: string;
  domain: Domain;
  level: Level;
  category: CardCategory;
  srs: {
    interval: number;
    easeFactor: number;
    nextReview: string;
    repetitions: number;
  } | null;
}

/** Response from GET /api/cards/review */
export interface ReviewCardsResponse {
  cards: PhraseCardWithSrs[];
  totalDue: number;
}

/** Response from GET /api/cards/deck/:category */
export interface DeckCardsResponse {
  cards: PhraseCardWithSrs[];
  category: CardCategory;
  total: number;
}

/** Request body for POST /api/cards/:id/answer */
export interface CardAnswerPayload {
  rating: CardRating;
}

/** Response from POST /api/cards/:id/answer */
export interface CardAnswerResponse {
  nextReview: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

/** Per-category stats */
export interface CategoryStats {
  total: number;
  mastered: number;
  learning: number;
  unseen: number;
}

/** Response from GET /api/cards/stats */
export interface CardStatsResponse {
  total: number;
  mastered: number;
  learning: number;
  unseen: number;
  dueToday: number;
  byCategory: Record<CardCategory, CategoryStats>;
}

/** API health check response */
export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  environment: string;
}

/** OAuth providers supported by Teklin */
export type OAuthProvider = "github" | "google";

/** Authenticated user info returned from /api/me */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  oauthProvider: OAuthProvider;
  level: Level;
  domain: Domain;
}

/** Auth token response */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** LLM provider identifiers */
export type LLMProvider = "workers-ai" | "openai" | "anthropic";

/** LLM task types for routing decisions */
export type LLMTaskType = "lightweight" | "quality";

// ---------------------------------------------------------------------------
// Placement test types
// ---------------------------------------------------------------------------

/** Placement question types */
export type PlacementQuestionType = "multiple_choice" | "free_text";

/** A single placement test question */
export interface PlacementQuestion {
  id: string;
  axis: SkillAxis;
  difficulty: 1 | 2 | 3;
  type: PlacementQuestionType;
  prompt: string;
  context?: string;
  choices?: { id: string; text: string }[];
}

/** Client-facing question (no correct answer) */
export type PlacementQuestionClient = PlacementQuestion;

/** Answer submitted by the user */
export interface PlacementAnswerPayload {
  questionId: string;
  answer: string;
}

/** Result of the placement test */
export interface PlacementResultResponse {
  level: Level;
  scores: Record<SkillAxis, number>;
  weaknesses: SkillAxis[];
  totalQuestions: number;
  completedAt: string;
}

/** Response from start/answer endpoints */
export interface PlacementNextResponse {
  question: PlacementQuestionClient | null;
  progress: { current: number; total: number };
  isComplete: boolean;
}
