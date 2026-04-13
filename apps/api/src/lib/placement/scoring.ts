import type { Level, SkillAxis } from "@teklin/shared";
import type { PlacementAnswerRecord } from "../../kv";
import type { LLMService } from "../llm";
import { PLACEMENT_QUESTIONS } from "./questions";

/** Score a multiple-choice answer (0 or 100) */
export function scoreMultipleChoice(
  questionId: string,
  answer: string
): number {
  const q = PLACEMENT_QUESTIONS.find((q) => q.id === questionId);
  if (!q || !q.correctChoiceId) return 0;
  return answer === q.correctChoiceId ? 100 : 0;
}

/** Score a writing answer using LLM (0-100) */
export async function scoreWriting(
  questionId: string,
  answer: string,
  llm: LLMService
): Promise<number> {
  const q = PLACEMENT_QUESTIONS.find((q) => q.id === questionId);
  if (!q) return 0;

  const { system, user } = llm.prompts.render(
    llm.prompts.templates.placement,
    { text: answer }
  );

  const response = await llm.router.generate(
    user,
    { system, maxTokens: 256, temperature: 0.1 },
    "quality"
  );

  try {
    const result = JSON.parse(response.text) as { score?: unknown };
    const score = typeof result.score === "number" ? result.score : 0;
    return Math.max(0, Math.min(100, score));
  } catch {
    return 50; // fallback if LLM returns invalid JSON
  }
}

/** Calculate per-axis scores from answers */
export function calculateAxisScores(
  answers: PlacementAnswerRecord[]
): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ["reading", "writing", "vocabulary", "nuance"];
  const scores = {} as Record<SkillAxis, number>;

  for (const axis of axes) {
    const axisAnswers = answers.filter((a) => a.axis === axis);
    if (axisAnswers.length === 0) {
      scores[axis] = 0;
      continue;
    }
    // Weight by difficulty: easy=1, medium=2, hard=3
    let weightedSum = 0;
    let totalWeight = 0;
    for (const a of axisAnswers) {
      weightedSum += a.score * a.difficulty;
      totalWeight += a.difficulty;
    }
    scores[axis] = Math.round(weightedSum / totalWeight);
  }

  return scores;
}

/** Determine level from axis scores */
export function determineLevel(scores: Record<SkillAxis, number>): Level {
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
  if (avg < 30) return "L1";
  if (avg < 55) return "L2";
  if (avg < 80) return "L3";
  return "L4";
}

/** Identify weak axes (below threshold score of 50) */
export function identifyWeaknesses(
  scores: Record<SkillAxis, number>
): SkillAxis[] {
  const threshold = 50;
  return (Object.entries(scores) as [SkillAxis, number][])
    .filter(([, score]) => score < threshold)
    .sort(([, a], [, b]) => a - b)
    .map(([axis]) => axis);
}
