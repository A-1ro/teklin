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

/** API health check response */
export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  environment: string;
}
