import { Hono } from "hono";
import { eq, and, lte, sql, inArray, count, or, isNull } from "drizzle-orm";
import { createDb, phraseCards, userSrs, users } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import { srsKey, newCardsKey, type SrsKvValue, type NewCardsKvValue } from "../kv";
import { calculateSrs } from "../lib/srs";
import { awardTek } from "../lib/tek";
import type {
  CardCategory,
  CardDirection,
  CardAnswerPayload,
  PhraseCardWithSrs,
  ReviewCardsResponse,
  DeckCardsResponse,
  CardAnswerResponse,
  CardStatsResponse,
  CategoryStats,
  Domain,
  Level,
} from "@teklin/shared";

const SRS_CACHE_TTL = 3600; // 1 hour in seconds
const SRS_CACHE_MAX_AGE_MS = 3600 * 1000; // 1 hour in ms
const NEW_CARDS_PER_DAY = 10;
const NEW_CARDS_KV_TTL = 48 * 60 * 60; // 48 hours in seconds

const VALID_CATEGORIES: CardCategory[] = [
  "commit_messages",
  "pr_comments",
  "code_review",
  "slack_chat",
  "github_issues",
];

const LEVEL_ORDER: Record<string, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

/**
 * Get today's date key in YYYY-MM-DD format.
 * A "Teklin day" starts at JST 05:00 (= UTC 20:00 the previous calendar day).
 */
function todayUtc(): string {
  const now = new Date();
  if (now.getUTCHours() >= 20) {
    const next = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    return next.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}

const VALID_DIRECTIONS: CardDirection[] = ["jp_to_en", "en_to_jp"];

function isValidCategory(value: string): value is CardCategory {
  return VALID_CATEGORIES.includes(value as CardCategory);
}

function parseDirection(value: string | undefined): CardDirection {
  if (value && VALID_DIRECTIONS.includes(value as CardDirection)) {
    return value as CardDirection;
  }
  return "jp_to_en";
}

function getAllowedLevels(userLevel: string): string[] {
  const userLevelNum = LEVEL_ORDER[userLevel] ?? 1;

  return Object.entries(LEVEL_ORDER)
    .filter(([, num]) => num <= userLevelNum)
    .map(([lvl]) => lvl);
}

// Shared select columns for review queries
const reviewSelectColumns = {
  id: phraseCards.id,
  phrase: phraseCards.phrase,
  translation: phraseCards.translation,
  context: phraseCards.context,
  domain: phraseCards.domain,
  level: phraseCards.level,
  category: phraseCards.category,
  srsDirection: userSrs.direction,
  srsInterval: userSrs.interval,
  srsEaseFactor: userSrs.easeFactor,
  srsNextReview: userSrs.nextReview,
  srsRepetitions: userSrs.repetitions,
};

// Helper to map DB rows to PhraseCardWithSrs
function mapRowToCard(row: {
  id: string;
  phrase: string;
  translation: string;
  context: string;
  domain: string;
  level: string;
  category: string;
  srsDirection: string | null;
  srsInterval: number | null;
  srsEaseFactor: number | null;
  srsNextReview: number | null;
  srsRepetitions: number | null;
}): PhraseCardWithSrs {
  return {
    id: row.id,
    phrase: row.phrase,
    translation: row.translation,
    context: row.context,
    domain: row.domain as Domain,
    level: row.level as Level,
    category: row.category as CardCategory,
    srs:
      row.srsInterval !== null &&
      row.srsEaseFactor !== null &&
      row.srsNextReview !== null &&
      row.srsRepetitions !== null
        ? {
            interval: row.srsInterval,
            easeFactor: row.srsEaseFactor,
            nextReview: new Date(row.srsNextReview).toISOString(),
            repetitions: row.srsRepetitions,
          }
        : null,
  };
}

function cardVisibilityCondition(userId: string) {
  return or(
    isNull(phraseCards.createdByUserId),
    eq(phraseCards.createdByUserId, userId)
  );
}

export const cardRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

cardRoutes.use("/*", authMiddleware);

// ---------------------------------------------------------------------------
// GET /api/cards/review — Due cards for SRS review
// ---------------------------------------------------------------------------
cardRoutes.get("/review", async (c) => {
  const { userId } = c.get("user");
  const direction = parseDirection(c.req.query("direction"));
  const now = Date.now();
  const kv = c.env.SRS_KV;
  const kvKey = srsKey(userId, direction);
  const db = createDb(c.env.DB);

  const user = await db
    .select({ level: users.level })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const allowedLevels = getAllowedLevels(user.level);

  // Check how many new cards the user has already started today (per direction)
  const today = todayUtc();
  const ncKey = newCardsKey(userId, today, direction);
  const ncValue = await kv.get<NewCardsKvValue>(ncKey, "json");
  const newCardsStartedToday = ncValue?.count ?? 0;
  const newCardsRemaining = Math.max(0, NEW_CARDS_PER_DAY - newCardsStartedToday);

  // Try KV cache first
  const cached = await kv.get<SrsKvValue>(kvKey, "json");
  const isFresh =
    cached !== null && now - cached.cachedAt < SRS_CACHE_MAX_AGE_MS;

  let dueCards: PhraseCardWithSrs[];

  // Unseen = no user_srs row for this (userId, cardId, direction) combo
  const unseenRows = newCardsRemaining > 0
    ? await db
        .select(reviewSelectColumns)
        .from(phraseCards)
        .leftJoin(
          userSrs,
          and(
            eq(phraseCards.id, userSrs.cardId),
            eq(userSrs.userId, userId),
            eq(userSrs.direction, direction)
          )
        )
        .where(
          and(
            sql`${userSrs.cardId} IS NULL`,
            cardVisibilityCondition(userId),
            sql`${phraseCards.level} IN (${sql.join(
              allowedLevels.map((l) => sql`${l}`),
              sql`, `
            )})`
          )
        )
        .limit(newCardsRemaining)
    : [];

  if (isFresh && cached !== null) {
    // Cache hit: use cached dueCardIds as the filter
    if (cached.dueCardIds.length === 0) {
      dueCards = unseenRows.map(mapRowToCard);
    } else {
      const rows = await db
        .select(reviewSelectColumns)
        .from(phraseCards)
        .innerJoin(userSrs, eq(phraseCards.id, userSrs.cardId))
        .where(
          and(
            eq(userSrs.userId, userId),
            eq(userSrs.direction, direction),
            inArray(phraseCards.id, cached.dueCardIds),
            cardVisibilityCondition(userId),
            sql`${phraseCards.level} IN (${sql.join(
              allowedLevels.map((l) => sql`${l}`),
              sql`, `
            )})`
          )
        );

      dueCards = [...rows, ...unseenRows].map(mapRowToCard);
    }
  } else {
    // Cache miss or stale — query due cards plus unseen cards at or below the user's level
    const dueRows = await db
      .select(reviewSelectColumns)
      .from(phraseCards)
      .innerJoin(userSrs, eq(phraseCards.id, userSrs.cardId))
      .where(
        and(
          eq(userSrs.userId, userId),
          eq(userSrs.direction, direction),
          lte(userSrs.nextReview, now),
          cardVisibilityCondition(userId),
          sql`${phraseCards.level} IN (${sql.join(
            allowedLevels.map((l) => sql`${l}`),
            sql`, `
          )})`
        )
      );

    dueCards = [...dueRows, ...unseenRows].map(mapRowToCard);

    // Refresh KV cache
    const cacheValue: SrsKvValue = {
      dueCardIds: dueRows.map((card) => card.id),
      cachedAt: now,
    };
    await kv.put(kvKey, JSON.stringify(cacheValue), {
      expirationTtl: SRS_CACHE_TTL,
    });
  }

  const response: ReviewCardsResponse = {
    cards: dueCards,
    totalDue: dueCards.length,
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// GET /api/cards/deck/:category — All cards for a category
// ---------------------------------------------------------------------------
cardRoutes.get("/deck/:category", async (c) => {
  const { userId } = c.get("user");
  const rawCategory = c.req.param("category");

  if (!isValidCategory(rawCategory)) {
    return c.json(
      {
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      },
      400
    );
  }
  const category = rawCategory;

  const db = createDb(c.env.DB);

  // Get user's level to filter cards
  const user = await db
    .select({ level: users.level })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Level ordering: L1 < L2 < L3 < L4
  const levelOrder: Record<string, number> = {
    L1: 1,
    L2: 2,
    L3: 3,
    L4: 4,
  };
  const userLevelNum = levelOrder[user.level] ?? 1;

  // Get levels at or below the user's level
  const allowedLevels = Object.entries(levelOrder)
    .filter(([, num]) => num <= userLevelNum)
    .map(([lvl]) => lvl);

  const direction = parseDirection(c.req.query("direction"));

  // Query phrase_cards left-joined with user_srs, filtered by category, level, and direction
  const rows = await db
    .select(reviewSelectColumns)
    .from(phraseCards)
    .leftJoin(
      userSrs,
      and(
        eq(phraseCards.id, userSrs.cardId),
        eq(userSrs.userId, userId),
        eq(userSrs.direction, direction)
      )
    )
    .where(
      and(
        eq(phraseCards.category, category),
        cardVisibilityCondition(userId),
        sql`${phraseCards.level} IN (${sql.join(
          allowedLevels.map((l) => sql`${l}`),
          sql`, `
        )})`
      )
    );

  const cards: PhraseCardWithSrs[] = rows.map(mapRowToCard);

  const response: DeckCardsResponse = {
    cards,
    category,
    total: cards.length,
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// POST /api/cards/:id/answer — Submit a card rating
// ---------------------------------------------------------------------------
cardRoutes.post("/:id/answer", async (c) => {
  const { userId } = c.get("user");
  const cardId = c.req.param("id");

  if (!cardId) {
    return c.json({ error: "Card ID is required" }, 400);
  }

  let body: CardAnswerPayload;
  try {
    body = await c.req.json<CardAnswerPayload>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { rating } = body;
  const direction = parseDirection(body.direction);
  const validRatings = ["again", "hard", "good", "easy"];
  if (!rating || !validRatings.includes(rating)) {
    return c.json(
      { error: "rating must be one of: again, hard, good, easy" },
      400
    );
  }

  const db = createDb(c.env.DB);

  // Check card exists
  const card = await db
    .select({ id: phraseCards.id })
    .from(phraseCards)
    .where(eq(phraseCards.id, cardId))
    .get();

  if (!card) {
    return c.json({ error: "Card not found" }, 404);
  }

  // Look up current SRS state for this direction (null for new card)
  const existing = await db
    .select()
    .from(userSrs)
    .where(
      and(
        eq(userSrs.userId, userId),
        eq(userSrs.cardId, cardId),
        eq(userSrs.direction, direction)
      )
    )
    .get();

  const currentState = existing
    ? {
        interval: existing.interval,
        easeFactor: existing.easeFactor,
        repetitions: existing.repetitions,
        nextReview: existing.nextReview,
      }
    : null;

  const newState = calculateSrs(currentState, rating);
  const now = Date.now();

  if (existing) {
    await db
      .update(userSrs)
      .set({
        interval: newState.interval,
        easeFactor: newState.easeFactor,
        repetitions: newState.repetitions,
        nextReview: newState.nextReview,
        updatedAt: now,
      })
      .where(
        and(
          eq(userSrs.userId, userId),
          eq(userSrs.cardId, cardId),
          eq(userSrs.direction, direction)
        )
      );
  } else {
    await db.insert(userSrs).values({
      id: crypto.randomUUID(),
      userId,
      cardId,
      direction,
      interval: newState.interval,
      easeFactor: newState.easeFactor,
      repetitions: newState.repetitions,
      nextReview: newState.nextReview,
      updatedAt: now,
    });

    // Increment daily new card counter (per direction)
    const today = todayUtc();
    const ncKey = newCardsKey(userId, today, direction);
    const ncValue = await c.env.SRS_KV.get<NewCardsKvValue>(ncKey, "json");
    const newCount = (ncValue?.count ?? 0) + 1;
    await c.env.SRS_KV.put(
      ncKey,
      JSON.stringify({ count: newCount, updatedAt: new Date().toISOString() }),
      { expirationTtl: NEW_CARDS_KV_TTL }
    );
  }

  // Invalidate SRS KV cache for this user + direction
  await c.env.SRS_KV.delete(srsKey(userId, direction));

  // Award tek for card review
  let tekBalance: number | undefined;
  try {
    tekBalance = await awardTek(db, userId, "card_review");
  } catch {
    // Tek award failure must not block card review submission
  }

  const response: CardAnswerResponse = {
    nextReview: new Date(newState.nextReview).toISOString(),
    interval: newState.interval,
    easeFactor: newState.easeFactor,
    repetitions: newState.repetitions,
    ...(tekBalance !== undefined
      ? { tek: { balance: tekBalance, earned: 20 } }
      : {}),
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// PUT /api/cards/:id — Update a phrase card
// ---------------------------------------------------------------------------
cardRoutes.put("/:id", async (c) => {
  const { userId } = c.get("user");
  const cardId = c.req.param("id");

  let body: { phrase: string; translation: string };
  try {
    body = await c.req.json<{ phrase: string; translation: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.phrase || !body.translation) {
    return c.json({ error: "phrase and translation are required" }, 400);
  }

  const db = createDb(c.env.DB);
  const existing = await db
    .select({ id: phraseCards.id })
    .from(phraseCards)
    .where(and(eq(phraseCards.id, cardId), eq(phraseCards.createdByUserId, userId)))
    .get();

  if (!existing) {
    return c.json({ error: "Card not found" }, 404);
  }

  await db
    .update(phraseCards)
    .set({
      phrase: body.phrase,
      translation: body.translation,
    })
    .where(eq(phraseCards.id, cardId));

  return c.json({ id: cardId, phrase: body.phrase, translation: body.translation });
});

// ---------------------------------------------------------------------------
// GET /api/cards/stats — Card statistics per category
// ---------------------------------------------------------------------------
cardRoutes.get("/stats", async (c) => {
  const { userId } = c.get("user");
  const now = Date.now();
  const db = createDb(c.env.DB);

  const user = await db
    .select({ level: users.level })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const allowedLevels = getAllowedLevels(user.level);

  const byCategory: Record<CardCategory, CategoryStats> = {
    commit_messages: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    pr_comments: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    code_review: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    slack_chat: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    github_issues: { total: 0, mastered: 0, learning: 0, unseen: 0 },
  };

  // Drizzle GROUP BY aggregation per category (uses jp_to_en direction for overall stats)
  const statsRows = await db
    .select({
      category: phraseCards.category,
      total: count(),
      unseen:
        sql<number>`SUM(CASE WHEN ${userSrs.interval} IS NULL THEN 1 ELSE 0 END)`,
      learning:
        sql<number>`SUM(CASE WHEN ${userSrs.interval} IS NOT NULL AND ${userSrs.interval} < 21 THEN 1 ELSE 0 END)`,
      mastered:
        sql<number>`SUM(CASE WHEN ${userSrs.interval} >= 21 THEN 1 ELSE 0 END)`,
    })
    .from(phraseCards)
    .leftJoin(
      userSrs,
      and(
        eq(phraseCards.id, userSrs.cardId),
        eq(userSrs.userId, userId),
        eq(userSrs.direction, "jp_to_en")
      )
    )
    .where(cardVisibilityCondition(userId))
    .groupBy(phraseCards.category);

  // Helper: count due + unseen cards for a given direction
  async function countDueForDirection(dir: string): Promise<number> {
    const dueRow = await db
      .select({ value: count() })
      .from(userSrs)
      .innerJoin(phraseCards, eq(userSrs.cardId, phraseCards.id))
      .where(
        and(
          eq(userSrs.userId, userId),
          eq(userSrs.direction, dir),
          lte(userSrs.nextReview, now),
          cardVisibilityCondition(userId),
          sql`${phraseCards.level} IN (${sql.join(
            allowedLevels.map((l) => sql`${l}`),
            sql`, `
          )})`
        )
      )
      .get();

    const unseenRow = await db
      .select({ value: count() })
      .from(phraseCards)
      .leftJoin(
        userSrs,
        and(
          eq(phraseCards.id, userSrs.cardId),
          eq(userSrs.userId, userId),
          eq(userSrs.direction, dir)
        )
      )
      .where(
        and(
          sql`${userSrs.cardId} IS NULL`,
          cardVisibilityCondition(userId),
          sql`${phraseCards.level} IN (${sql.join(
            allowedLevels.map((l) => sql`${l}`),
            sql`, `
          )})`
        )
      )
      .get();

    return (dueRow?.value ?? 0) + (unseenRow?.value ?? 0);
  }

  const [dueTodayJpToEn, dueTodayEnToJp] = await Promise.all([
    countDueForDirection("jp_to_en"),
    countDueForDirection("en_to_jp"),
  ]);

  let total = 0;
  let totalMastered = 0;
  let totalLearning = 0;
  let totalUnseen = 0;

  for (const row of statsRows) {
    const cat = row.category as CardCategory;
    if (!(cat in byCategory)) continue;

    byCategory[cat].total = row.total;
    byCategory[cat].unseen = row.unseen;
    byCategory[cat].learning = row.learning;
    byCategory[cat].mastered = row.mastered;

    total += row.total;
    totalMastered += row.mastered;
    totalLearning += row.learning;
    totalUnseen += row.unseen;
  }

  const response: CardStatsResponse = {
    total,
    mastered: totalMastered,
    learning: totalLearning,
    unseen: totalUnseen,
    dueToday: dueTodayJpToEn + dueTodayEnToJp,
    dueTodayJpToEn,
    dueTodayEnToJp,
    byCategory,
  };
  return c.json(response);
});
