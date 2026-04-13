import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { createDb, placementResults } from "../db";
import { users } from "../db/schema";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";
import {
  placementSessionKey,
  type PlacementSessionKvValue,
  type PlacementAnswerRecord,
} from "../kv";
import { createLLMService } from "../lib/llm";
import {
  PLACEMENT_QUESTIONS,
  scoreMultipleChoice,
  scoreWriting,
  calculateAxisScores,
  determineLevel,
  identifyWeaknesses,
} from "../lib/placement";
import type { SkillAxis } from "@teklin/shared";
import type { QuestionData } from "../lib/placement/questions";

/** Strip internal-only fields before sending a question to the client */
function toClientQuestion(
  q: QuestionData
): Omit<QuestionData, "correctChoiceId" | "scoringCriteria"> {
  const entries = Object.entries(q).filter(
    ([k]) => k !== "correctChoiceId" && k !== "scoringCriteria"
  );
  return Object.fromEntries(entries) as Omit<
    QuestionData,
    "correctChoiceId" | "scoringCriteria"
  >;
}

export const placementRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// All routes require auth
placementRoutes.use("/*", authMiddleware);

/**
 * Generate an initial question order: interleave axes at medium difficulty.
 * Adaptive selection replaces entries at runtime as answers come in.
 */
function generateQuestionOrder(): string[] {
  const axes: SkillAxis[] = ["reading", "writing", "vocabulary", "nuance"];
  const order: string[] = [];

  // 5 rounds × 4 axes = 20 questions; start with medium difficulty
  for (let round = 0; round < 5; round++) {
    for (const axis of axes) {
      const candidates = PLACEMENT_QUESTIONS.filter(
        (q) => q.axis === axis && q.difficulty === 2
      );
      const pick = candidates[round % candidates.length];
      if (pick) {
        order.push(pick.id);
      }
    }
  }

  return order;
}

/**
 * Select the next question for an axis adaptively.
 * Adjusts difficulty based on the last answer for that axis.
 */
function selectNextQuestion(
  axis: SkillAxis,
  answers: PlacementAnswerRecord[],
  usedIds: Set<string>
): string | null {
  const axisAnswers = answers.filter((a) => a.axis === axis);
  const lastAnswer = axisAnswers[axisAnswers.length - 1];

  let targetDifficulty: 1 | 2 | 3 = 2;
  if (lastAnswer) {
    if (lastAnswer.score >= 70) {
      targetDifficulty = Math.min(
        3,
        lastAnswer.difficulty + 1
      ) as 1 | 2 | 3;
    } else if (lastAnswer.score < 40) {
      targetDifficulty = Math.max(
        1,
        lastAnswer.difficulty - 1
      ) as 1 | 2 | 3;
    } else {
      targetDifficulty = lastAnswer.difficulty;
    }
  }

  // Prefer target difficulty; fall back to any unused question for this axis
  let candidates = PLACEMENT_QUESTIONS.filter(
    (q) =>
      q.axis === axis &&
      q.difficulty === targetDifficulty &&
      !usedIds.has(q.id)
  );

  if (candidates.length === 0) {
    candidates = PLACEMENT_QUESTIONS.filter(
      (q) => q.axis === axis && !usedIds.has(q.id)
    );
  }

  return candidates[0]?.id ?? null;
}

const TOTAL_QUESTIONS = 20;
const SESSION_TTL = 3600; // 1 hour

// ---------------------------------------------------------------------------
// POST /placement/start — Start or resume a placement test
// ---------------------------------------------------------------------------
placementRoutes.post("/start", async (c) => {
  const { userId } = c.get("user");
  const kv = c.env.SESSION_KV;
  const key = placementSessionKey(userId);

  // Resume an existing in-progress session
  const existing = await kv.get<PlacementSessionKvValue>(key, "json");
  if (existing && existing.status === "in_progress") {
    const questionId = existing.questionOrder[existing.currentIndex];
    const question = PLACEMENT_QUESTIONS.find((q) => q.id === questionId);
    if (question) {
      return c.json({
        question: toClientQuestion(question),
        progress: {
          current: existing.currentIndex + 1,
          total: TOTAL_QUESTIONS,
        },
        isComplete: false,
      });
    }
  }

  // Create a new session
  const questionOrder = generateQuestionOrder();
  const session: PlacementSessionKvValue = {
    userId,
    questionOrder,
    answers: [],
    currentIndex: 0,
    startedAt: Date.now(),
    status: "in_progress",
  };

  await kv.put(key, JSON.stringify(session), { expirationTtl: SESSION_TTL });

  const firstQuestion = PLACEMENT_QUESTIONS.find(
    (q) => q.id === questionOrder[0]
  );
  if (!firstQuestion) {
    return c.json({ error: "No questions available" }, 500);
  }

  return c.json({
    question: toClientQuestion(firstQuestion),
    progress: { current: 1, total: TOTAL_QUESTIONS },
    isComplete: false,
  });
});

// ---------------------------------------------------------------------------
// POST /placement/answer — Submit an answer and receive the next question
// ---------------------------------------------------------------------------
placementRoutes.post("/answer", async (c) => {
  const { userId } = c.get("user");
  const kv = c.env.SESSION_KV;
  const key = placementSessionKey(userId);

  const session = await kv.get<PlacementSessionKvValue>(key, "json");
  if (!session || session.status !== "in_progress") {
    return c.json({ error: "No active placement session" }, 400);
  }

  const body = await c.req.json<{ questionId: string; answer: string }>();
  const { questionId, answer } = body;

  const question = PLACEMENT_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return c.json({ error: "Invalid question" }, 400);
  }

  // Score the answer
  let score: number;
  if (question.type === "multiple_choice") {
    score = scoreMultipleChoice(questionId, answer);
  } else {
    const llm = createLLMService(c.env);
    score = await scoreWriting(questionId, answer, llm);
  }

  // Record the answer
  const answerRecord: PlacementAnswerRecord = {
    questionId,
    answer,
    axis: question.axis,
    difficulty: question.difficulty,
    score,
    answeredAt: Date.now(),
  };
  session.answers.push(answerRecord);
  session.currentIndex++;

  // Test complete?
  if (session.currentIndex >= TOTAL_QUESTIONS) {
    session.status = "completed";
    await kv.put(key, JSON.stringify(session), { expirationTtl: SESSION_TTL });

    return c.json({
      question: null,
      progress: { current: TOTAL_QUESTIONS, total: TOTAL_QUESTIONS },
      isComplete: true,
    });
  }

  // Adaptively select the next question
  const usedIds = new Set(session.answers.map((a) => a.questionId));
  const axes: SkillAxis[] = ["reading", "writing", "vocabulary", "nuance"];
  const nextAxis = axes[session.currentIndex % 4];
  const nextQuestionId = selectNextQuestion(nextAxis, session.answers, usedIds);

  if (nextQuestionId) {
    session.questionOrder[session.currentIndex] = nextQuestionId;
  }

  await kv.put(key, JSON.stringify(session), { expirationTtl: SESSION_TTL });

  const nextQuestion = PLACEMENT_QUESTIONS.find(
    (q) => q.id === session.questionOrder[session.currentIndex]
  );

  if (!nextQuestion) {
    return c.json({ error: "No more questions available" }, 500);
  }

  return c.json({
    question: toClientQuestion(nextQuestion),
    progress: {
      current: session.currentIndex + 1,
      total: TOTAL_QUESTIONS,
    },
    isComplete: false,
  });
});

// ---------------------------------------------------------------------------
// POST /placement/complete — Compute final results and persist to D1
// ---------------------------------------------------------------------------
placementRoutes.post("/complete", async (c) => {
  const { userId } = c.get("user");
  const kv = c.env.SESSION_KV;
  const key = placementSessionKey(userId);

  const session = await kv.get<PlacementSessionKvValue>(key, "json");
  if (!session) {
    return c.json({ error: "No placement session found" }, 400);
  }

  if (
    session.status !== "completed" &&
    session.answers.length < TOTAL_QUESTIONS
  ) {
    return c.json({ error: "Test is not yet complete" }, 400);
  }

  // Calculate results
  const scores = calculateAxisScores(session.answers);
  const level = determineLevel(scores);
  const weaknesses = identifyWeaknesses(scores);

  // Persist to D1
  const db = createDb(c.env.DB);
  const resultId = crypto.randomUUID();
  const now = Date.now();

  await db.insert(placementResults).values({
    id: resultId,
    userId,
    readingScore: scores.reading,
    writingScore: scores.writing,
    vocabularyScore: scores.vocabulary,
    nuanceScore: scores.nuance,
    level,
    weaknesses: JSON.stringify(weaknesses),
    createdAt: now,
  });

  // Update the user's level
  await db
    .update(users)
    .set({ level, updatedAt: now })
    .where(eq(users.id, userId));

  // Clean up KV session
  await kv.delete(key);

  return c.json({
    level,
    scores,
    weaknesses,
    totalQuestions: session.answers.length,
    completedAt: new Date(now).toISOString(),
  });
});

// ---------------------------------------------------------------------------
// GET /placement/result — Retrieve the most recent placement result
// ---------------------------------------------------------------------------
placementRoutes.get("/result", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  const result = await db
    .select()
    .from(placementResults)
    .where(eq(placementResults.userId, userId))
    .orderBy(desc(placementResults.createdAt))
    .limit(1)
    .get();

  if (!result) {
    return c.json({ error: "No placement result found" }, 404);
  }

  return c.json({
    level: result.level,
    scores: {
      reading: result.readingScore,
      writing: result.writingScore,
      vocabulary: result.vocabularyScore,
      nuance: result.nuanceScore,
    },
    weaknesses: JSON.parse(result.weaknesses) as string[],
    totalQuestions: TOTAL_QUESTIONS,
    completedAt: new Date(result.createdAt).toISOString(),
  });
});
