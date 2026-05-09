import type { LLMService } from "../llm";
import type {
  Level,
  Domain,
  SkillAxis,
  RewriteContext,
  LessonContentInternal,
  ExerciseType,
  ExercisePlan,
} from "@teklin/shared";
import type { LearnerProfile } from "./profile";

// All available context types
const ALL_CONTEXTS: RewriteContext[] = [
  "commit_message",
  "pr_comment",
  "github_issue",
  "slack",
  "general",
];

export interface GenerateOptions {
  level: Level;
  domain: Domain;
  weaknesses: SkillAxis[];
  completedLessonCount: number; // for fallback rotation
  previousNextPreview?: string; // wrapup.nextPreview from previous lesson
  /** Learner profile for personalization (null for first-time users) */
  profile: LearnerProfile | null;
}

// ---------------------------------------------------------------------------
// JSON Schema for structured output — forces LLM to return exact shape
// ---------------------------------------------------------------------------

const CHOICE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    text: { type: "string" },
  },
  required: ["id", "text"],
} as const;

const WARMUP_QUESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    phrase: { type: "string" },
    translation: { type: "string" },
    context: { type: "string" },
    type: { type: "string", enum: ["multiple_choice"] },
    choices: {
      type: "array",
      items: CHOICE_SCHEMA,
      minItems: 4,
      maxItems: 4,
    },
    correctChoiceId: { type: "string" },
  },
  required: [
    "id",
    "phrase",
    "translation",
    "context",
    "type",
    "choices",
    "correctChoiceId",
  ],
} as const;

const EXAMPLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    english: { type: "string" },
    japanese: { type: "string" },
    context: { type: "string" },
  },
  required: ["english", "japanese", "context"],
} as const;

const EXERCISE_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: {
      type: "string",
      enum: [
        "fill_in_blank",
        "reorder",
        "free_text",
        "error_correction",
        "paraphrase",
      ],
    },
    instruction: { type: "string" },
    sentence: { type: "string" },
    words: { type: "array", items: { type: "string" } },
    prompt: { type: "string" },
    correctAnswer: { type: "string" },
    acceptableAnswers: { type: "array", items: { type: "string" } },
    errorSentence: { type: "string" },
  },
  required: ["id", "type", "instruction"],
} as const;

/**
 * Build the lesson response schema dynamically based on exercise count.
 * The exercise count is driven by the ExercisePlan from planExercises().
 */
function buildLessonResponseSchema(exerciseCount: number) {
  return {
    type: "json_schema" as const,
    json_schema: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        warmup: {
          type: "object" as const,
          additionalProperties: false,
          properties: {
            questions: {
              type: "array" as const,
              items: WARMUP_QUESTION_SCHEMA,
              minItems: 3,
              maxItems: 3,
            },
          },
          required: ["questions"],
        },
        focus: {
          type: "object" as const,
          additionalProperties: false,
          properties: {
            phrase: { type: "string" as const },
            explanation: { type: "string" as const },
            examples: {
              type: "array" as const,
              items: EXAMPLE_SCHEMA,
              minItems: 3,
              maxItems: 3,
            },
            tips: {
              type: "array" as const,
              items: { type: "string" as const },
            },
          },
          required: ["phrase", "explanation", "examples", "tips"],
        },
        practice: {
          type: "object" as const,
          additionalProperties: false,
          properties: {
            exercises: {
              type: "array" as const,
              items: EXERCISE_SCHEMA,
              minItems: exerciseCount,
              maxItems: exerciseCount,
            },
          },
          required: ["exercises"],
        },
        wrapup: {
          type: "object" as const,
          additionalProperties: false,
          properties: {
            summary: { type: "string" as const },
            keyPoints: {
              type: "array" as const,
              items: { type: "string" as const },
            },
            nextPreview: { type: "string" as const },
          },
          required: ["summary", "keyPoints", "nextPreview"],
        },
      },
      required: ["warmup", "focus", "practice", "wrapup"],
    },
  };
}

// ---------------------------------------------------------------------------
// Shuffle utility (Fisher-Yates)
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleWarmupChoices(
  lesson: LessonContentInternal
): LessonContentInternal {
  return {
    ...lesson,
    warmup: {
      questions: lesson.warmup.questions.map((q) => ({
        ...q,
        choices: shuffleArray(q.choices),
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Validation (lightweight sanity check after schema-enforced output)
// ---------------------------------------------------------------------------

function isValidLesson(data: unknown): data is LessonContentInternal {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (!d.warmup || !d.focus || !d.practice || !d.wrapup) return false;

  const warmup = d.warmup as Record<string, unknown>;
  if (!Array.isArray(warmup.questions) || warmup.questions.length === 0) {
    return false;
  }

  return (warmup.questions as unknown[]).every((q) => {
    const question = q as Record<string, unknown>;
    if (!Array.isArray(question.choices) || question.choices.length === 0) {
      return false;
    }
    return (question.choices as unknown[]).every((ch) => {
      if (typeof ch !== "object" || ch === null) return false;
      const c = ch as Record<string, unknown>;
      return (
        typeof c.id === "string" &&
        typeof c.text === "string" &&
        c.text.length > 0
      );
    });
  });
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

export interface GenerateResult {
  content: LessonContentInternal;
  context: RewriteContext;
}

// ---------------------------------------------------------------------------
// Adaptive exercise planning — picks exercise types & count based on learner data
// ---------------------------------------------------------------------------

/** Base types available to all levels */
const BASE_TYPES: ExerciseType[] = ["fill_in_blank", "reorder", "free_text"];

/** Advanced types unlocked after enough data */
const ADVANCED_TYPES: ExerciseType[] = ["error_correction", "paraphrase"];

/** Minimum recorded attempts before we use adaptive logic */
const MIN_ATTEMPTS_FOR_ADAPTIVE = 5;

/** Default fixed plan for new users or insufficient data */
const DEFAULT_PLAN: ExercisePlan = {
  types: ["fill_in_blank", "reorder", "free_text"],
  rationale:
    "Default balanced plan — not enough exercise data for personalization yet.",
};

/**
 * Plan the exercise composition for a lesson based on the learner's
 * exercise-type performance, feedback trend, and level.
 *
 * Returns an ExercisePlan with the ordered list of types and a rationale.
 */
export function planExercises(
  profile: LearnerProfile | null,
  level: Level
): ExercisePlan {
  // New users or insufficient data → default plan
  if (!profile || profile.completedLessonCount < 3) {
    return DEFAULT_PLAN;
  }

  const perfMap = new Map(
    profile.exerciseTypePerformance.map((p) => [p.type, p])
  );

  // Check if we have enough aggregate attempts across all types
  const totalAttempts = profile.exerciseTypePerformance.reduce(
    (sum, p) => sum + p.attemptCount,
    0
  );
  if (totalAttempts < MIN_ATTEMPTS_FOR_ADAPTIVE) {
    return DEFAULT_PLAN;
  }

  const ft = profile.feedbackTrend;
  const isTooHard = ft.tooHard > ft.justRight && ft.tooHard > ft.tooEasy;
  const isTooEasy = ft.tooEasy > ft.justRight && ft.tooEasy > ft.tooHard;

  // Determine target exercise count (2–5)
  let targetCount = 3;
  if (isTooHard) {
    targetCount = 2; // reduce load
  } else if (isTooEasy) {
    targetCount = 4; // increase challenge
  } else if (level === "L4") {
    targetCount = 4; // advanced users get more variety
  }

  // Build candidate pool: base types always, advanced types if L3+ or too_easy
  const candidateTypes = [...BASE_TYPES];
  if (level === "L3" || level === "L4" || isTooEasy) {
    candidateTypes.push(...ADVANCED_TYPES);
  }

  // Score each type: lower avg score → higher weight (needs more practice)
  // Types never attempted → high priority
  const weighted = candidateTypes.map((type) => {
    const perf = perfMap.get(type);
    if (!perf) {
      // Never practiced → high weight, but cap it for new advanced types
      return { type, weight: ADVANCED_TYPES.includes(type) ? 2.0 : 2.5 };
    }
    // Score 100 → weight 0.5 (still possible), Score 0 → weight 2.5
    const weight = 0.5 + (100 - perf.avgScore) / 50;
    return { type, weight };
  });

  // If too_hard, boost easier types (fill_in_blank, reorder) and suppress free_text / advanced
  if (isTooHard) {
    for (const w of weighted) {
      if (w.type === "fill_in_blank" || w.type === "reorder") {
        w.weight *= 1.5;
      } else if (ADVANCED_TYPES.includes(w.type)) {
        w.weight *= 0.3;
      }
    }
  }

  // If too_easy, boost advanced types and suppress basic ones user already aces
  if (isTooEasy) {
    for (const w of weighted) {
      if (ADVANCED_TYPES.includes(w.type)) {
        w.weight *= 1.8;
      }
      const perf = perfMap.get(w.type);
      if (perf && perf.avgScore >= 90) {
        w.weight *= 0.5; // de-prioritize mastered types
      }
    }
  }

  // Weighted selection without replacement
  const selected: ExerciseType[] = [];
  const pool = [...weighted];

  for (let i = 0; i < targetCount && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosenIdx = pool.length - 1;
    for (let j = 0; j < pool.length; j++) {
      rand -= pool[j].weight;
      if (rand <= 0) {
        chosenIdx = j;
        break;
      }
    }
    selected.push(pool[chosenIdx].type);
    pool.splice(chosenIdx, 1);
  }

  // Ensure at least one basic type is always included (for grounding)
  const hasBasic = selected.some((t) => BASE_TYPES.includes(t));
  if (!hasBasic && selected.length > 0) {
    selected[selected.length - 1] = "fill_in_blank";
  }

  // Build rationale
  const parts: string[] = [];
  if (isTooHard) parts.push("Simplified: user finds lessons difficult");
  if (isTooEasy) parts.push("Increased challenge: user finds lessons easy");
  const weak = weighted
    .filter((w) => {
      const perf = perfMap.get(w.type);
      return perf && perf.avgScore < 60 && selected.includes(w.type);
    })
    .map((w) => w.type);
  if (weak.length > 0) {
    parts.push(`Reinforcing weak types: ${weak.join(", ")}`);
  }
  const rationale =
    parts.length > 0
      ? parts.join(". ") + "."
      : `Adaptive plan for ${level} learner with ${totalAttempts} recorded answers.`;

  return { types: selected, rationale };
}

// ---------------------------------------------------------------------------
// Smart context selection — picks the best context based on learner data
// ---------------------------------------------------------------------------

function selectContext(options: GenerateOptions): RewriteContext {
  const profile = options.profile;

  // Fallback to simple rotation for new users
  if (!profile || profile.completedLessonCount < 3) {
    return ALL_CONTEXTS[options.completedLessonCount % ALL_CONTEXTS.length];
  }

  // Avoid contexts used in the last 2 lessons to ensure variety
  const recentSet = new Set(profile.recentContexts.slice(0, 2));
  const candidates = ALL_CONTEXTS.filter((c) => !recentSet.has(c));

  // If all contexts were recently used, allow any
  const pool = candidates.length > 0 ? candidates : ALL_CONTEXTS;

  // Weighted selection: lower-scoring contexts get higher weight
  const perfMap = new Map(
    profile.contextPerformance.map((cp) => [cp.context, cp])
  );

  const weighted = pool.map((ctx) => {
    const perf = perfMap.get(ctx);
    if (!perf) {
      // Never practiced — high priority
      return { ctx, weight: 3.0 };
    }
    // Lower scores → higher weight (invert and scale)
    // Score 100 → weight 1.0, Score 0 → weight 2.0
    const scoreWeight = 1.0 + (100 - perf.avgScore) / 100;
    // Fewer lessons in this context → slightly higher weight
    const countWeight = perf.lessonCount < 3 ? 1.3 : 1.0;
    return { ctx, weight: scoreWeight * countWeight };
  });

  // Pick based on weighted random selection
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const { ctx, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) return ctx;
  }

  return weighted[weighted.length - 1].ctx;
}

// ---------------------------------------------------------------------------
// Serialize learner profile to a compact text block for LLM prompt
// ---------------------------------------------------------------------------

function formatProfileForPrompt(profile: LearnerProfile | null): string {
  if (!profile || profile.completedLessonCount === 0) {
    return "New user — no learning history yet. Create a welcoming first lesson.";
  }

  const lines: string[] = [];

  // Overall stats
  lines.push(
    `Completed lessons: ${profile.completedLessonCount}, Overall avg score: ${profile.overallAvgScore}/100`
  );

  // Feedback trend
  const ft = profile.feedbackTrend;
  const totalFeedback = ft.tooEasy + ft.justRight + ft.tooHard;
  if (totalFeedback > 0) {
    lines.push(
      `Difficulty feedback (last ${totalFeedback} lessons): ${ft.tooEasy} too_easy, ${ft.justRight} just_right, ${ft.tooHard} too_hard`
    );
    if (ft.tooHard > ft.justRight) {
      lines.push(
        "→ User finds lessons DIFFICULT. Simplify vocabulary and sentences."
      );
    } else if (ft.tooEasy > ft.justRight) {
      lines.push("→ User finds lessons EASY. Increase complexity and nuance.");
    }
  }

  // Context performance
  if (profile.contextPerformance.length > 0) {
    lines.push("Performance by context:");
    for (const cp of profile.contextPerformance) {
      lines.push(
        `  - ${cp.context}: ${cp.lessonCount} lessons, avg score ${cp.avgScore}/100`
      );
    }
    if (profile.weakestContext) {
      lines.push(`→ Weakest context: ${profile.weakestContext}`);
    }
  }

  // Placement weaknesses
  if (profile.placementWeaknesses.length > 0) {
    lines.push(
      `Placement test weaknesses: ${profile.placementWeaknesses.join(", ")}`
    );
  }

  // SRS snapshot
  const srs = profile.srs;
  if (srs.totalCards > 0) {
    lines.push(
      `SRS cards: ${srs.totalCards} total, ${srs.masteredCards} mastered, ${srs.strugglingCards} struggling, ${srs.overdueCards} overdue`
    );
    if (srs.strugglingPhrases.length > 0) {
      lines.push(
        `Struggling phrases: ${srs.strugglingPhrases.map((p) => `"${p}"`).join(", ")}`
      );
      lines.push(
        "→ Try to reinforce these phrases by using similar patterns in warmup or practice"
      );
    }
  }

  // Recent focus phrases to avoid
  if (profile.recentFocusPhrases.length > 0) {
    lines.push(
      `Recent focus phrases (AVOID repeating): ${profile.recentFocusPhrases.map((p) => `"${p}"`).join(", ")}`
    );
  }

  // Exercise type performance
  if (profile.exerciseTypePerformance.length > 0) {
    lines.push("Performance by exercise type:");
    for (const ep of profile.exerciseTypePerformance) {
      lines.push(
        `  - ${ep.type}: ${ep.attemptCount} attempts, avg score ${ep.avgScore}/100`
      );
    }
    const weakest = [...profile.exerciseTypePerformance].sort(
      (a, b) => a.avgScore - b.avgScore
    );
    if (weakest.length > 0 && weakest[0].avgScore < 70) {
      lines.push(`→ Weakest exercise type: ${weakest[0].type}`);
    }
  }

  // Rewrite activity
  if (profile.rewrites.totalRewrites > 0) {
    const ctxEntries = Object.entries(profile.rewrites.contextCounts);
    if (ctxEntries.length > 0) {
      const rewriteSummary = ctxEntries
        .map(([ctx, n]) => `${ctx}: ${n}`)
        .join(", ");
      lines.push(`Rewrite activity: ${rewriteSummary}`);
    }
  }

  // Focus phrase appearance history (for context only)
  if (profile.focusHistory.length > 0) {
    lines.push("For your reference only — past appearances of focus phrases:");
    for (const fh of profile.focusHistory) {
      const entries = fh.appearances
        .map(
          (a) =>
            `[${a.date.slice(0, 10)} ${a.context}/${a.domain}/${a.viewpoint} (${a.exerciseTypes.join(",")})]`
        )
        .join(" ");
      lines.push(
        `  - "${fh.phrase}": ${entries} × ${fh.appearances.length} entries`
      );
    }
  }

  return lines.join("\n");
}

/** Generate a personalized daily lesson using LLM */
export async function generateLesson(
  llm: LLMService,
  options: GenerateOptions
): Promise<GenerateResult> {
  const context = selectContext(options);
  const exercisePlan = planExercises(options.profile, options.level);

  // Build the exercise composition description for the prompt
  const compositionLines = exercisePlan.types.map(
    (type, i) => `Exercise ${i + 1}: ${type}`
  );
  const exerciseComposition = compositionLines.join("\n      ");

  const weaknessText =
    options.weaknesses.length > 0 ? options.weaknesses.join(", ") : "general";

  const { system, user } = llm.prompts.render(
    llm.prompts.templates.daily_lesson,
    {
      level: options.level,
      domain: options.domain,
      context,
      weaknesses: weaknessText,
      previousNextPreview: options.previousNextPreview ?? "",
      learnerProfile: formatProfileForPrompt(options.profile),
      exerciseComposition,
      exerciseRationale: exercisePlan.rationale,
    }
  );

  const responseSchema = buildLessonResponseSchema(exercisePlan.types.length);

  try {
    const { data } = await llm.router.generateJson<unknown>(
      user,
      {
        system,
        temperature: 0.7,
        maxTokens: 3000,
        responseFormat: responseSchema,
      },
      "quality"
    );

    if (!isValidLesson(data)) {
      console.error(
        "[generateLesson] Validation failed after schema-enforced output.",
        "warmup questions:",
        JSON.stringify(
          (data as Record<string, unknown>).warmup,
          null,
          0
        )?.slice(0, 300)
      );
      throw new Error("LLM output failed validation");
    }

    const lesson = data;

    // Fill in defaults & derive reorder words from correctAnswer
    lesson.practice.exercises = lesson.practice.exercises.map((e, i) => ({
      id: e.id ?? `p${i + 1}`,
      type: e.type ?? "free_text",
      instruction: e.instruction ?? "",
      sentence: e.sentence,
      words:
        e.type === "reorder" && e.correctAnswer
          ? shuffleArray(e.correctAnswer.split(/\s+/))
          : e.words,
      prompt: e.prompt,
      correctAnswer: e.correctAnswer,
      acceptableAnswers: e.acceptableAnswers,
      errorSentence: e.errorSentence,
    }));

    console.log("[generateLesson] Successfully generated lesson from LLM");
    return { content: shuffleWarmupChoices(lesson), context };
  } catch (err) {
    console.error("[generateLesson] Failed to generate lesson:", err);
    throw err;
  }
}
