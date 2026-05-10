import { eq, and, gte, lt } from "drizzle-orm";
import { createDb, users, userLessons, lessons, pushSubscriptions } from "./db";
import { lessonSessionKey, type LessonSessionKvValue } from "./kv";
import { createLLMService } from "./lib/llm";
import { generateLesson, buildLearnerProfile } from "./lib/lesson";
import { sendPushNotification } from "./lib/web-push";
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
// Cron dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch cron events to the appropriate handler based on the cron pattern.
 */
export async function handleScheduled(
  cron: string,
  env: Bindings
): Promise<void> {
  switch (cron) {
    case "0 20 * * *":
      // JST 05:00 — pre-generate lessons
      await handleLessonPreGeneration(env);
      break;
    case "0 21 * * *":
      // JST 06:00 — morning notification
      await handleMorningNotification(env);
      break;
    case "0 10 * * *":
      // JST 19:00 — evening reminder (only for users who haven't learned today)
      await handleEveningNotification(env);
      break;
    default:
      console.warn(`[cron] Unknown cron pattern: ${cron}`);
  }
}

// ---------------------------------------------------------------------------
// Lesson pre-generation (existing)
// ---------------------------------------------------------------------------

async function handleLessonPreGeneration(env: Bindings): Promise<void> {
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
// Push notification helpers
// ---------------------------------------------------------------------------

const MORNING_MESSAGES = [
  "今日のレッスンを見てみましょう👀",
  "LET'S GOOOOOOOO🔥",
  "5分だけレッスンしませんか？",
];

async function sendToSubscriptions(
  env: Bindings,
  subscriptions: (typeof pushSubscriptions.$inferSelect)[],
  payload: string
): Promise<void> {
  const db = createDb(env.DB);

  for (const sub of subscriptions) {
    try {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );

      if (result.shouldRemove) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        console.log(
          `[notification] Removed expired subscription for user ${sub.userId}`
        );
      }
    } catch (err) {
      console.error(
        `[notification] Failed to send to user ${sub.userId}:`,
        err
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Morning notification (JST 06:00 — all subscribed users)
// ---------------------------------------------------------------------------

async function handleMorningNotification(env: Bindings): Promise<void> {
  const db = createDb(env.DB);
  const subs = await db.select().from(pushSubscriptions).all();

  if (subs.length === 0) {
    console.log("[notification:morning] No subscriptions, skipping");
    return;
  }

  const message =
    MORNING_MESSAGES[Math.floor(Math.random() * MORNING_MESSAGES.length)];
  const payload = JSON.stringify({
    title: "Teklin",
    body: message,
    url: "/dashboard",
  });

  console.log(
    `[notification:morning] Sending to ${subs.length} subscription(s): "${message}"`
  );
  await sendToSubscriptions(env, subs, payload);
}

// ---------------------------------------------------------------------------
// Evening notification (JST 19:00 — only users who haven't learned today)
// ---------------------------------------------------------------------------

async function handleEveningNotification(env: Bindings): Promise<void> {
  const db = createDb(env.DB);
  const subs = await db.select().from(pushSubscriptions).all();

  if (subs.length === 0) {
    console.log("[notification:evening] No subscriptions, skipping");
    return;
  }

  const today = todayString();
  const dayStart = startOfDayMs(today);
  const now = Date.now();

  // Find users who completed a lesson in the current Teklin day
  const completedRows = await db
    .select({ userId: userLessons.userId })
    .from(userLessons)
    .where(
      and(
        gte(userLessons.completedAt, dayStart),
        lt(userLessons.completedAt, now)
      )
    )
    .all();

  const completedUserIds = new Set(completedRows.map((r) => r.userId));

  // Send only to users who haven't completed today
  const targetSubs = subs.filter((s) => !completedUserIds.has(s.userId));

  if (targetSubs.length === 0) {
    console.log(
      "[notification:evening] All subscribed users completed today's lesson"
    );
    return;
  }

  const payload = JSON.stringify({
    title: "Teklin",
    body: "お仕事お疲れ様です！🍵5分だけレッスンしてみませんか？",
    url: "/dashboard",
  });

  console.log(
    `[notification:evening] Sending to ${targetSubs.length} user(s) who haven't learned today`
  );
  await sendToSubscriptions(env, targetSubs, payload);
}

// ---------------------------------------------------------------------------
// Queue consumer — generate lesson for one user (unchanged)
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

      // Build learner profile for personalized generation
      const profile = await buildLearnerProfile(db, userId);

      // Generate lesson via LLM
      const llm = createLLMService(env);
      const { content: lessonContent, context: lessonContext } =
        await generateLesson(llm, {
          level: user.level as Parameters<typeof generateLesson>[1]["level"],
          domain: user.domain as Parameters<typeof generateLesson>[1]["domain"],
          weaknesses: profile.placementWeaknesses as Parameters<
            typeof generateLesson
          >[1]["weaknesses"],
          completedLessonCount: profile.completedLessonCount,
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
