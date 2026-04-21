import type { LLMService } from "../llm";
import type {
  Level,
  Domain,
  SkillAxis,
  RewriteContext,
  LessonContentInternal,
  WarmupQuestion,
  Exercise,
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
    type: { type: "string", enum: ["fill_in_blank", "reorder", "free_text"] },
    instruction: { type: "string" },
    sentence: { type: "string" },
    words: { type: "array", items: { type: "string" } },
    prompt: { type: "string" },
    correctAnswer: { type: "string" },
    acceptableAnswers: { type: "array", items: { type: "string" } },
  },
  required: ["id", "type", "instruction"],
} as const;

const LESSON_RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      warmup: {
        type: "object",
        additionalProperties: false,
        properties: {
          questions: {
            type: "array",
            items: WARMUP_QUESTION_SCHEMA,
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["questions"],
      },
      focus: {
        type: "object",
        additionalProperties: false,
        properties: {
          phrase: { type: "string" },
          explanation: { type: "string" },
          examples: {
            type: "array",
            items: EXAMPLE_SCHEMA,
            minItems: 3,
            maxItems: 3,
          },
          tips: { type: "array", items: { type: "string" } },
        },
        required: ["phrase", "explanation", "examples", "tips"],
      },
      practice: {
        type: "object",
        additionalProperties: false,
        properties: {
          exercises: {
            type: "array",
            items: EXERCISE_SCHEMA,
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["exercises"],
      },
      wrapup: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          keyPoints: { type: "array", items: { type: "string" } },
          nextPreview: { type: "string" },
        },
        required: ["summary", "keyPoints", "nextPreview"],
      },
    },
    required: ["warmup", "focus", "practice", "wrapup"],
  },
} as const;

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
// Fallback lesson
// ---------------------------------------------------------------------------

function buildFallbackLesson(
  level: Level,
  domain: Domain,
  context: RewriteContext
): LessonContentInternal {
  const domainExamples: Record<Domain, string> = {
    web: "Fix button alignment in the login form",
    infra: "Update Kubernetes deployment config",
    ml: "Improve model training pipeline",
    mobile: "Fix crash on app startup",
  };

  const example = domainExamples[domain];

  const warmupQuestions: WarmupQuestion[] = [
    {
      id: "w1",
      phrase: "Fix the null pointer exception in the user service",
      translation: "ユーザーサービスのnullポインタ例外を修正する",
      context: "Used in commit messages to indicate a bug fix",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "ユーザーサービスのnullポインタ例外を修正する" },
        { id: "b", text: "ユーザーサービスにnullポインタの例外処理を追加する" },
        { id: "c", text: "nullポインタ例外が発生するユーザーサービスを修正する" },
        { id: "d", text: "ユーザーサービスのnullポインタ例外を調査する" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "Add pagination to the search results page",
      translation: "検索結果ページにページネーションを追加する",
      context: "Used in commit messages to indicate new functionality",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "検索結果ページのページネーションを修正する" },
        { id: "b", text: "検索結果ページにページネーションを追加する" },
        { id: "c", text: "検索結果のページネーション機能を改善する" },
        { id: "d", text: "ページネーション付きの検索結果ページを追加する" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "w3",
      phrase: "Refactor the authentication module without changing its API",
      translation: "APIを変えずに認証モジュールをリファクタリングする",
      context: "Used when restructuring code without changing behavior",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "認証モジュールのAPIを変更してリファクタリングする" },
        { id: "b", text: "認証モジュールとAPIの両方をリファクタリングする" },
        { id: "c", text: "APIを変えずに認証モジュールをリファクタリングする" },
        { id: "d", text: "認証モジュールのAPI変更に合わせてリファクタリングする" },
      ],
      correctChoiceId: "c",
    },
  ];

  const exercises: Exercise[] = [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しい動詞を入れよう。",
      sentence: `___ the ${context === "commit_message" ? "bug in" : "issue with"} ${example.toLowerCase()}`,
      correctAnswer:
        context === "commit_message" ? "Fix" : "Resolve",
      acceptableAnswers: ["Fix", "Resolve", "Address"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコミットメッセージを作ろう。",
      words: ["button", "Fix", "alignment", "login", "the"],
      correctAnswer: "Fix the login button alignment",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "この変更に対するコミットメッセージを英語で書こう。",
      prompt: domain === "web"
        ? "サインアップページのCSSのレイアウト崩れを修正しました。"
        : "デプロイ設定ファイルを最新の環境に合わせて更新しました。",
    },
  ];

  return {
    warmup: { questions: warmupQuestions },
    focus: {
      phrase: "Fix <specific issue>",
      explanation:
        "Use the imperative mood in commit messages. Start with a verb like 'Fix', 'Add', 'Update', or 'Remove'. This is the standard convention in most open-source projects.",
      examples: [
        {
          english: "Fix null pointer exception in user service",
          japanese: "ユーザーサービスのnullポインタ例外を修正",
          context: "commit_message",
        },
        {
          english: "Add pagination to the search results",
          japanese: "検索結果にページネーションを追加",
          context: "commit_message",
        },
        {
          english: "Update dependencies to resolve security vulnerabilities",
          japanese: "セキュリティ脆弱性を解決するため依存関係を更新",
          context: "commit_message",
        },
      ],
      tips: [
        "Use the imperative mood: 'Fix' not 'Fixed' or 'Fixes'",
        "Keep the subject line under 50 characters",
      ],
    },
    practice: { exercises },
    wrapup: {
      summary: `命令形の動詞を使った${context === "commit_message" ? "コミットメッセージ" : context === "pr_comment" ? "PRコメント" : "技術英語"}の書き方を練習しました。`,
      keyPoints: [
        "命令形を使う（Fix, Add, Update など過去形・進行形はNG）",
        "何を変えたか具体的に書く",
        "簡潔・明確に",
      ],
      nextPreview: `次回：${level === "L1" || level === "L2" ? "PR の説明文の書き方" : "技術ドキュメントの書き方"}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

export interface GenerateResult {
  content: LessonContentInternal;
  context: RewriteContext;
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
      lines.push("→ User finds lessons DIFFICULT. Simplify vocabulary and sentences.");
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

  return lines.join("\n");
}

/** Generate a personalized daily lesson using LLM */
export async function generateLesson(
  llm: LLMService,
  options: GenerateOptions
): Promise<GenerateResult> {
  const context = selectContext(options);

  const weaknessText =
    options.weaknesses.length > 0
      ? options.weaknesses.join(", ")
      : "general";

  const { system, user } = llm.prompts.render(
    llm.prompts.templates.daily_lesson,
    {
      level: options.level,
      domain: options.domain,
      context,
      weaknesses: weaknessText,
      previousNextPreview: options.previousNextPreview ?? "",
      learnerProfile: formatProfileForPrompt(options.profile),
    }
  );

  try {
    const { data } = await llm.router.generateJson<unknown>(
      user,
      {
        system,
        temperature: 0.7,
        maxTokens: 3000,
        responseFormat: LESSON_RESPONSE_SCHEMA,
      },
      "quality"
    );

    if (!isValidLesson(data)) {
      console.error(
        "[generateLesson] Validation failed after schema-enforced output, using fallback.",
        "warmup questions:",
        JSON.stringify(
          (data as Record<string, unknown>).warmup,
          null,
          0
        )?.slice(0, 300)
      );
      return {
        content: shuffleWarmupChoices(
          buildFallbackLesson(options.level, options.domain, context)
        ),
        context,
      };
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
    }));

    console.log("[generateLesson] Successfully generated lesson from LLM");
    return { content: shuffleWarmupChoices(lesson), context };
  } catch (err) {
    console.error("[generateLesson] Failed to generate lesson:", err);
    return {
      content: shuffleWarmupChoices(
        buildFallbackLesson(options.level, options.domain, context)
      ),
      context,
    };
  }
}
