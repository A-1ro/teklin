import { usageKey } from "../../kv/index";
import type { UsageKvValue } from "../../kv/index";
import type { LLMUsage } from "./types";

const USAGE_TTL_SECONDS = 48 * 60 * 60; // 48 hours

/**
 * Returns today's date string in YYYY-MM-DD format (UTC).
 */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Increment the daily token usage counters for a user.
 *
 * Note: KV Read-Modify-Write is not atomic. Under concurrent requests for the
 * same user, counts may be slightly inaccurate. This is acceptable for a
 * learning app with low per-user concurrency. For strict counting, migrate to
 * D1 with INSERT ... ON CONFLICT DO UPDATE or Durable Objects.
 */
export async function trackUsage(
  kv: KVNamespace,
  userId: string,
  usage: LLMUsage
): Promise<void> {
  const date = todayUtc();
  const key = usageKey(userId, date);

  const existing = await kv.get<UsageKvValue>(key, "json");
  const current: UsageKvValue = existing ?? {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    updatedAt: new Date().toISOString(),
  };

  const updated: UsageKvValue = {
    promptTokens: current.promptTokens + usage.promptTokens,
    completionTokens: current.completionTokens + usage.completionTokens,
    totalTokens: current.totalTokens + usage.totalTokens,
    requestCount: current.requestCount + 1,
    updatedAt: new Date().toISOString(),
  };

  await kv.put(key, JSON.stringify(updated), {
    expirationTtl: USAGE_TTL_SECONDS,
  });
}

/**
 * Get today's usage for a user. Returns zero-valued record if none exists.
 */
export async function getDailyUsage(
  kv: KVNamespace,
  userId: string
): Promise<UsageKvValue> {
  const date = todayUtc();
  const key = usageKey(userId, date);
  const value = await kv.get<UsageKvValue>(key, "json");
  return (
    value ?? {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      updatedAt: new Date().toISOString(),
    }
  );
}

/**
 * Returns true if the user's total daily tokens are below the given limit.
 */
export async function checkDailyLimit(
  kv: KVNamespace,
  userId: string,
  limit: number
): Promise<boolean> {
  const usage = await getDailyUsage(kv, userId);
  return usage.totalTokens < limit;
}
