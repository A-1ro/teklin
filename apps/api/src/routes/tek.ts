import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, tekBalances, tekTransactions } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import { TEK_AMOUNTS } from "../lib/tek";
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

/**
 * Returns yesterday's Teklin day date string (YYYY-MM-DD).
 */
function yesterdayTekDay(): string {
  const today = todayTekDay();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// GET /api/tek — Current tek balance + whether login bonus is available today
// ---------------------------------------------------------------------------
tekRoutes.get("/", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  const row = await db
    .select({
      balance: tekBalances.balance,
      lastLoginBonusAt: tekBalances.lastLoginBonusAt,
      loginBonusStreak: tekBalances.loginBonusStreak,
    })
    .from(tekBalances)
    .where(eq(tekBalances.userId, userId))
    .get();

  const today = todayTekDay();
  return c.json({
    balance: row?.balance ?? 0,
    loginBonusAvailable: row?.lastLoginBonusAt !== today,
    loginBonusStreak: row?.loginBonusStreak ?? 0,
  } satisfies TekBalanceResponse);
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
      loginBonusStreak: tekBalances.loginBonusStreak,
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
      streak: row.loginBonusStreak,
      streakBonus: 0,
    } satisfies TekLoginBonusResponse);
  }

  // Calculate streak: consecutive if last claim was yesterday
  const yesterday = yesterdayTekDay();
  const isConsecutive = row?.lastLoginBonusAt === yesterday;
  const newStreak = isConsecutive ? (row?.loginBonusStreak ?? 0) + 1 : 1;

  // Award streak bonus every 7 consecutive days
  const streakBonus =
    newStreak > 0 && newStreak % 7 === 0
      ? TEK_AMOUNTS.login_bonus_streak
      : 0;

  const earned = TEK_AMOUNTS.login_bonus;
  const totalEarned = earned + streakBonus;
  const now = Date.now();

  let newBalance: number;
  if (row) {
    newBalance = row.balance + totalEarned;
    await db
      .update(tekBalances)
      .set({
        balance: newBalance,
        lastLoginBonusAt: today,
        loginBonusStreak: newStreak,
        updatedAt: now,
      })
      .where(eq(tekBalances.userId, userId));
  } else {
    newBalance = totalEarned;
    await db.insert(tekBalances).values({
      userId,
      balance: newBalance,
      lastLoginBonusAt: today,
      loginBonusStreak: newStreak,
      updatedAt: now,
    });
  }

  // Insert transaction record for base login bonus
  await db.insert(tekTransactions).values({
    id: crypto.randomUUID(),
    userId,
    amount: earned,
    reason: "login_bonus",
    createdAt: now,
  });

  // Insert separate transaction for streak bonus if applicable
  if (streakBonus > 0) {
    await db.insert(tekTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: streakBonus,
      reason: "login_bonus_streak",
      createdAt: now,
    });
  }

  return c.json({
    balance: newBalance,
    earned,
    alreadyClaimed: false,
    streak: newStreak,
    streakBonus,
  } satisfies TekLoginBonusResponse);
});
