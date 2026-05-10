import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import {
  createDb,
  gachaCollection,
  gachaHistory,
  tekBalances,
  tekTransactions,
} from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import { TEKKI_CATALOG, drawTekki, GACHA_COST } from "../lib/gacha";
import type {
  GachaPullPayload,
  GachaPullResponse,
  GachaCollectionResponse,
  GachaResultItem,
  TekkiId,
} from "@teklin/shared";

export const gachaRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

gachaRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /api/gacha/pull — Pull 1 or 10 (+1 bonus on 10-pull)
// ---------------------------------------------------------------------------
gachaRoutes.post("/pull", async (c) => {
  const { userId } = c.get("user");

  let body: GachaPullPayload;
  try {
    body = await c.req.json<GachaPullPayload>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const pullCount = body.count;
  if (pullCount !== 1 && pullCount !== 10) {
    return c.json({ error: "count must be 1 or 10" }, 400);
  }

  const cost = GACHA_COST[pullCount];
  const db = createDb(c.env.DB);
  const now = Date.now();

  // Check balance
  const balanceRow = await db
    .select({ balance: tekBalances.balance })
    .from(tekBalances)
    .where(eq(tekBalances.userId, userId))
    .get();

  const currentBalance = balanceRow?.balance ?? 0;
  if (currentBalance < cost) {
    return c.json(
      {
        error: "tekが不足しています",
        required: cost,
        current: currentBalance,
      },
      400
    );
  }

  // Draw tekkis (pullCount + 1 bonus if 10-pull)
  const totalDraws = pullCount === 10 ? 11 : 1;
  const draws = Array.from({ length: totalDraws }, (_, i) => ({
    item: drawTekki(),
    isBonus: pullCount === 10 && i === 10,
  }));

  // Check which ones are new for this user
  const existingCollection = await db
    .select({ tekkiId: gachaCollection.tekkiId })
    .from(gachaCollection)
    .where(eq(gachaCollection.userId, userId));

  const ownedIds = new Set(existingCollection.map((r) => r.tekkiId));

  const results: GachaResultItem[] = draws.map(({ item, isBonus }) => ({
    tekkiId: item.id,
    rarity: item.rarity,
    name: item.name,
    nameJa: item.nameJa,
    isNew: !ownedIds.has(item.id),
    isBonus,
  }));

  // Deduct tek
  const newBalance = currentBalance - cost;
  await db
    .update(tekBalances)
    .set({ balance: newBalance, updatedAt: now })
    .where(eq(tekBalances.userId, userId));

  // Insert tek spend transaction (negative amount)
  await db.insert(tekTransactions).values({
    id: crypto.randomUUID(),
    userId,
    amount: -cost,
    reason: "gacha_pull",
    createdAt: now,
  });

  // Update collection counts, insert history, and check for evolutions
  const evolutions: TekkiId[] = [];

  for (const { item, isBonus } of draws) {
    // Insert history record
    await db.insert(gachaHistory).values({
      id: crypto.randomUUID(),
      userId,
      tekkiId: item.id,
      rarity: item.rarity,
      isBonus: isBonus ? 1 : 0,
      pulledAt: now,
    });

    // Upsert collection
    const existing = await db
      .select({
        id: gachaCollection.id,
        count: gachaCollection.count,
        evolved: gachaCollection.evolved,
      })
      .from(gachaCollection)
      .where(
        and(
          eq(gachaCollection.userId, userId),
          eq(gachaCollection.tekkiId, item.id)
        )
      )
      .get();

    if (existing) {
      const newCount = existing.count + 1;
      const shouldEvolve = newCount >= 5 && existing.evolved === 0;

      await db
        .update(gachaCollection)
        .set({
          count: shouldEvolve ? newCount - 4 : newCount,
          ...(shouldEvolve ? { evolved: 1 } : {}),
        })
        .where(eq(gachaCollection.id, existing.id));

      if (shouldEvolve) {
        evolutions.push(item.id);
      }
    } else {
      await db.insert(gachaCollection).values({
        id: crypto.randomUUID(),
        userId,
        tekkiId: item.id,
        count: 1,
        firstPulledAt: now,
      });
      // Prevent duplicate "new" flag for same tekki drawn multiple times in one pull
      ownedIds.add(item.id);
    }
  }

  return c.json({
    results,
    newBalance,
    evolutions,
  } satisfies GachaPullResponse);
});

// ---------------------------------------------------------------------------
// GET /api/gacha/collection — User's collected Tekkis
// ---------------------------------------------------------------------------
gachaRoutes.get("/collection", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  const rows = await db
    .select()
    .from(gachaCollection)
    .where(eq(gachaCollection.userId, userId));

  const catalogMap = new Map(TEKKI_CATALOG.map((t) => [t.id as string, t]));

  const items = rows
    .map((row) => {
      const catalog = catalogMap.get(row.tekkiId);
      if (!catalog) return null;
      return {
        tekkiId: catalog.id,
        rarity: catalog.rarity,
        name: catalog.name,
        nameJa: catalog.nameJa,
        count: row.count,
        evolved: row.evolved === 1,
        firstPulledAt: new Date(row.firstPulledAt).toISOString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return c.json({
    items,
    total: items.length,
  } satisfies GachaCollectionResponse);
});
