import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import {
  createDb,
  aiRewriteHistory,
  phraseCards,
  rewriteHistoryCards,
  users,
} from "../db";
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

const REWRITE_METADATA_SCHEMA = {
  type: "json_schema",
  json_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      changes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            original: { type: "string" },
            corrected: { type: "string" },
            reason: { type: "string" },
          },
          required: ["original", "corrected", "reason"],
        },
      },
      tone: {
        type: "string",
        enum: [
          "friendly",
          "professional",
          "too_casual",
          "too_formal",
          "neutral",
        ],
      },
    },
    required: ["changes", "tone"],
  },
} as const;

const REWRITE_TIPS_SCHEMA = {
  type: "json_schema",
  json_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      tips: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["tips"],
  },
} as const;

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

/** Returns the ISO timestamp of the next daily reset (UTC 20:00 = JST 05:00). */
function nextResetIso(): string {
  const now = new Date();
  const offsetDays = now.getUTCHours() >= 20 ? 1 : 0;
  const reset = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offsetDays,
      20
    )
  );
  return reset.toISOString();
}

function buildRewriteSystemPrompt(
  context: RewriteContext,
  userLevel: string
): string {
  const baseRules = [
    "You are an expert technical writing coach for software engineers.",
    "Rewrite the user's English text to be clear, concise, and natural for the given context.",
    `The user's proficiency level is ${userLevel}.`,
    "Preserve the author's intended meaning.",
    "Do not invent facts, steps, logs, versions, or conclusions.",
    "Preserve inline code, commands, file names, and technical identifiers.",
    "Return only the rewritten text.",
    "Do not add explanations, notes, or labels like 'Improvements Made' or 'Tips'.",
  ];

  if (context === "github_issue") {
    baseRules.push(
      "",
      "For GitHub issues:",
      "- Preserve Markdown structure.",
      "- Keep headings, blank lines, numbered lists, and bullet lists.",
      "- Do NOT collapse the issue into a single paragraph.",
      "- Keep the output easy to paste directly into GitHub.",
      "- Keep the tone professional and concise."
    );
  }

  if (context === "pr_comment") {
    baseRules.push(
      "",
      "For PR comments:",
      "- Preserve line breaks and list structure when present.",
      "- Keep the comment direct, actionable, and easy to skim.",
      "- Prefer short paragraphs or bullets over dense blocks.",
      "- Make requests and suggestions explicit."
    );
  }

  if (context === "commit_message") {
    baseRules.push(
      "",
      "For commit messages:",
      "- Prefer conventional imperative style.",
      "- Keep the subject concise.",
      "- Do not add headings or unnecessary sections."
    );
  }

  if (context === "slack") {
    baseRules.push(
      "",
      "For Slack messages:",
      "- Keep the message natural, concise, and conversational.",
      "- Preserve short paragraphs and bullets when helpful.",
      "- Do not make it overly formal.",
      "- Keep it easy to read quickly in chat."
    );
  }

  if (context === "general") {
    baseRules.push(
      "",
      "For general writing:",
      "- Optimize for clarity and natural phrasing.",
      "- Preserve useful structure from the original text.",
      "- Do not force GitHub-style sections unless the input already uses them."
    );
  }

  return baseRules.join("\n");
}

function buildRewriteUserPrompt(
  context: RewriteContext,
  original: string
): string {
  const prompt = [
    `Context: ${context}`,
    "",
    "---BEGIN USER TEXT---",
    original,
    "---END USER TEXT---",
    "",
    "Rewrite the text for the given context.",
  ];

  if (context === "github_issue") {
    prompt.push(
      "If the input uses Markdown, keep it as Markdown.",
      "Preserve headings, numbered steps, bullet points, and code spans."
    );
  }

  if (context === "pr_comment") {
    prompt.push(
      "Make the comment easy for reviewers to scan.",
      "If the input includes multiple points, preserve them as separate lines or bullets."
    );
  }

  if (context === "commit_message") {
    prompt.push(
      "Return a commit message, not an explanation or description block."
    );
  }

  if (context === "slack") {
    prompt.push("Keep the output suitable for posting directly in Slack.");
  }

  if (context === "general") {
    prompt.push(
      "Preserve the original structure when it improves readability."
    );
  }

  prompt.push("Return only the rewritten text.");

  return prompt.join("\n");
}

function buildRewriteAnalysisSystemPrompt(context: RewriteContext): string {
  return [
    "You are an expert technical writing coach for software engineers.",
    `Analyze a rewrite for the context: ${context}.`,
    "You will receive the original text and the rewritten text.",
    "Return only valid JSON, with no markdown wrapper and no extra text.",
    "Focus only on tone assessment and key changes.",
  ].join("\n");
}

function buildRewriteAnalysisUserPrompt(
  context: RewriteContext,
  original: string,
  rewritten: string
): string {
  return [
    `Context: ${context}`,
    "",
    "---BEGIN ORIGINAL TEXT---",
    original,
    "---END ORIGINAL TEXT---",
    "",
    "---BEGIN REWRITTEN TEXT---",
    rewritten,
    "---END REWRITTEN TEXT---",
    "",
    "Analyze the rewrite and return JSON in this shape:",
    "{",
    '  "changes": [{"original": "<original phrase>", "corrected": "<corrected phrase>", "reason": "<why this change>"}],',
    '  "tone": "<friendly|professional|too_casual|too_formal|neutral>",',
    "}",
  ].join("\n");
}

function buildRewriteTipsSystemPrompt(context: RewriteContext): string {
  return [
    "You are an expert technical writing coach for software engineers.",
    `Review a rewrite for the context: ${context}.`,
    "You will receive the original text and the rewritten text.",
    "Return only valid JSON, with no markdown wrapper and no extra text.",
    "Return practical improvement tips in Japanese only.",
    "Each tip must be a natural Japanese sentence.",
    "Do not write any English.",
    "Keep tips concise and useful for a Japanese learner of technical English.",
  ].join("\n");
}

function buildRewriteTipsUserPrompt(
  context: RewriteContext,
  original: string,
  rewritten: string
): string {
  return [
    `Context: ${context}`,
    "",
    "---BEGIN ORIGINAL TEXT---",
    original,
    "---END ORIGINAL TEXT---",
    "",
    "---BEGIN REWRITTEN TEXT---",
    rewritten,
    "---END REWRITTEN TEXT---",
    "",
    "Return JSON in this shape:",
    "{",
    '  "tips": ["<日本語の改善ポイント1>", "<日本語の改善ポイント2>"]',
    "}",
    'Example tips: ["文法と語順を整えると、読みやすさが上がります。", "問題の状況と再現手順を具体的に書くと伝わりやすくなります。"]',
  ].join("\n");
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

function normalizeRewrittenText(text: string): string | null {
  const normalized = text
    .replace(/^```(?:markdown|md|text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return normalized.length > 0 ? normalized : null;
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
    return c.json({ error: "text must be 2000 characters or fewer" }, 400);
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
    return c.json({ error: "Daily rewrite limit reached", remaining: 0 }, 429);
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

  // Step 1: generate rewritten text only
  const rewriteSystemPrompt = buildRewriteSystemPrompt(body.context, userLevel);
  const llmService = createLLMService(c.env);
  const rewriteUserPrompt = buildRewriteUserPrompt(body.context, body.text);

  let rewriteResponse;
  try {
    rewriteResponse = await llmService.router.generate(
      rewriteUserPrompt,
      {
        system: rewriteSystemPrompt,
        maxTokens: 1400,
        temperature: 0.2,
      },
      "lightweight"
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

  const rewritten = normalizeRewrittenText(rewriteResponse.text);
  if (!rewritten) {
    console.error("[rewrite] Failed to parse rewritten text", {
      text: rewriteResponse.text,
    });
    const rollbackValue: RewriteCountValue = {
      count: currentCount,
      updatedAt: new Date().toISOString(),
    };
    await c.env.USAGE_KV.put(countKey, JSON.stringify(rollbackValue), {
      expirationTtl: 48 * 60 * 60,
    });
    return c.json({ error: "Failed to parse AI response" }, 502);
  }

  // Step 2: analyze rewrite metadata as structured JSON
  const analysisSystemPrompt = buildRewriteAnalysisSystemPrompt(body.context);
  const analysisUserPrompt = buildRewriteAnalysisUserPrompt(
    body.context,
    body.text,
    rewritten
  );

  let metadata: Pick<RewriteResult, "changes" | "tone">;
  let analysisUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  try {
    const { data, raw } = await llmService.router.generateJson<
      Partial<RewriteResult>
    >(
      analysisUserPrompt,
      {
        system: analysisSystemPrompt,
        maxTokens: 700,
        temperature: 0.1,
        responseFormat: REWRITE_METADATA_SCHEMA,
      },
      "lightweight"
    );
    analysisUsage = raw.usage;
    const changes = Array.isArray(data.changes)
      ? data.changes.filter(
          (item): item is RewriteResult["changes"][number] =>
            typeof item === "object" &&
            item !== null &&
            typeof item.original === "string" &&
            typeof item.corrected === "string" &&
            typeof item.reason === "string"
        )
      : [];
    metadata = { changes, tone: normalizeTone(data.tone) };
  } catch (err) {
    console.error("[rewrite] LLM analysis failed", { error: String(err) });
    const rollbackValue: RewriteCountValue = {
      count: currentCount,
      updatedAt: new Date().toISOString(),
    };
    await c.env.USAGE_KV.put(countKey, JSON.stringify(rollbackValue), {
      expirationTtl: 48 * 60 * 60,
    });
    return c.json({ error: "LLM service unavailable" }, 502);
  }

  // Step 3: generate Japanese tips only
  const tipsSystemPrompt = buildRewriteTipsSystemPrompt(body.context);
  const tipsUserPrompt = buildRewriteTipsUserPrompt(
    body.context,
    body.text,
    rewritten
  );

  let tips: string[];
  let tipsUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  try {
    const tipsResult = await llmService.router.generateJson<{ tips?: unknown }>(
      tipsUserPrompt,
      {
        system: tipsSystemPrompt,
        maxTokens: 300,
        temperature: 0.1,
        responseFormat: REWRITE_TIPS_SCHEMA,
      },
      "lightweight"
    );
    tipsUsage = tipsResult.raw.usage;
    tips = Array.isArray(tipsResult.data.tips)
      ? tipsResult.data.tips
          .filter((item): item is string => typeof item === "string")
          .map((tip) => tip.trim())
          .filter(Boolean)
      : [];
  } catch (err) {
    console.error("[rewrite] LLM tips generation failed", {
      error: String(err),
    });
    const rollbackValue: RewriteCountValue = {
      count: currentCount,
      updatedAt: new Date().toISOString(),
    };
    await c.env.USAGE_KV.put(countKey, JSON.stringify(rollbackValue), {
      expirationTtl: 48 * 60 * 60,
    });
    return c.json({ error: "LLM service unavailable" }, 502);
  }

  const result: RewriteResult = {
    rewritten,
    changes: metadata.changes,
    tone: metadata.tone,
    tips,
  };

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
  await llmService.usage.track(userId, {
    promptTokens:
      rewriteResponse.usage.promptTokens +
      analysisUsage.promptTokens +
      tipsUsage.promptTokens,
    completionTokens:
      rewriteResponse.usage.completionTokens +
      analysisUsage.completionTokens +
      tipsUsage.completionTokens,
    totalTokens:
      rewriteResponse.usage.totalTokens +
      analysisUsage.totalTokens +
      tipsUsage.totalTokens,
  });

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
    resetsAt: nextResetIso(),
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
    .where(
      and(eq(aiRewriteHistory.id, id), eq(aiRewriteHistory.userId, userId))
    )
    .get();

  if (!row) {
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
// GET /api/rewrite/:id/cards — Cards associated with a rewrite history entry
// ---------------------------------------------------------------------------
rewriteRoutes.get("/:id/cards", async (c) => {
  const { userId } = c.get("user");
  const historyId = c.req.param("id");

  const db = createDb(c.env.DB);
  const historyRow = await db
    .select()
    .from(aiRewriteHistory)
    .where(
      and(
        eq(aiRewriteHistory.id, historyId),
        eq(aiRewriteHistory.userId, userId)
      )
    )
    .get();

  if (!historyRow) {
    return c.json({ error: "Not found" }, 404);
  }

  const cards = await db
    .select({
      changeIndex: rewriteHistoryCards.changeIndex,
      id: phraseCards.id,
      phrase: phraseCards.phrase,
      translation: phraseCards.translation,
    })
    .from(rewriteHistoryCards)
    .innerJoin(phraseCards, eq(rewriteHistoryCards.cardId, phraseCards.id))
    .where(eq(rewriteHistoryCards.historyId, historyId));

  return c.json({ items: cards });
});

// ---------------------------------------------------------------------------
// POST /api/rewrite/:id/save-card — Save to phrase card
// ---------------------------------------------------------------------------
rewriteRoutes.post("/:id/save-card", async (c) => {
  const { userId } = c.get("user");
  const historyId = c.req.param("id");

  let body: { phrase: string; translation: string; changeIndex: number };
  try {
    body = await c.req.json<{
      phrase: string;
      translation: string;
      changeIndex: number;
    }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.phrase || !body.translation || Number.isNaN(body.changeIndex)) {
    return c.json(
      { error: "phrase, translation, and changeIndex are required" },
      400
    );
  }

  const db = createDb(c.env.DB);

  // Look up the rewrite history entry
  const historyRow = await db
    .select()
    .from(aiRewriteHistory)
    .where(
      and(
        eq(aiRewriteHistory.id, historyId),
        eq(aiRewriteHistory.userId, userId)
      )
    )
    .get();

  if (!historyRow) {
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
    createdByUserId: userId,
    domain: userRow.domain,
    level: userRow.level,
    category,
    createdAt: now,
  });

  await db.insert(rewriteHistoryCards).values({
    id: crypto.randomUUID(),
    historyId,
    cardId,
    changeIndex: body.changeIndex,
    createdAt: now,
  });

  return c.json({ cardId }, 201);
});
