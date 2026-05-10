import { eq, and, desc, lte, count, avg, sql } from "drizzle-orm";
import type { DrizzleClient } from "../../db";
import {
  userLessons,
  lessons,
  userSrs,
  phraseCards,
  aiRewriteHistory,
  placementResults,
  exerciseScores,
  focusAppearances,
} from "../../db/schema";
import type {
  RewriteContext,
  SkillAxis,
  ExerciseType,
  ExerciseTypePerformance,
  FocusHistory,
  FocusAppearance,
  FocusViewpoint,
} from "@teklin/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-context performance summary */
export interface ContextPerformance {
  context: RewriteContext;
  /** Number of completed lessons in this context */
  lessonCount: number;
  /** Average score (0-100) */
  avgScore: number;
}

/** Summary of SRS card learning state */
export interface SrsSnapshot {
  /** Total cards the user has started learning */
  totalCards: number;
  /** Cards with interval >= 21 days (considered mastered) */
  masteredCards: number;
  /** Cards with ease_factor < 2.0 (struggling) */
  strugglingCards: number;
  /** Cards due for review now */
  overdueCards: number;
  /** Top struggling phrases (up to 5) for prompt inclusion */
  strugglingPhrases: string[];
}

/** Summary of rewrite usage patterns */
export interface RewriteSnapshot {
  /** Total rewrites performed */
  totalRewrites: number;
  /** Rewrites per context */
  contextCounts: Partial<Record<RewriteContext, number>>;
  /** Most recent rewrite contexts (last 5) */
  recentContexts: RewriteContext[];
}

/** Difficulty feedback trend */
export interface FeedbackTrend {
  tooEasy: number;
  justRight: number;
  tooHard: number;
}

/**
 * Complete learner profile — aggregated from all data sources.
 * Passed to the LLM prompt for personalized lesson generation.
 */
export interface LearnerProfile {
  /** Performance breakdown by communication context */
  contextPerformance: ContextPerformance[];
  /** The context with the lowest average score (if any) */
  weakestContext: RewriteContext | null;
  /** The context with the highest average score (if any) */
  strongestContext: RewriteContext | null;
  /** Recent difficulty feedback trend (last 10 lessons) */
  feedbackTrend: FeedbackTrend;
  /** Overall average score across all completed lessons */
  overallAvgScore: number;
  /** SRS card learning snapshot */
  srs: SrsSnapshot;
  /** Rewrite usage snapshot */
  rewrites: RewriteSnapshot;
  /** Skill axes from placement test (static baseline) */
  placementWeaknesses: SkillAxis[];
  /** Number of completed lessons total */
  completedLessonCount: number;
  /** Recent focus phrases (last 10 lessons) to avoid repetition */
  recentFocusPhrases: string[];
  /** Contexts already covered in the last 5 lessons */
  recentContexts: RewriteContext[];
  /** Per-exercise-type performance (from exercise_scores table) */
  exerciseTypePerformance: ExerciseTypePerformance[];
  /** Focus phrase appearance history (from focus_appearances table) */
  focusHistory: FocusHistory[];
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

const MASTERED_INTERVAL = 21;
const STRUGGLING_EF = 2.0;

/**
 * Build a comprehensive learner profile from D1 data.
 * All queries target a single user and are lightweight (indexed).
 */
export async function buildLearnerProfile(
  db: DrizzleClient,
  userId: string
): Promise<LearnerProfile> {
  const now = Date.now();

  // Run independent queries in parallel
  const [
    contextPerfRows,
    recentLessonRows,
    srsStats,
    strugglingCards,
    overdueCount,
    rewriteRows,
    placementRow,
    exerciseTypePerfRows,
    focusAppearanceRows,
  ] = await Promise.all([
    // 1. Context-level performance (all completed lessons)
    db
      .select({
        context: lessons.context,
        lessonCount: count(),
        avgScore: avg(userLessons.score),
      })
      .from(userLessons)
      .innerJoin(lessons, eq(userLessons.lessonId, lessons.id))
      .where(
        and(
          eq(userLessons.userId, userId),
          sql`${userLessons.completedAt} IS NOT NULL`
        )
      )
      .groupBy(lessons.context)
      .all(),

    // 2. Recent lessons (last 10) for feedback trend, recent phrases, recent contexts
    db
      .select({
        score: userLessons.score,
        feedback: userLessons.feedback,
        context: lessons.context,
        contentJson: lessons.contentJson,
      })
      .from(userLessons)
      .innerJoin(lessons, eq(userLessons.lessonId, lessons.id))
      .where(
        and(
          eq(userLessons.userId, userId),
          sql`${userLessons.completedAt} IS NOT NULL`
        )
      )
      .orderBy(desc(userLessons.completedAt))
      .limit(10)
      .all(),

    // 3. SRS aggregate stats
    db
      .select({
        totalCards: count(),
        masteredCards: sql<number>`SUM(CASE WHEN ${userSrs.interval} >= ${MASTERED_INTERVAL} THEN 1 ELSE 0 END)`,
        strugglingCards: sql<number>`SUM(CASE WHEN ${userSrs.easeFactor} < ${STRUGGLING_EF} THEN 1 ELSE 0 END)`,
      })
      .from(userSrs)
      .where(eq(userSrs.userId, userId))
      .get(),

    // 4. Top 5 struggling phrases (lowest ease factor)
    db
      .select({
        phrase: phraseCards.phrase,
        easeFactor: userSrs.easeFactor,
      })
      .from(userSrs)
      .innerJoin(phraseCards, eq(userSrs.cardId, phraseCards.id))
      .where(
        and(
          eq(userSrs.userId, userId),
          sql`${userSrs.easeFactor} < ${STRUGGLING_EF}`
        )
      )
      .orderBy(userSrs.easeFactor)
      .limit(5)
      .all(),

    // 5. Overdue card count
    db
      .select({ value: count() })
      .from(userSrs)
      .where(and(eq(userSrs.userId, userId), lte(userSrs.nextReview, now)))
      .get(),

    // 6. Recent rewrites (last 10) for context distribution
    db
      .select({ context: aiRewriteHistory.context })
      .from(aiRewriteHistory)
      .where(eq(aiRewriteHistory.userId, userId))
      .orderBy(desc(aiRewriteHistory.createdAt))
      .limit(10)
      .all(),

    // 7. Latest placement result
    db
      .select({ weaknesses: placementResults.weaknesses })
      .from(placementResults)
      .where(eq(placementResults.userId, userId))
      .orderBy(desc(placementResults.createdAt))
      .limit(1)
      .get(),

    // 8. Exercise type performance (aggregate scores by type)
    db
      .select({
        exerciseType: exerciseScores.exerciseType,
        attemptCount: count(),
        avgScore: avg(exerciseScores.score),
      })
      .from(exerciseScores)
      .where(eq(exerciseScores.userId, userId))
      .groupBy(exerciseScores.exerciseType)
      .all(),

    // 9. Focus phrase appearance history (last 50, newest first)
    db
      .select({
        phrase: focusAppearances.phraseNormalized,
        context: focusAppearances.context,
        domain: focusAppearances.domain,
        viewpoint: focusAppearances.viewpoint,
        exerciseTypes: focusAppearances.exerciseTypes,
        appearedAt: focusAppearances.appearedAt,
      })
      .from(focusAppearances)
      .where(eq(focusAppearances.userId, userId))
      .orderBy(desc(focusAppearances.appearedAt))
      .limit(50)
      .all(),
  ]);

  // --- Derive context performance ---
  const contextPerformance: ContextPerformance[] = contextPerfRows
    .filter((r) => r.context !== null)
    .map((r) => ({
      context: r.context as RewriteContext,
      lessonCount: r.lessonCount,
      avgScore: Math.round(Number(r.avgScore) || 0),
    }));

  let weakestContext: RewriteContext | null = null;
  let strongestContext: RewriteContext | null = null;
  if (contextPerformance.length > 0) {
    const sorted = [...contextPerformance].sort(
      (a, b) => a.avgScore - b.avgScore
    );
    weakestContext = sorted[0].context;
    strongestContext = sorted[sorted.length - 1].context;
  }

  // --- Derive feedback trend from recent lessons ---
  const feedbackTrend: FeedbackTrend = { tooEasy: 0, justRight: 0, tooHard: 0 };
  for (const row of recentLessonRows) {
    if (row.feedback === "too_easy") feedbackTrend.tooEasy++;
    else if (row.feedback === "just_right") feedbackTrend.justRight++;
    else if (row.feedback === "too_hard") feedbackTrend.tooHard++;
  }

  // --- Overall average score ---
  const overallAvgScore =
    recentLessonRows.length > 0
      ? Math.round(
          recentLessonRows.reduce((s, r) => s + r.score, 0) /
            recentLessonRows.length
        )
      : 0;

  // --- Recent focus phrases ---
  const recentFocusPhrases: string[] = [];
  for (const row of recentLessonRows) {
    try {
      const content = JSON.parse(row.contentJson) as {
        focus?: { phrase?: string };
      };
      if (content.focus?.phrase) {
        recentFocusPhrases.push(content.focus.phrase);
      }
    } catch {
      // ignore
    }
  }

  // --- Recent lesson contexts (last 5) ---
  const recentContexts = recentLessonRows
    .slice(0, 5)
    .map((r) => r.context)
    .filter((c): c is RewriteContext => c !== null);

  // --- SRS snapshot ---
  const srsSnapshot: SrsSnapshot = {
    totalCards: srsStats?.totalCards ?? 0,
    masteredCards: srsStats?.masteredCards ?? 0,
    strugglingCards: srsStats?.strugglingCards ?? 0,
    overdueCards: overdueCount?.value ?? 0,
    strugglingPhrases: strugglingCards.map((c) => c.phrase),
  };

  // --- Rewrite snapshot ---
  const rewriteContextCounts: Partial<Record<RewriteContext, number>> = {};
  const recentRewriteContexts: RewriteContext[] = [];
  for (const row of rewriteRows) {
    const ctx = row.context as RewriteContext;
    rewriteContextCounts[ctx] = (rewriteContextCounts[ctx] ?? 0) + 1;
    if (recentRewriteContexts.length < 5) {
      recentRewriteContexts.push(ctx);
    }
  }

  const rewriteSnapshot: RewriteSnapshot = {
    totalRewrites: rewriteRows.length,
    contextCounts: rewriteContextCounts,
    recentContexts: recentRewriteContexts,
  };

  // --- Placement weaknesses ---
  let placementWeaknesses: SkillAxis[] = [];
  if (placementRow) {
    try {
      placementWeaknesses = JSON.parse(placementRow.weaknesses) as SkillAxis[];
    } catch {
      // ignore
    }
  }

  // --- Completed lesson count ---
  const completedLessonCount = contextPerformance.reduce(
    (sum, c) => sum + c.lessonCount,
    0
  );

  // --- Exercise type performance ---
  const exerciseTypePerformance: ExerciseTypePerformance[] =
    exerciseTypePerfRows.map((r) => ({
      type: r.exerciseType as ExerciseType,
      attemptCount: r.attemptCount,
      avgScore: Math.round(Number(r.avgScore) || 0),
    }));

  // --- Focus history (group by normalized phrase, keep latest 5 appearances each) ---
  const phraseMap = new Map<string, FocusAppearance[]>();
  for (const row of focusAppearanceRows) {
    let types: ExerciseType[] = [];
    try {
      types = JSON.parse(row.exerciseTypes) as ExerciseType[];
    } catch {
      // ignore
    }
    const appearance: FocusAppearance = {
      date: new Date(row.appearedAt).toISOString(),
      context: row.context as RewriteContext,
      domain: row.domain as FocusAppearance["domain"],
      viewpoint: row.viewpoint as FocusViewpoint,
      exerciseTypes: types,
    };
    const existing = phraseMap.get(row.phrase);
    if (existing) {
      existing.push(appearance);
    } else {
      phraseMap.set(row.phrase, [appearance]);
    }
  }

  const focusHistory: FocusHistory[] = [];
  for (const [phrase, appearances] of phraseMap) {
    focusHistory.push({
      phrase,
      appearances: appearances.slice(0, 5),
    });
  }

  return {
    contextPerformance,
    weakestContext,
    strongestContext,
    feedbackTrend,
    overallAvgScore,
    srs: srsSnapshot,
    rewrites: rewriteSnapshot,
    placementWeaknesses,
    completedLessonCount,
    recentFocusPhrases,
    recentContexts,
    exerciseTypePerformance,
    focusHistory,
  };
}
