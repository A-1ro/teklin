import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, tekBalances, tekTransactions } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import { getTekBalance, TEK_AMOUNTS } from "../lib/tek";
import type {
  TekBalanceResponse,
  TekLoginBonusResponse,
} from "@teklin/shared";

export const tekRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

tekRoutes.use("*", authMiddleware);

/**
 * Returns the "Teklin day" date string (YYYY-MM-DD).
 * A Teklin day starts at JST 05:00 = UTC 20:00 the previous calendar day.
 */
function todayTekDay(): string {
  const now = new Date();
  if (now.getUTCHours() >= 20) {
    const next = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    return next.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// GET /api/tek — Current tek balance
// ---------------------------------------------------------------------------
tekRoutes.get("/", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);
  const balance = await getTekBalance(db, userId);
  return c.json({ balance } satisfies TekBalanceResponse);
});

// ---------------------------------------------------------------------------
// POST /api/tek/login-bonus — Claim daily login bonus (idempotent)
// ---------------------------------------------------------------------------
tekRoutes.post("/login-bonus", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);
  const today = todayTekDay();

  const row = await db
    .select({
      balance: tekBalances.balance,
      lastLoginBonusAt: tekBalances.lastLoginBonusAt,
    })
    .from(tekBalances)
    .where(eq(tekBalances.userId, userId))
    .get();

  // Already claimed today
  if (row?.lastLoginBonusAt === today) {
    return c.json({
      balance: row.balance,
      earned: 0,
      alreadyClaimed: true,
    } satisfies TekLoginBonusResponse);
  }

  const earned = TEK_AMOUNTS.login_bonus;
  const now = Date.now();

  let newBalance: number;
  if (row) {
    newBalance = row.balance + earned;
    await db
      .update(tekBalances)
      .set({ balance: newBalance, lastLoginBonusAt: today, updatedAt: now })
      .where(eq(tekBalances.userId, userId));
  } else {
    newBalance = earned;
    await db.insert(tekBalances).values({
      userId,
      balance: newBalance,
      lastLoginBonusAt: today,
      updatedAt: now,
    });
  }

  // Insert transaction record
  await db.insert(tekTransactions).values({
    id: crypto.randomUUID(),
    userId,
    amount: earned,
    reason: "login_bonus",
    createdAt: now,
  });

  return c.json({
    balance: newBalance,
    earned,
    alreadyClaimed: false,
  } satisfies TekLoginBonusResponse);
});
