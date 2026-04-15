import { Hono } from "hono";
import { eq, and, lte, sql, inArray } from "drizzle-orm";
import { createDb, phraseCards, userSrs, users } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import { srsKey, type SrsKvValue } from "../kv";
import { calculateSrs } from "../lib/srs";
import type {
  CardCategory,
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

const VALID_CATEGORIES: CardCategory[] = [
  "commit_messages",
  "pr_comments",
  "code_review",
  "slack_chat",
  "github_issues",
];

function isValidCategory(value: string): value is CardCategory {
  return VALID_CATEGORIES.includes(value as CardCategory);
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
  const now = Date.now();
  const kv = c.env.SRS_KV;
  const kvKey = srsKey(userId);

  // Try KV cache first
  const cached = await kv.get<SrsKvValue>(kvKey, "json");
  const isFresh =
    cached !== null && now - cached.cachedAt < SRS_CACHE_MAX_AGE_MS;

  const db = createDb(c.env.DB);
  let dueCards: PhraseCardWithSrs[];

  if (isFresh && cached !== null) {
    // Cache hit: use cached dueCardIds as the filter
    if (cached.dueCardIds.length === 0) {
      dueCards = [];
    } else {
      const rows = await db
        .select(reviewSelectColumns)
        .from(phraseCards)
        .innerJoin(userSrs, eq(phraseCards.id, userSrs.cardId))
        .where(
          and(
            eq(userSrs.userId, userId),
            inArray(phraseCards.id, cached.dueCardIds)
          )
        );

      dueCards = rows.map(mapRowToCard);
    }
  } else {
    // Cache miss or stale — query D1
    const rows = await db
      .select(reviewSelectColumns)
      .from(phraseCards)
      .innerJoin(userSrs, eq(phraseCards.id, userSrs.cardId))
      .where(
        and(eq(userSrs.userId, userId), lte(userSrs.nextReview, now))
      );

    dueCards = rows.map(mapRowToCard);

    // Refresh KV cache
    const cacheValue: SrsKvValue = {
      dueCardIds: dueCards.map((card) => card.id),
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

  // Query phrase_cards left-joined with user_srs, filtered by category and level
  const rows = await db
    .select({
      id: phraseCards.id,
      phrase: phraseCards.phrase,
      translation: phraseCards.translation,
      context: phraseCards.context,
      domain: phraseCards.domain,
      level: phraseCards.level,
      category: phraseCards.category,
      srsInterval: userSrs.interval,
      srsEaseFactor: userSrs.easeFactor,
      srsNextReview: userSrs.nextReview,
      srsRepetitions: userSrs.repetitions,
    })
    .from(phraseCards)
    .leftJoin(
      userSrs,
      and(eq(phraseCards.id, userSrs.cardId), eq(userSrs.userId, userId))
    )
    .where(
      and(
        eq(phraseCards.category, category),
        sql`${phraseCards.level} IN (${sql.join(
          allowedLevels.map((l) => sql`${l}`),
          sql`, `
        )})`
      )
    );

  const cards: PhraseCardWithSrs[] = rows.map((row) => ({
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
  }));

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

  // Look up current SRS state (null for new card)
  const existing = await db
    .select()
    .from(userSrs)
    .where(and(eq(userSrs.userId, userId), eq(userSrs.cardId, cardId)))
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
      .where(and(eq(userSrs.userId, userId), eq(userSrs.cardId, cardId)));
  } else {
    await db.insert(userSrs).values({
      id: crypto.randomUUID(),
      userId,
      cardId,
      interval: newState.interval,
      easeFactor: newState.easeFactor,
      repetitions: newState.repetitions,
      nextReview: newState.nextReview,
      updatedAt: now,
    });
  }

  // Invalidate SRS KV cache for this user
  await c.env.SRS_KV.delete(srsKey(userId));

  const response: CardAnswerResponse = {
    nextReview: new Date(newState.nextReview).toISOString(),
    interval: newState.interval,
    easeFactor: newState.easeFactor,
    repetitions: newState.repetitions,
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// GET /api/cards/stats — Card statistics per category
// ---------------------------------------------------------------------------
cardRoutes.get("/stats", async (c) => {
  const { userId } = c.get("user");
  const now = Date.now();

  const byCategory: Record<CardCategory, CategoryStats> = {
    commit_messages: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    pr_comments: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    code_review: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    slack_chat: { total: 0, mastered: 0, learning: 0, unseen: 0 },
    github_issues: { total: 0, mastered: 0, learning: 0, unseen: 0 },
  };

  // SQL GROUP BY aggregation per category
  const statsResult = await c.env.DB.prepare(
    `
    SELECT
      pc.category,
      COUNT(*) as total,
      SUM(CASE WHEN us.interval IS NULL THEN 1 ELSE 0 END) as unseen,
      SUM(CASE WHEN us.interval IS NOT NULL AND us.interval < 21 THEN 1 ELSE 0 END) as learning,
      SUM(CASE WHEN us.interval >= 21 THEN 1 ELSE 0 END) as mastered
    FROM phrase_cards pc
    LEFT JOIN user_srs us ON pc.id = us.card_id AND us.user_id = ?
    GROUP BY pc.category
  `
  )
    .bind(userId)
    .all<{
      category: string;
      total: number;
      unseen: number;
      learning: number;
      mastered: number;
    }>();

  const dueResult = await c.env.DB.prepare(
    `
    SELECT COUNT(*) as count FROM user_srs
    WHERE user_id = ? AND next_review <= ?
  `
  )
    .bind(userId, now)
    .first<{ count: number }>();

  let total = 0;
  let totalMastered = 0;
  let totalLearning = 0;
  let totalUnseen = 0;

  for (const row of statsResult.results) {
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

  const dueToday = dueResult?.count ?? 0;

  const response: CardStatsResponse = {
    total,
    mastered: totalMastered,
    learning: totalLearning,
    unseen: totalUnseen,
    dueToday,
    byCategory,
  };
  return c.json(response);
});
