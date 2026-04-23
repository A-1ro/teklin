import { Hono } from "hono";
import { eq, and, desc, count, not, isNull } from "drizzle-orm";
import {
  createDb,
  lessons,
  userLessons,
  streaks,
  users,
  phraseCards,
  exerciseScores,
} from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import {
  lessonSessionKey,
  streakKey,
  srsKey,
  type LessonSessionKvValue,
  type LessonAnswerRecord,
  type StreakKvValue,
} from "../kv";
import { createLLMService } from "../lib/llm";
import {
  generateLesson,
  buildLearnerProfile,
  scoreMultipleChoice,
  scoreFillInBlank,
  scoreReorder,
  scoreFreeTextWithFeedback,
  scoreErrorCorrection,
  scoreParaphraseWithFeedback,
} from "../lib/lesson";
import type {
  LessonContent,
  LessonContentInternal,
  LessonHistoryItem,
  LessonHistoryResponse,
  LessonFocusPhrase,
  CardCategory,
  RewriteContext,
  AddLessonPhraseCardResponse,
} from "@teklin/shared";

const LESSON_SESSION_TTL = 86400; // 24 hours

/** Strip answer fields before sending lesson content to the client */
function toClientContent(internal: LessonContentInternal): LessonContent {
  return {
    warmup: {
      questions: internal.warmup.questions.map((q) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctChoiceId: _c, ...rest } = q;
        return rest;
      }),
    },
    focus: internal.focus,
    practice: {
      exercises: internal.practice.exercises.map((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctAnswer: _ca, acceptableAnswers: _aa, ...rest } = e;
        return rest;
      }),
    },
    wrapup: internal.wrapup,
  };
}

/**
 * Get today's date string in YYYY-MM-DD format.
 * A "Teklin day" starts at JST 05:00 (= UTC 20:00 the previous calendar day).
 * If the current UTC hour is >= 20, we are already in the next JST day.
 */
function todayString(): string {
  const now = new Date();
  if (now.getUTCHours() >= 20) {
    const next = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    return next.toISOString().split("T")[0];
  }
  return now.toISOString().split("T")[0];
}

/**
 * Get the start-of-day timestamp for a given Teklin date string.
 * Each Teklin day starts at JST 05:00 = UTC 20:00 of the previous calendar day,
 * which is 4 hours before UTC midnight of the given date.
 */
function startOfDayMs(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getTime() - 4 * 3600 * 1000;
}

export const lessonRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// All lesson routes require auth
lessonRoutes.use("/*", authMiddleware);

// ---------------------------------------------------------------------------
// GET /api/lessons/today — Get today's lesson (generate if needed)
// ---------------------------------------------------------------------------
lessonRoutes.get("/today", async (c) => {
  const { userId } = c.get("user");
  const today = todayString();
  const kv = c.env.SESSION_KV;
  const sessionKvKey = lessonSessionKey(userId, today);

  // Check KV for existing session
  const existing = await kv.get<LessonSessionKvValue>(sessionKvKey, "json");

  // Retrieve streak info
  const streakKvKey = streakKey(userId);
  let streakData = await c.env.STREAK_KV.get<StreakKvValue>(
    streakKvKey,
    "json"
  );
  if (!streakData) {
    streakData = { currentStreak: 0, longestStreak: 0, lastLearnedAt: null };
  }

  const streakInfo = {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
  };

  // If session exists in KV, try to load the lesson from D1
  if (existing) {
    const db = createDb(c.env.DB);
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, existing.lessonId))
      .get();

    if (lesson) {
      const content = JSON.parse(lesson.contentJson) as LessonContentInternal;

      // Detect corrupted warmup (choices missing, empty, or malformed)
      const hasValidChoices = content.warmup.questions.every(
        (q) =>
          Array.isArray(q.choices) &&
          q.choices.length > 0 &&
          q.choices.every(
            (ch) =>
              typeof ch === "object" &&
              ch !== null &&
              typeof ch.id === "string" &&
              typeof ch.text === "string"
          )
      );
      if (hasValidChoices) {
        const isCompleted =
          existing.completedAt !== null && existing.completedAt !== undefined;
        return c.json({
          lesson: {
            id: lesson.id,
            domain: lesson.domain,
            level: lesson.level,
            type: lesson.type,
            content: toClientContent(content),
            createdAt: new Date(lesson.createdAt).toISOString(),
          },
          streak: streakInfo,
          isCompleted,
        });
      }

      // Warmup choices are corrupted — discard KV session and re-generate
      await kv.delete(sessionKvKey);
    } else {
      // KV session is orphaned (D1 record missing) — clean up before generating
      await kv.delete(sessionKvKey);
    }
  }

  // Generate a new lesson
  const db = createDb(c.env.DB);

  // Get user profile for level and domain
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Build learner profile (aggregates all learning data in parallel)
  const profile = await buildLearnerProfile(db, userId);

  // Get nextPreview from the most recent completed lesson
  const lastUserLesson = await db
    .select({ lessonId: userLessons.lessonId })
    .from(userLessons)
    .where(eq(userLessons.userId, userId))
    .orderBy(desc(userLessons.completedAt))
    .limit(1)
    .get();

  let previousNextPreview: string | undefined;
  if (lastUserLesson) {
    const lastLesson = await db
      .select({ contentJson: lessons.contentJson })
      .from(lessons)
      .where(eq(lessons.id, lastUserLesson.lessonId))
      .get();
    if (lastLesson) {
      try {
        const parsed = JSON.parse(lastLesson.contentJson) as {
          wrapup?: { nextPreview?: string };
        };
        previousNextPreview = parsed.wrapup?.nextPreview;
      } catch {
        // ignore parse errors
      }
    }
  }

  const llm = createLLMService(c.env);
  const { content: lessonContent, context: lessonContext } =
    await generateLesson(llm, {
      level: user.level as Parameters<typeof generateLesson>[1]["level"],
      domain: user.domain as Parameters<typeof generateLesson>[1]["domain"],
      weaknesses: profile.placementWeaknesses as Parameters<
        typeof generateLesson
      >[1]["weaknesses"],
      completedLessonCount: profile.completedLessonCount,
      previousNextPreview,
      profile,
    });

  // Persist lesson to D1
  const lessonId = crypto.randomUUID();
  const now = Date.now();

  await db.insert(lessons).values({
    id: lessonId,
    domain: user.domain,
    level: user.level,
    contentJson: JSON.stringify(lessonContent),
    type: "rewrite",
    context: lessonContext,
    targetWeaknesses: JSON.stringify(profile.placementWeaknesses),
    createdAt: now,
  });

  // Create user_lessons record
  await db.insert(userLessons).values({
    id: crypto.randomUUID(),
    userId,
    lessonId,
    startedAt: null,
    completedAt: null,
    score: 0,
    feedback: null,
  });

  // Cache session in KV
  const session: LessonSessionKvValue = {
    lessonId,
    startedAt: null,
    answers: [],
    completedAt: null,
    score: null,
    feedback: null,
  };
  await kv.put(sessionKvKey, JSON.stringify(session), {
    expirationTtl: LESSON_SESSION_TTL,
  });

  return c.json({
    lesson: {
      id: lessonId,
      domain: user.domain,
      level: user.level,
      type: "rewrite",
      content: toClientContent(lessonContent),
      createdAt: new Date(now).toISOString(),
    },
    streak: streakInfo,
    isCompleted: false,
  });
});

// ---------------------------------------------------------------------------
// GET /api/lessons/history — Paginated list of completed lessons
// ---------------------------------------------------------------------------
lessonRoutes.get("/history", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  const url = new URL(c.req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const rows = await db
    .select({
      id: userLessons.id,
      lessonId: userLessons.lessonId,
      score: userLessons.score,
      feedback: userLessons.feedback,
      completedAt: userLessons.completedAt,
      domain: lessons.domain,
      level: lessons.level,
      context: lessons.context,
      contentJson: lessons.contentJson,
    })
    .from(userLessons)
    .innerJoin(lessons, eq(userLessons.lessonId, lessons.id))
    .where(
      and(eq(userLessons.userId, userId), not(isNull(userLessons.completedAt)))
    )
    .orderBy(desc(userLessons.completedAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ value: count() })
    .from(userLessons)
    .where(
      and(eq(userLessons.userId, userId), not(isNull(userLessons.completedAt)))
    )
    .get();

  const items: LessonHistoryItem[] = rows.map((row) => {
    let focusPhrase = "";
    try {
      const content = JSON.parse(row.contentJson) as LessonContentInternal;
      focusPhrase = content.focus.phrase;
    } catch {
      // ignore parse errors
    }

    return {
      id: row.id,
      lessonId: row.lessonId,
      domain: row.domain as LessonHistoryItem["domain"],
      level: row.level as LessonHistoryItem["level"],
      score: row.score,
      feedback: (row.feedback as LessonHistoryItem["feedback"]) ?? null,
      focusPhrase,
      context: (row.context as LessonHistoryItem["context"]) ?? null,
      completedAt: new Date(row.completedAt!).toISOString(),
    };
  });

  const response: LessonHistoryResponse = {
    items,
    total: totalResult?.value ?? 0,
  };

  return c.json(response);
});

// ---------------------------------------------------------------------------
// GET /api/lessons/:id — Get a specific lesson by ID
// ---------------------------------------------------------------------------
lessonRoutes.get("/:id", async (c) => {
  const { userId } = c.get("user");
  const lessonId = c.req.param("id");
  const db = createDb(c.env.DB);

  const lesson = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .get();

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  // Verify the user has access to this lesson
  const userLesson = await db
    .select()
    .from(userLessons)
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId))
    )
    .get();

  if (!userLesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const content = JSON.parse(lesson.contentJson) as LessonContentInternal;

  return c.json({
    id: lesson.id,
    domain: lesson.domain,
    level: lesson.level,
    type: lesson.type,
    content: toClientContent(content),
    createdAt: new Date(lesson.createdAt).toISOString(),
  });
});

// ---------------------------------------------------------------------------
// POST /api/lessons/:id/start — Record lesson start time
// ---------------------------------------------------------------------------
lessonRoutes.post("/:id/start", async (c) => {
  const { userId } = c.get("user");
  const lessonId = c.req.param("id");
  const today = todayString();
  const kv = c.env.SESSION_KV;
  const sessionKvKey = lessonSessionKey(userId, today);

  const session = await kv.get<LessonSessionKvValue>(sessionKvKey, "json");
  if (!session || session.lessonId !== lessonId) {
    return c.json({ error: "Lesson session not found" }, 404);
  }

  const now = Date.now();
  session.startedAt = now;

  await kv.put(sessionKvKey, JSON.stringify(session), {
    expirationTtl: LESSON_SESSION_TTL,
  });

  // Update startedAt in user_lessons
  const db = createDb(c.env.DB);
  await db
    .update(userLessons)
    .set({ startedAt: now })
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId))
    );

  return c.json({
    lessonId,
    startedAt: new Date(now).toISOString(),
  });
});

// ---------------------------------------------------------------------------
// POST /api/lessons/:id/answer — Score an answer
// ---------------------------------------------------------------------------
lessonRoutes.post("/:id/answer", async (c) => {
  const { userId } = c.get("user");
  const lessonId = c.req.param("id");
  const today = todayString();
  const kv = c.env.SESSION_KV;
  const sessionKvKey = lessonSessionKey(userId, today);
  const db = createDb(c.env.DB);

  const session = await kv.get<LessonSessionKvValue>(sessionKvKey, "json");
  const hasActiveSession = session?.lessonId === lessonId;

  const userLesson = await db
    .select()
    .from(userLessons)
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId))
    )
    .get();

  if (!userLesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  // Review mode should keep working even if the short-lived KV session expired.
  const isReview =
    userLesson.completedAt !== null ||
    (hasActiveSession && session.completedAt !== null);

  if (!hasActiveSession && !isReview) {
    return c.json({ error: "Lesson session not found" }, 404);
  }

  let body: { step?: string; exerciseId?: string; answer?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { step, exerciseId, answer } = body;
  if (
    typeof step !== "string" ||
    typeof exerciseId !== "string" ||
    typeof answer !== "string" ||
    answer.length === 0
  ) {
    return c.json({ error: "step, exerciseId, and answer are required" }, 400);
  }

  if (answer.length > 2000) {
    return c.json({ error: "Answer must be 2000 characters or fewer" }, 400);
  }

  // Prevent duplicate answers only in normal (non-review) mode
  if (!isReview && hasActiveSession) {
    const alreadyAnswered = session.answers.find(
      (a) => a.exerciseId === exerciseId && a.step === step
    );
    if (alreadyAnswered) {
      return c.json({ error: "Already answered this exercise" }, 400);
    }
  }

  // Load lesson content from D1
  const lesson = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .get();

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const content = JSON.parse(lesson.contentJson) as LessonContentInternal;

  let correct = false;
  let score = 0;
  let correctAnswer: string | undefined;
  let feedback: string | undefined;

  if (step === "warmup") {
    const question = content.warmup.questions.find((q) => q.id === exerciseId);
    if (!question) {
      return c.json({ error: "Exercise not found" }, 404);
    }
    score = scoreMultipleChoice(question, answer);
    correct = score === 100;
    if (!correct) {
      correctAnswer = question.correctChoiceId;
    }
  } else if (step === "practice") {
    const exercise = content.practice.exercises.find(
      (e) => e.id === exerciseId
    );
    if (!exercise) {
      return c.json({ error: "Exercise not found" }, 404);
    }

    if (exercise.type === "fill_in_blank") {
      score = scoreFillInBlank(exercise, answer);
      correct = score === 100;
      if (!correct && exercise.correctAnswer) {
        correctAnswer = exercise.correctAnswer;
      }
    } else if (exercise.type === "reorder") {
      score = scoreReorder(exercise, answer);
      correct = score === 100;
      if (!correct && exercise.correctAnswer) {
        correctAnswer = exercise.correctAnswer;
      }
    } else if (exercise.type === "error_correction") {
      score = scoreErrorCorrection(exercise, answer);
      correct = score === 100;
      if (!correct && exercise.correctAnswer) {
        correctAnswer = exercise.correctAnswer;
      }
    } else if (exercise.type === "free_text") {
      const llm = createLLMService(c.env);
      const result = await scoreFreeTextWithFeedback(exercise, answer, llm);
      score = result.score;
      correct = score >= 70;
      feedback = result.feedback || undefined;
    } else if (exercise.type === "paraphrase") {
      const llm = createLLMService(c.env);
      const result = await scoreParaphraseWithFeedback(exercise, answer, llm);
      score = result.score;
      correct = score >= 70;
      feedback = result.feedback || undefined;
    }
  } else {
    return c.json({ error: "Invalid step. Must be warmup or practice" }, 400);
  }

  // In review mode, skip recording the answer to avoid mutating completed sessions
  if (!isReview && hasActiveSession) {
    const now = Date.now();
    const answerRecord: LessonAnswerRecord = {
      step,
      exerciseId,
      answer,
      correct,
      score,
      answeredAt: now,
    };
    session.answers.push(answerRecord);

    await kv.put(sessionKvKey, JSON.stringify(session), {
      expirationTtl: LESSON_SESSION_TTL,
    });

    // Record exercise-type score for adaptive lesson planning (practice only)
    if (step === "practice") {
      const exercise = content.practice.exercises.find(
        (e) => e.id === exerciseId
      );
      if (exercise) {
        await db.insert(exerciseScores).values({
          id: crypto.randomUUID(),
          userId,
          lessonId,
          exerciseType: exercise.type,
          score,
          answeredAt: now,
        });
      }
    }
  }

  return c.json({
    correct,
    score,
    ...(correctAnswer !== undefined ? { correctAnswer } : {}),
    ...(feedback !== undefined ? { feedback } : {}),
  });
});

// ---------------------------------------------------------------------------
// POST /api/lessons/:id/complete — Mark lesson as complete
// ---------------------------------------------------------------------------
lessonRoutes.post("/:id/complete", async (c) => {
  const { userId } = c.get("user");
  const lessonId = c.req.param("id");
  const today = todayString();
  const kv = c.env.SESSION_KV;
  const sessionKvKey = lessonSessionKey(userId, today);

  const session = await kv.get<LessonSessionKvValue>(sessionKvKey, "json");
  if (!session || session.lessonId !== lessonId) {
    return c.json({ error: "Lesson session not found" }, 404);
  }

  if (session.completedAt !== null) {
    return c.json({ error: "Lesson already completed" }, 400);
  }

  // Calculate average score
  const answeredExercises = session.answers;
  const avgScore =
    answeredExercises.length > 0
      ? Math.round(
          answeredExercises.reduce((sum, a) => sum + a.score, 0) /
            answeredExercises.length
        )
      : 0;

  const now = Date.now();
  session.completedAt = now;
  session.score = avgScore;

  await kv.put(sessionKvKey, JSON.stringify(session), {
    expirationTtl: LESSON_SESSION_TTL,
  });

  // Update user_lessons in D1
  const db = createDb(c.env.DB);
  await db
    .update(userLessons)
    .set({ completedAt: now, score: avgScore })
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId))
    );

  // Update streak
  const streakKvKey = streakKey(userId);
  let streakData = await c.env.STREAK_KV.get<StreakKvValue>(
    streakKvKey,
    "json"
  );
  if (!streakData) {
    streakData = { currentStreak: 0, longestStreak: 0, lastLearnedAt: null };
  }

  const todayStart = startOfDayMs(today);
  const yesterdayStart = todayStart - 86400000;

  let isNewRecord = false;
  const prevLongest = streakData.longestStreak;

  if (
    streakData.lastLearnedAt !== null &&
    streakData.lastLearnedAt >= todayStart
  ) {
    // Already updated today — no change
  } else if (
    streakData.lastLearnedAt !== null &&
    streakData.lastLearnedAt >= yesterdayStart
  ) {
    // Continued streak from yesterday
    streakData.currentStreak += 1;
  } else {
    // Streak broken or first lesson
    streakData.currentStreak = 1;
  }

  streakData.lastLearnedAt = now;
  if (streakData.currentStreak > streakData.longestStreak) {
    streakData.longestStreak = streakData.currentStreak;
    isNewRecord = streakData.longestStreak > prevLongest;
  }

  // Persist streak to KV
  await c.env.STREAK_KV.put(streakKvKey, JSON.stringify(streakData));

  // Persist streak to D1
  const existingStreak = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .get();

  if (existingStreak) {
    await db
      .update(streaks)
      .set({
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastLearnedAt: now,
      })
      .where(eq(streaks.userId, userId));
  } else {
    await db.insert(streaks).values({
      userId,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastLearnedAt: now,
    });
  }

  // Extract focus phrase from lesson content
  let focusPhrase: LessonFocusPhrase | null = null;
  try {
    const lessonRow = await db
      .select({ contentJson: lessons.contentJson })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .get();
    if (lessonRow) {
      const content = JSON.parse(
        lessonRow.contentJson
      ) as LessonContentInternal;
      focusPhrase = {
        phrase: content.focus.phrase,
        explanation: content.focus.explanation,
        examples: content.focus.examples.map((e) => ({
          english: e.english,
          japanese: e.japanese,
        })),
      };
    }
  } catch {
    // ignore parse errors — focusPhrase stays null
  }

  return c.json({
    score: avgScore,
    streak: {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      isNewRecord,
    },
    completedAt: new Date(now).toISOString(),
    focusPhrase,
  });
});

// ---------------------------------------------------------------------------
// POST /api/lessons/:id/add-to-cards — Add focus phrase to phrase cards
// ---------------------------------------------------------------------------

const CONTEXT_TO_CATEGORY: Record<RewriteContext, CardCategory> = {
  commit_message: "commit_messages",
  pr_comment: "pr_comments",
  github_issue: "github_issues",
  slack: "slack_chat",
  general: "slack_chat",
};

lessonRoutes.post("/:id/add-to-cards", async (c) => {
  const { userId } = c.get("user");
  const lessonId = c.req.param("id");
  const db = createDb(c.env.DB);

  // Verify the user completed this lesson
  const userLesson = await db
    .select()
    .from(userLessons)
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId))
    )
    .get();

  if (!userLesson || userLesson.completedAt === null) {
    return c.json({ error: "Lesson not found or not completed" }, 404);
  }

  // Get lesson content
  const lessonRow = await db
    .select({
      contentJson: lessons.contentJson,
      context: lessons.context,
      domain: lessons.domain,
      level: lessons.level,
    })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .get();

  if (!lessonRow) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  let content: LessonContentInternal;
  try {
    content = JSON.parse(lessonRow.contentJson) as LessonContentInternal;
  } catch {
    return c.json({ error: "Failed to parse lesson content" }, 500);
  }

  const phrase = content.focus.phrase;
  const translation = content.focus.explanation;

  // Check if user already has a card with this exact phrase
  const existing = await db
    .select({ id: phraseCards.id })
    .from(phraseCards)
    .where(
      and(
        eq(phraseCards.phrase, phrase),
        eq(phraseCards.createdByUserId, userId)
      )
    )
    .get();

  if (existing) {
    return c.json({ error: "This phrase is already in your cards" }, 409);
  }

  const context =
    (lessonRow.context as RewriteContext | null) ?? "general";
  const category = CONTEXT_TO_CATEGORY[context];
  const cardId = crypto.randomUUID();
  const now = Date.now();

  await db.insert(phraseCards).values({
    id: cardId,
    phrase,
    translation,
    context: content.focus.examples[0]?.english ?? phrase,
    createdByUserId: userId,
    domain: lessonRow.domain,
    level: lessonRow.level,
    category,
    createdAt: now,
  });

  // Invalidate SRS cache so the new card appears in reviews
  await Promise.all([
    c.env.SRS_KV.delete(srsKey(userId, "jp_to_en")),
    c.env.SRS_KV.delete(srsKey(userId, "en_to_jp")),
  ]);

  const response: AddLessonPhraseCardResponse = {
    cardId,
    phrase,
    translation,
  };
  return c.json(response, 201);
});

// ---------------------------------------------------------------------------
// POST /api/lessons/:id/feedback — Record difficulty feedback
// ---------------------------------------------------------------------------
lessonRoutes.post("/:id/feedback", async (c) => {
  const { userId } = c.get("user");
  const lessonId = c.req.param("id");
  const today = todayString();
  const kv = c.env.SESSION_KV;
  const sessionKvKey = lessonSessionKey(userId, today);

  const session = await kv.get<LessonSessionKvValue>(sessionKvKey, "json");
  if (!session || session.lessonId !== lessonId) {
    return c.json({ error: "Lesson session not found" }, 404);
  }

  if (session.completedAt === null || session.completedAt === undefined) {
    return c.json({ error: "Lesson not yet completed" }, 400);
  }

  let body: { difficulty?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { difficulty } = body;
  const validFeedback = ["too_easy", "just_right", "too_hard"];
  if (!difficulty || !validFeedback.includes(difficulty)) {
    return c.json(
      { error: "difficulty must be too_easy, just_right, or too_hard" },
      400
    );
  }

  session.feedback = difficulty;
  await kv.put(sessionKvKey, JSON.stringify(session), {
    expirationTtl: LESSON_SESSION_TTL,
  });

  // Also persist feedback to D1 user_lessons
  const db = createDb(c.env.DB);
  await db
    .update(userLessons)
    .set({ feedback: difficulty })
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId))
    );

  return c.json({ recorded: true });
});
