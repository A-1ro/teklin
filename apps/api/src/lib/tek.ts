import { eq } from "drizzle-orm";
import type { DrizzleClient } from "../db";
import { tekBalances, tekTransactions } from "../db";
import type { TekReason } from "@teklin/shared";

export const TEK_AMOUNTS: Record<TekReason, number> = {
  login_bonus: 10,
  lesson_complete: 30,
  card_review: 20,
};

/**
 * Awards tek to a user and returns the new balance.
 * Inserts a transaction record and upserts the balance row.
 */
export async function awardTek(
  db: DrizzleClient,
  userId: string,
  reason: TekReason
): Promise<number> {
  const amount = TEK_AMOUNTS[reason];
  const now = Date.now();

  await db.insert(tekTransactions).values({
    id: crypto.randomUUID(),
    userId,
    amount,
    reason,
    createdAt: now,
  });

  const existing = await db
    .select({ balance: tekBalances.balance })
    .from(tekBalances)
    .where(eq(tekBalances.userId, userId))
    .get();

  if (existing) {
    const newBalance = existing.balance + amount;
    await db
      .update(tekBalances)
      .set({ balance: newBalance, updatedAt: now })
      .where(eq(tekBalances.userId, userId));
    return newBalance;
  } else {
    await db.insert(tekBalances).values({
      userId,
      balance: amount,
      updatedAt: now,
    });
    return amount;
  }
}

/**
 * Returns the user's current tek balance (0 if no row exists yet).
 */
export async function getTekBalance(
  db: DrizzleClient,
  userId: string
): Promise<number> {
  const row = await db
    .select({ balance: tekBalances.balance })
    .from(tekBalances)
    .where(eq(tekBalances.userId, userId))
    .get();
  return row?.balance ?? 0;
}
