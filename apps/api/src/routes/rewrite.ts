import { Hono } from "hono";
import { eq, desc, count } from "drizzle-orm";
import { createDb, aiRewriteHistory, phraseCards, users } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import { createLLMService } from "../lib/llm";
import type {
  RewriteContext,
  RewriteResult,
  RewriteRequestPayload,
  RewriteHistoryItem,
  RewriteHistoryResponse,
  RewriteHistoryDetail,
  RewriteRemainingResponse,
  CardCategory,
} from "@teklin/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_REWRITE_LIMIT = 3;

const VALID_CONTEXTS: RewriteContext[] = [
  "commit_message",
  "pr_comment",
  "github_issue",
  "slack",
  "general",
];

const CONTEXT_TO_CATEGORY: Record<RewriteContext, CardCategory> = {
  commit_message: "commit_messages",
  pr_comment: "pr_comments",
  github_issue: "github_issues",
  slack: "slack_chat",
  general: "slack_chat",
};

// ---------------------------------------------------------------------------
// KV helpers
// ---------------------------------------------------------------------------

interface RewriteCountValue {
  count: number;
  updatedAt: string;
}

function rewriteCountKey(userId: string, date: string): string {
  return `rewrite:${userId}:${date}`;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function midnightUtcIso(): string {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return midnight.toISOString();
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text.trim();
}

function normalizeTone(value: unknown): RewriteResult["tone"] {
  return value === "friendly" ||
    value === "professional" ||
    value === "too_casual" ||
    value === "too_formal" ||
    value === "neutral"
    ? value
    : "neutral";
}

function parseTipsFromText(text: string): string[] {
  const match = text.match(
    /(?:^|\n)(?:#+\s*)?(?:Improvements made|Tips?)\s*:\s*\n?([\s\S]*)$/i
  );
  if (!match) {
    return [];
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(\d+\.|[-*])\s+/.test(line))
    .map((line) => line.replace(/^(\d+\.|[-*])\s+/, "").trim())
    .slice(0, 5);
}

function stripTrailingTipsSection(text: string): string {
  return text
    .replace(/\n+(?:#+\s*)?(?:Improvements made|Tips?)\s*:\s*[\s\S]*$/i, "")
    .trim();
}

function parseRewriteResponse(text: string): RewriteResult | null {
  try {
    const parsed = JSON.parse(extractJson(text)) as Partial<RewriteResult>;
    if (typeof parsed.rewritten !== "string") {
      return null;
    }

    const changes = Array.isArray(parsed.changes)
      ? parsed.changes.filter(
          (item): item is RewriteResult["changes"][number] =>
            typeof item === "object" &&
            item !== null &&
            typeof item.original === "string" &&
            typeof item.corrected === "string" &&
            typeof item.reason === "string"
        )
      : [];

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((item): item is string => typeof item === "string")
      : [];

    return {
      rewritten: parsed.rewritten.trim(),
      changes,
      tone: normalizeTone(parsed.tone),
      tips,
    };
  } catch {
    const rewritten = stripTrailingTipsSection(text);
    if (!rewritten) {
      return null;
    }

    return {
      rewritten,
      changes: [],
      tone: "professional",
      tips: parseTipsFromText(text),
    };
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const rewriteRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

rewriteRoutes.use("/*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /api/rewrite — AI rewrite
// ---------------------------------------------------------------------------
rewriteRoutes.post("/", async (c) => {
  const { userId } = c.get("user");

  // Parse request body
  let body: RewriteRequestPayload;
  try {
    body = await c.req.json<RewriteRequestPayload>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  // Validate context
  if (!body.context || !VALID_CONTEXTS.includes(body.context)) {
    return c.json(
      {
        error: `context must be one of: ${VALID_CONTEXTS.join(", ")}`,
      },
      400
    );
  }

  // Validate text
  if (!body.text || body.text.trim().length === 0) {
    return c.json({ error: "text is required" }, 400);
  }
  if (body.text.length > 2000) {
    return c.json(
      { error: "text must be 2000 characters or fewer" },
      400
    );
  }

  // Check daily rewrite limit
  const today = todayUtc();
  const countKey = rewriteCountKey(userId, today);
  const countValue = await c.env.USAGE_KV.get<RewriteCountValue>(
    countKey,
    "json"
  );
  const currentCount = countValue?.count ?? 0;

  if (currentCount >= DAILY_REWRITE_LIMIT) {
    return c.json(
      { error: "Daily rewrite limit reached", remaining: 0 },
      429
    );
  }

  // Pre-increment rewrite count to prevent race conditions.
  // If the LLM call fails, we decrement below.
  const preIncrementedCount: RewriteCountValue = {
    count: currentCount + 1,
    updatedAt: new Date().toISOString(),
  };
  await c.env.USAGE_KV.put(countKey, JSON.stringify(preIncrementedCount), {
    expirationTtl: 48 * 60 * 60,
  });

  // Get user's level from DB
  const db = createDb(c.env.DB);
  const userRow = await db
    .select({ level: users.level })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!userRow) {
    return c.json({ error: "User not found" }, 404);
  }

  const userLevel = userRow.level;

  // Build custom system prompt for structured JSON output
  const systemPrompt = [
    "You are an expert technical writing coach for software engineers.",
    "Rewrite the user's English text to be clear, concise, and natural for the given context.",
    `The user's proficiency level is ${userLevel}.`,
    "",
    "You MUST respond with valid JSON only, no markdown, no extra text.",
    "JSON format:",
    "{",
    '  "rewritten": "<the rewritten text>",',
    '  "changes": [{"original": "<original phrase>", "corrected": "<corrected phrase>", "reason": "<why this change>"}],',
    '  "tone": "<friendly|professional|too_casual|too_formal|neutral>",',
    '  "tips": ["<日本語の改善ポイント1>", "<日本語の改善ポイント2>"]',
    "}",
    'The "tips" field MUST be written in Japanese.',
  ].join("\n");

  // Build user prompt from template
  const llmService = createLLMService(c.env);
  const { user: userPrompt } = llmService.prompts.render(
    llmService.prompts.templates.rewrite,
    { context: body.context, original: body.text }
  );

  // Call LLM
  let llmResponse;
  try {
    llmResponse = await llmService.router.generate(
      userPrompt,
      { system: systemPrompt },
      "quality"
    );
  } catch (err) {
    console.error("[rewrite] LLM generation failed", { error: String(err) });
    // Rollback pre-incremented count
    const rollbackValue: RewriteCountValue = {
      count: currentCount,
      updatedAt: new Date().toISOString(),
    };
    await c.env.USAGE_KV.put(countKey, JSON.stringify(rollbackValue), {
      expirationTtl: 48 * 60 * 60,
    });
    return c.json({ error: "LLM service unavailable" }, 502);
  }

  // Parse LLM response as RewriteResult
  const result = parseRewriteResponse(llmResponse.text);
  if (!result) {
    console.error("[rewrite] Failed to parse LLM response as JSON", {
      text: llmResponse.text,
    });
    // Rollback pre-incremented count
    const rollbackValue: RewriteCountValue = {
      count: currentCount,
      updatedAt: new Date().toISOString(),
    };
    await c.env.USAGE_KV.put(countKey, JSON.stringify(rollbackValue), {
      expirationTtl: 48 * 60 * 60,
    });
    return c.json({ error: "Failed to parse AI response" }, 502);
  }

  // Save to ai_rewrite_history
  const historyId = crypto.randomUUID();
  const now = Date.now();
  const explanation = JSON.stringify({
    changes: result.changes,
    tone: result.tone,
    tips: result.tips,
  });

  await db.insert(aiRewriteHistory).values({
    id: historyId,
    userId,
    originalText: body.text,
    rewrittenText: result.rewritten,
    explanation,
    context: body.context,
    createdAt: now,
  });

  // Track LLM usage
  await llmService.usage.track(userId, llmResponse.usage);

  return c.json({ id: historyId, ...result });
});

// ---------------------------------------------------------------------------
// GET /api/rewrite/history — List history
// ---------------------------------------------------------------------------
rewriteRoutes.get("/history", async (c) => {
  const { userId } = c.get("user");
  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");
  const limit = Math.min(parseInt(limitParam ?? "20", 10), 100);
  const offset = parseInt(offsetParam ?? "0", 10);

  const db = createDb(c.env.DB);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: aiRewriteHistory.id,
        originalText: aiRewriteHistory.originalText,
        rewrittenText: aiRewriteHistory.rewrittenText,
        context: aiRewriteHistory.context,
        createdAt: aiRewriteHistory.createdAt,
      })
      .from(aiRewriteHistory)
      .where(eq(aiRewriteHistory.userId, userId))
      .orderBy(desc(aiRewriteHistory.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(aiRewriteHistory)
      .where(eq(aiRewriteHistory.userId, userId))
      .get(),
  ]);

  const items: RewriteHistoryItem[] = rows.map((row) => ({
    id: row.id,
    originalText: row.originalText,
    rewrittenText: row.rewrittenText,
    context: row.context as RewriteContext,
    createdAt: new Date(row.createdAt).toISOString(),
  }));

  const response: RewriteHistoryResponse = {
    items,
    total: totalRow?.value ?? 0,
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// GET /api/rewrite/remaining — Check remaining rewrites
// ---------------------------------------------------------------------------
rewriteRoutes.get("/remaining", async (c) => {
  const { userId } = c.get("user");
  const today = todayUtc();
  const countKey = rewriteCountKey(userId, today);
  const countValue = await c.env.USAGE_KV.get<RewriteCountValue>(
    countKey,
    "json"
  );
  const currentCount = countValue?.count ?? 0;

  const response: RewriteRemainingResponse = {
    remaining: Math.max(0, DAILY_REWRITE_LIMIT - currentCount),
    limit: DAILY_REWRITE_LIMIT,
    resetsAt: midnightUtcIso(),
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// GET /api/rewrite/history/:id — Single history detail
// ---------------------------------------------------------------------------
rewriteRoutes.get("/history/:id", async (c) => {
  const { userId } = c.get("user");
  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const row = await db
    .select()
    .from(aiRewriteHistory)
    .where(eq(aiRewriteHistory.id, id))
    .get();

  if (!row || row.userId !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  const response: RewriteHistoryDetail = {
    id: row.id,
    originalText: row.originalText,
    rewrittenText: row.rewrittenText,
    explanation: row.explanation,
    context: row.context as RewriteContext,
    createdAt: new Date(row.createdAt).toISOString(),
  };
  return c.json(response);
});

// ---------------------------------------------------------------------------
// POST /api/rewrite/:id/save-card — Save to phrase card
// ---------------------------------------------------------------------------
rewriteRoutes.post("/:id/save-card", async (c) => {
  const { userId } = c.get("user");
  const historyId = c.req.param("id");

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

  // Look up the rewrite history entry
  const historyRow = await db
    .select()
    .from(aiRewriteHistory)
    .where(eq(aiRewriteHistory.id, historyId))
    .get();

  if (!historyRow || historyRow.userId !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  // Get user's level and domain
  const userRow = await db
    .select({ level: users.level, domain: users.domain })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!userRow) {
    return c.json({ error: "User not found" }, 404);
  }

  // Map RewriteContext to CardCategory
  const category = CONTEXT_TO_CATEGORY[historyRow.context as RewriteContext];
  const cardId = crypto.randomUUID();
  const now = Date.now();

  await db.insert(phraseCards).values({
    id: cardId,
    phrase: body.phrase,
    translation: body.translation,
    context: historyRow.originalText,
    domain: userRow.domain,
    level: userRow.level,
    category,
    createdAt: now,
  });

  return c.json({ cardId }, 201);
});
