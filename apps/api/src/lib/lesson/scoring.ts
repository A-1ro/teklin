import type { LLMService } from "../llm";
import type { Exercise, WarmupQuestion } from "@teklin/shared";

const FREE_TEXT_SCORE_RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      score: {
        type: "number",
      },
      feedback: {
        type: "string",
      },
    },
    required: ["score", "feedback"],
  },
} as const;

/**
 * Sanitize text before embedding it in an LLM prompt.
 * Escapes delimiter markers to prevent prompt injection.
 */
function sanitizeForPrompt(text: string): string {
  return text.replace(/---/g, "\u2014");
}

/** Score a warmup multiple-choice question (0 or 100) */
export function scoreMultipleChoice(
  question: WarmupQuestion,
  answer: string
): number {
  return answer === question.correctChoiceId ? 100 : 0;
}

/** Score a fill_in_blank exercise (0 or 100, case-insensitive, trimmed) */
export function scoreFillInBlank(exercise: Exercise, answer: string): number {
  const normalize = (s: string) => s.trim().toLowerCase();
  const normalizedAnswer = normalize(answer);

  if (
    exercise.correctAnswer &&
    normalize(exercise.correctAnswer) === normalizedAnswer
  ) {
    return 100;
  }

  if (exercise.acceptableAnswers) {
    for (const acceptable of exercise.acceptableAnswers) {
      if (normalize(acceptable) === normalizedAnswer) {
        return 100;
      }
    }
  }

  return 0;
}

/** Score a reorder exercise (0 or 100, case-insensitive, trimmed) */
export function scoreReorder(exercise: Exercise, answer: string): number {
  if (!exercise.correctAnswer) return 0;
  const normalize = (s: string) => s.trim().toLowerCase();
  return normalize(answer) === normalize(exercise.correctAnswer) ? 100 : 0;
}

/** Score an error_correction exercise (0 or 100, case-insensitive, trimmed) */
export function scoreErrorCorrection(
  exercise: Exercise,
  answer: string
): number {
  const normalize = (s: string) => s.trim().toLowerCase();
  const normalizedAnswer = normalize(answer);

  if (
    exercise.correctAnswer &&
    normalize(exercise.correctAnswer) === normalizedAnswer
  ) {
    return 100;
  }

  if (exercise.acceptableAnswers) {
    for (const acceptable of exercise.acceptableAnswers) {
      if (normalize(acceptable) === normalizedAnswer) {
        return 100;
      }
    }
  }

  return 0;
}

/**
 * Score a paraphrase exercise using LLM and return both score and feedback.
 */
export async function scoreParaphraseWithFeedback(
  exercise: Exercise,
  answer: string,
  llm: LLMService
): Promise<{ score: number; feedback: string }> {
  try {
    const sanitizedAnswer = sanitizeForPrompt(answer);
    const sanitizedInstruction = sanitizeForPrompt(exercise.instruction ?? "");
    const originalPrompt = exercise.prompt
      ? `\n\nOriginal sentence to paraphrase: ${sanitizeForPrompt(exercise.prompt)}`
      : "";

    const system = [
      "You are an English writing evaluator for software engineers.",
      "Assess how well the user paraphrased the given sentence.",
      "A good paraphrase preserves the original meaning while using different",
      "words and sentence structure. Evaluate grammar, clarity, and meaning preservation.",
      "Return a JSON object with fields: score (0-100) and feedback (string).",
    ].join(" ");

    const user = [
      "Evaluate the following paraphrase attempt:",
      "",
      `Exercise instruction: ${sanitizedInstruction}${originalPrompt}`,
      "",
      "---BEGIN USER RESPONSE---",
      sanitizedAnswer,
      "---END USER RESPONSE---",
      "",
      'Return only valid JSON: {"score": <number 0-100>, "feedback": "<brief feedback in Japanese (日本語で)>"}',
    ].join("\n");

    const { data } = await llm.router.generateJson<{
      score?: unknown;
      feedback?: unknown;
    }>(
      user,
      {
        system,
        maxTokens: 256,
        temperature: 0.1,
        responseFormat: FREE_TEXT_SCORE_RESPONSE_SCHEMA,
      },
      "lightweight"
    );

    const score =
      typeof data.score === "number"
        ? Math.max(0, Math.min(100, Math.round(data.score)))
        : 50;
    const feedback =
      typeof data.feedback === "string" && data.feedback.trim().length > 0
        ? data.feedback
        : "回答を受け付けました。引き続き練習を続けましょう！";

    return { score, feedback };
  } catch (err) {
    console.error("[scoreParaphraseWithFeedback] failed:", err);
    return {
      score: 50,
      feedback: "回答を受け付けました。引き続き練習を続けましょう！",
    };
  }
}

/**
 * Score a free_text exercise using LLM and return both score and feedback.
 */
export async function scoreFreeTextWithFeedback(
  exercise: Exercise,
  answer: string,
  llm: LLMService
): Promise<{ score: number; feedback: string }> {
  try {
    const sanitizedAnswer = sanitizeForPrompt(answer);
    const sanitizedInstruction = sanitizeForPrompt(exercise.instruction ?? "");
    const context = exercise.prompt
      ? `\n\nExercise prompt: ${sanitizeForPrompt(exercise.prompt)}`
      : "";

    const system = [
      "You are an English writing evaluator for software engineers.",
      "Assess the given text for technical accuracy, grammar, clarity, and",
      "professional tone appropriate for engineering communication.",
      "Return a JSON object with fields:",
      "score (0-100) and feedback (string).",
    ].join(" ");

    const user = [
      "Evaluate the following response to a technical English exercise:",
      "",
      `Exercise instruction: ${sanitizedInstruction}${context}`,
      "",
      "---BEGIN USER RESPONSE---",
      sanitizedAnswer,
      "---END USER RESPONSE---",
      "",
      'Return only valid JSON: {"score": <number 0-100>, "feedback": "<brief feedback in Japanese (日本語で)>"}',
    ].join("\n");

    const { data } = await llm.router.generateJson<{
      score?: unknown;
      feedback?: unknown;
    }>(
      user,
      {
        system,
        maxTokens: 256,
        temperature: 0.1,
        responseFormat: FREE_TEXT_SCORE_RESPONSE_SCHEMA,
      },
      "lightweight"
    );

    const score =
      typeof data.score === "number"
        ? Math.max(0, Math.min(100, Math.round(data.score)))
        : 50;
    const feedback =
      typeof data.feedback === "string" && data.feedback.trim().length > 0
        ? data.feedback
        : "回答を受け付けました。引き続き練習を続けましょう！";

    return { score, feedback };
  } catch (err) {
    console.error("[scoreFreeTextWithFeedback] failed:", err);
    if (err instanceof Error) {
      console.error("[scoreFreeTextWithFeedback] message:", err.message);
    }
    return {
      score: 50,
      feedback: "回答を受け付けました。引き続き練習を続けましょう！",
    };
  }
}
