import { eq, and, gte, lt, count, desc } from "drizzle-orm";
import {
  createDb,
  users,
  userLessons,
  lessons,
  placementResults,
} from "./db";
import { lessonSessionKey, type LessonSessionKvValue } from "./kv";
import { createLLMService } from "./lib/llm";
import { generateLesson } from "./lib/lesson";
import type { Bindings, LessonGenerationMessage } from "./types";

const LESSON_SESSION_TTL = 86400; // 24 hours
const QUEUE_BATCH_SIZE = 100; // Queue.sendBatch limit

/**
 * Get today's date string in YYYY-MM-DD format.
 * A "Teklin day" starts at JST 05:00 (= UTC 20:00 the previous calendar day).
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
 * Start-of-day timestamp for a Teklin date.
 * JST 05:00 = UTC 20:00 of the previous calendar day = UTC midnight minus 4h.
 */
function startOfDayMs(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getTime() - 4 * 3600 * 1000;
}

// ---------------------------------------------------------------------------
// Cron handler — enqueue eligible users
// ---------------------------------------------------------------------------

/**
 * Cron handler (UTC 20:00 / JST 05:00): find users who completed yesterday's
 * lesson and enqueue a generation job for each.
 */
export async function handleScheduled(env: Bindings): Promise<void> {
  const today = todayString();
  const todayDate = new Date(`${today}T00:00:00.000Z`);
  const yesterday = new Date(todayDate.getTime() - 86400000)
    .toISOString()
    .split("T")[0];

  const yesterdayStart = startOfDayMs(yesterday);
  const todayStart = startOfDayMs(today);

  console.log(
    `[cron] Enqueueing lesson generation for ${today}. ` +
      `Completed window: ${new Date(yesterdayStart).toISOString()} – ${new Date(todayStart).toISOString()}`
  );

  const db = createDb(env.DB);

  // Find distinct users who completed a lesson during yesterday's Teklin day
  const completedRows = await db
    .select({ userId: userLessons.userId })
    .from(userLessons)
    .where(
      and(
        gte(userLessons.completedAt, yesterdayStart),
        lt(userLessons.completedAt, todayStart)
      )
    )
    .all();

  const userIds = [...new Set(completedRows.map((r) => r.userId))];
  console.log(
    `[cron] Found ${userIds.length} user(s) who completed yesterday's lesson`
  );

  if (userIds.length === 0) return;

  // Enqueue in chunks of 100 (sendBatch limit)
  for (let i = 0; i < userIds.length; i += QUEUE_BATCH_SIZE) {
    const chunk = userIds.slice(i, i + QUEUE_BATCH_SIZE);
    await env.LESSON_QUEUE.sendBatch(
      chunk.map((userId) => ({ body: { userId, today } }))
    );
  }

  console.log(`[cron] Enqueued ${userIds.length} lesson generation job(s)`);
}

// ---------------------------------------------------------------------------
// Queue consumer — generate lesson for one user
// ---------------------------------------------------------------------------

/**
 * Queue consumer: process lesson generation messages.
 * Each message triggers LLM generation for one user.
 */
export async function handleLessonQueue(
  batch: MessageBatch<LessonGenerationMessage>,
  env: Bindings
): Promise<void> {
  for (const message of batch.messages) {
    const { userId, today } = message.body;

    try {
      // Idempotency: skip if lesson already exists for this day
      const existing = await env.SESSION_KV.get<LessonSessionKvValue>(
        lessonSessionKey(userId, today),
        "json"
      );
      if (existing) {
        message.ack();
        continue;
      }

      const db = createDb(env.DB);

      // Load user profile
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .get();

      if (!user) {
        console.warn(`[queue] User ${userId} not found, skipping`);
        message.ack();
        continue;
      }

      // Count completed lessons for context rotation
      const countResult = await db
        .select({ value: count() })
        .from(userLessons)
        .where(eq(userLessons.userId, userId))
        .get();
      const completedCount = countResult?.value ?? 0;

      // Get weaknesses from latest placement result
      const latestPlacement = await db
        .select()
        .from(placementResults)
        .where(eq(placementResults.userId, userId))
        .orderBy(desc(placementResults.createdAt))
        .limit(1)
        .get();

      const weaknesses = latestPlacement
        ? (JSON.parse(latestPlacement.weaknesses) as string[])
        : [];

      // Generate lesson via LLM
      const llm = createLLMService(env);
      const { content: lessonContent, context: lessonContext } =
        await generateLesson(llm, {
          level: user.level as Parameters<typeof generateLesson>[1]["level"],
          domain: user.domain as Parameters<typeof generateLesson>[1]["domain"],
          weaknesses:
            weaknesses as Parameters<typeof generateLesson>[1]["weaknesses"],
          completedLessonCount: completedCount,
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
        targetWeaknesses: JSON.stringify(weaknesses),
        createdAt: now,
      });

      await db.insert(userLessons).values({
        id: crypto.randomUUID(),
        userId,
        lessonId,
        startedAt: null,
        completedAt: null,
        score: 0,
        feedback: null,
      });

      // Cache session in KV so /api/lessons/today picks it up instantly
      const session: LessonSessionKvValue = {
        lessonId,
        startedAt: null,
        answers: [],
        completedAt: null,
        score: null,
        feedback: null,
      };
      await env.SESSION_KV.put(
        lessonSessionKey(userId, today),
        JSON.stringify(session),
        { expirationTtl: LESSON_SESSION_TTL }
      );

      console.log(`[queue] Generated lesson for user ${userId} (${today})`);
      message.ack();
    } catch (err) {
      console.error(
        `[queue] Failed to generate lesson for user ${userId} (attempt ${message.attempts}):`,
        err
      );
      message.retry();
    }
  }
}
