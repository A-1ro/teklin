import type { LLMService } from "../llm";
import type { Exercise, WarmupQuestion } from "@teklin/shared";

/**
 * Extract a JSON object from an LLM response that may include markdown fences
 * or surrounding prose (same logic as generator.ts).
 */
function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

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

/**
 * Score a free_text exercise using LLM and return both score and feedback.
 * Follows the same pattern as placement/scoring.ts scoreWriting.
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

    const response = await llm.router.generate(
      user,
      { system, maxTokens: 256, temperature: 0.1 },
      "lightweight"
    );

    // Extract JSON even if the model wraps it in markdown code fences
    const jsonText = extractJson(response.text);
    const result = JSON.parse(jsonText) as {
      score?: unknown;
      feedback?: unknown;
    };
    const score =
      typeof result.score === "number"
        ? Math.max(0, Math.min(100, Math.round(result.score)))
        : 50;
    const feedback =
      typeof result.feedback === "string" && result.feedback.trim().length > 0
        ? result.feedback
        : "回答を受け付けました。引き続き練習を続けましょう！";

    return { score, feedback };
  } catch (err) {
    console.error("[scoreFreeTextWithFeedback] failed:", err);
    return { score: 50, feedback: "回答を受け付けました。引き続き練習を続けましょう！" };
  }
}
