// KV namespace key schema and type definitions for Teklin.
import type { SkillAxis } from "@teklin/shared";
//
// Bindings:
//   SESSION_KV  — user session data + placement test sessions
//   SRS_KV      — cached SRS card state per user
//   STREAK_KV   — streak counters per user

// ---------------------------------------------------------------------------
// Key patterns
// ---------------------------------------------------------------------------

/**
 * SESSION_KV keys: `session:{sessionId}`
 * Stores authenticated session payloads.
 */
export type SessionKvKey = `session:${string}`;

/**
 * SRS_KV keys: `srs:{userId}`
 * Stores a snapshot of the user's SRS due-card IDs for fast reads.
 */
export type SrsKvKey = `srs:${string}`;

/**
 * STREAK_KV keys: `streak:{userId}`
 * Stores the user's current streak state for fast reads without D1 queries.
 */
export type StreakKvKey = `streak:${string}`;

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

/** Value stored under SESSION_KV `session:{sessionId}` */
export interface SessionKvValue {
  userId: string;
  email: string;
  name: string;
  /** Unix epoch ms */
  expiresAt: number;
}

/** Value stored under SRS_KV `srs:{userId}` */
export interface SrsKvValue {
  /** List of phrase_card IDs due for review */
  dueCardIds: string[];
  /** Unix epoch ms when this cache was last refreshed */
  cachedAt: number;
}

/** Value stored under STREAK_KV `streak:{userId}` */
export interface StreakKvValue {
  currentStreak: number;
  longestStreak: number;
  /** Unix epoch ms of the most recent learning session, or null if never */
  lastLearnedAt: number | null;
}

// ---------------------------------------------------------------------------
// Key builder helpers
// ---------------------------------------------------------------------------

export function sessionKey(sessionId: string): SessionKvKey {
  return `session:${sessionId}`;
}

export function srsKey(userId: string): SrsKvKey {
  return `srs:${userId}`;
}

export function streakKey(userId: string): StreakKvKey {
  return `streak:${userId}`;
}

// ---------------------------------------------------------------------------
// USAGE_KV — token usage tracking per user per day
// ---------------------------------------------------------------------------

/**
 * USAGE_KV keys: `usage:{userId}:{YYYY-MM-DD}`
 * Stores daily LLM token consumption per user.
 */
export type UsageKvKey = `usage:${string}:${string}`;

/** Value stored under USAGE_KV `usage:{userId}:{YYYY-MM-DD}` */
export interface UsageKvValue {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

export function usageKey(userId: string, date: string): UsageKvKey {
  return `usage:${userId}:${date}`;
}

// ---------------------------------------------------------------------------
// PLACEMENT SESSION — test progress tracking
// ---------------------------------------------------------------------------

export type PlacementSessionKvKey = `placement:${string}`;

export interface PlacementAnswerRecord {
  questionId: string;
  answer: string;
  axis: SkillAxis;
  difficulty: 1 | 2 | 3;
  score: number;
  answeredAt: number;
}

export interface PlacementSessionKvValue {
  userId: string;
  questionOrder: string[];
  answers: PlacementAnswerRecord[];
  currentIndex: number;
  startedAt: number;
  status: "in_progress" | "completed";
}

export function placementSessionKey(userId: string): PlacementSessionKvKey {
  return `placement:${userId}`;
}
