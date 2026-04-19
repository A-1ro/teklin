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
import type { PlacementAnswerFeedback, PlacementAnswerReview, SkillAxis, WritingRating } from "@teklin/shared";
import type { QuestionData } from "../lib/placement/questions";

const SKIP_ANSWER = "__skip__";

/** Build answer review objects for the result page */
function buildAnswerReviews(
  records: PlacementAnswerRecord[]
): PlacementAnswerReview[] {
  return records
    .map((rec) => {
      const q = PLACEMENT_QUESTIONS.find((q) => q.id === rec.questionId);
      if (!q) return null;
      return {
        questionId: rec.questionId,
        axis: rec.axis,
        type: q.type,
        prompt: q.prompt,
        userAnswer: rec.answer,
        score: rec.score,
        isSkip: rec.answer === SKIP_ANSWER,
        choices: q.choices,
        correctChoiceId: q.correctChoiceId,
        advice: rec.advice,
      };
    })
    .filter((r): r is PlacementAnswerReview => r !== null);
}

/** Strip internal-only fields before sending a question to the client */
function toClientQuestion(
  q: QuestionData
): Omit<QuestionData, "correctChoiceId" | "scoringCriteria"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { correctChoiceId: _c, scoringCriteria: _s, ...rest } = q;
  return rest;
}

export const placementRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

// All routes require auth
placementRoutes.use("/*", authMiddleware);

/**
 * Generate an initial question order: interleave axes starting at easy.
 * Adaptive selection replaces entries at runtime as answers come in.
 * 3 rounds × 4 axes = 12 questions total.
 */
function generateQuestionOrder(): string[] {
  const axes: SkillAxis[] = ["reading", "writing", "vocabulary", "nuance"];
  const order: string[] = [];
  const usedIds = new Set<string>();

  // Start at difficulty 1 (easy); adaptive algorithm escalates from there
  for (let round = 0; round < 3; round++) {
    for (const axis of axes) {
      const candidates = PLACEMENT_QUESTIONS.filter(
        (q) => q.axis === axis && q.difficulty === 1 && !usedIds.has(q.id)
      );
      const fallback = PLACEMENT_QUESTIONS.filter(
        (q) => q.axis === axis && !usedIds.has(q.id)
      );
      const pool = candidates.length > 0 ? candidates : fallback;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) {
        order.push(pick.id);
        usedIds.add(pick.id);
      }
    }
  }

  return order;
}

/**
 * Select the next question for an axis using binary-search style adaptation.
 * Starts easy and escalates only when the user answers correctly.
 * "わからない" (skip) is treated as incorrect (score 0).
 */
function selectNextQuestion(
  axis: SkillAxis,
  answers: PlacementAnswerRecord[],
  usedIds: Set<string>
): string | null {
  const axisAnswers = answers.filter((a) => a.axis === axis);
  const lastAnswer = axisAnswers[axisAnswers.length - 1];

  // Default to easy; only escalate on a clear correct answer
  let targetDifficulty: 1 | 2 | 3 = 1;
  if (lastAnswer) {
    if (lastAnswer.score >= 70) {
      // Correct → step up
      targetDifficulty = Math.min(3, lastAnswer.difficulty + 1) as 1 | 2 | 3;
    } else {
      // Wrong or skipped → step down (floor at 1)
      targetDifficulty = Math.max(1, lastAnswer.difficulty - 1) as 1 | 2 | 3;
    }
  }

  // Prefer target difficulty; fall back to any unused question for this axis
  let candidates = PLACEMENT_QUESTIONS.filter(
    (q) => q.axis === axis && q.difficulty === targetDifficulty && !usedIds.has(q.id)
  );

  if (candidates.length === 0) {
    candidates = PLACEMENT_QUESTIONS.filter(
      (q) => q.axis === axis && !usedIds.has(q.id)
    );
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

const TOTAL_QUESTIONS = 12;
const SESSION_TTL = 3600; // 1 hour
const MAX_ANSWER_LENGTH = 2000;

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

  let body: { questionId?: string; answer?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { questionId, answer } = body;

  if (
    typeof questionId !== "string" ||
    typeof answer !== "string" ||
    answer.length === 0
  ) {
    return c.json({ error: "questionId and answer are required" }, 400);
  }

  if (answer.length > MAX_ANSWER_LENGTH) {
    return c.json(
      { error: `Answer must be ${MAX_ANSWER_LENGTH} characters or fewer` },
      400
    );
  }

  // Ensure the submitted questionId matches the expected current question
  const expectedId = session.questionOrder[session.currentIndex];
  if (questionId !== expectedId) {
    return c.json({ error: "Unexpected question ID" }, 400);
  }

  const question = PLACEMENT_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return c.json({ error: "Invalid question" }, 400);
  }

  // Score the answer ("わからない" skip counts as 0)
  let score: number;
  let feedback: PlacementAnswerFeedback | undefined;
  if (answer === SKIP_ANSWER) {
    score = 0;
    // For multiple choice skips, still reveal the correct answer
    if (question.type === "multiple_choice") {
      feedback = {
        type: "multiple_choice",
        isCorrect: false,
        correctChoiceId: question.correctChoiceId ?? "",
      };
    }
  } else if (question.type === "multiple_choice") {
    score = scoreMultipleChoice(questionId, answer);
    feedback = {
      type: "multiple_choice",
      isCorrect: score === 100,
      correctChoiceId: question.correctChoiceId ?? "",
    };
  } else {
    const llm = createLLMService(c.env);
    const writingResult = await scoreWriting(questionId, answer, llm);
    score = writingResult.score;
    const rating: WritingRating =
      score >= 80 ? "Excellent!!!" : score >= 60 ? "Good!" : score >= 40 ? "OK" : "Bad...";
    feedback = { type: "free_text", score, rating, advice: writingResult.advice };
  }

  // Record the answer
  const writingAdvice =
    feedback?.type === "free_text" ? feedback.advice : undefined;
  const answerRecord: PlacementAnswerRecord = {
    questionId,
    answer,
    axis: question.axis,
    difficulty: question.difficulty,
    score,
    ...(writingAdvice !== undefined && { advice: writingAdvice }),
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
      feedback,
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
    feedback,
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

  if (session.status !== "completed") {
    return c.json({ error: "Test is not yet complete" }, 400);
  }

  // Calculate results
  const scores = calculateAxisScores(session.answers);
  const level = determineLevel(scores);
  const weaknesses = identifyWeaknesses(scores);

  const db = createDb(c.env.DB);
  const now = Date.now();

  // Delete the KV session first to prevent duplicate requests from
  // re-entering this block while the D1 write is in flight.
  await kv.delete(key);

  // Persist to D1
  const resultId = crypto.randomUUID();
  await db.insert(placementResults).values({
    id: resultId,
    userId,
    readingScore: scores.reading,
    writingScore: scores.writing,
    vocabularyScore: scores.vocabulary,
    nuanceScore: scores.nuance,
    level,
    weaknesses: JSON.stringify(weaknesses),
    answers: JSON.stringify(session.answers),
    createdAt: now,
  });

  // Update the user's level
  await db
    .update(users)
    .set({ level, updatedAt: now })
    .where(eq(users.id, userId));

  const answerReviews = buildAnswerReviews(session.answers);

  return c.json({
    level,
    scores,
    weaknesses,
    totalQuestions: session.answers.length,
    completedAt: new Date(now).toISOString(),
    answers: answerReviews,
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

  const storedAnswers = result.answers
    ? (JSON.parse(result.answers) as PlacementAnswerRecord[])
    : [];

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
    answers: buildAnswerReviews(storedAnswers),
  });
});
