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

// Context types to rotate through lessons
const CONTEXTS: RewriteContext[] = [
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
  completedLessonCount: number; // for rotation
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
      phrase: "fix",
      translation: "修正する",
      context: "Used in commit messages to indicate a bug fix",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "修正する" },
        { id: "b", text: "追加する" },
        { id: "c", text: "削除する" },
        { id: "d", text: "更新する" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "add",
      translation: "追加する",
      context: "Used in commit messages to indicate new functionality",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "修正する" },
        { id: "b", text: "追加する" },
        { id: "c", text: "削除する" },
        { id: "d", text: "リファクタリングする" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "w3",
      phrase: "refactor",
      translation: "リファクタリングする",
      context: "Used when restructuring code without changing behavior",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "バグを修正する" },
        { id: "b", text: "新機能を追加する" },
        { id: "c", text: "リファクタリングする" },
        { id: "d", text: "テストを追加する" },
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

/** Generate a personalized daily lesson using LLM */
export async function generateLesson(
  llm: LLMService,
  options: GenerateOptions
): Promise<GenerateResult> {
  const contextIndex = options.completedLessonCount % CONTEXTS.length;
  const context = CONTEXTS[contextIndex];

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
        content: buildFallbackLesson(options.level, options.domain, context),
        context,
      };
    }

    const lesson = data;

    // Fill in defaults for optional exercise fields
    lesson.practice.exercises = lesson.practice.exercises.map((e, i) => ({
      id: e.id ?? `p${i + 1}`,
      type: e.type ?? "free_text",
      instruction: e.instruction ?? "",
      sentence: e.sentence,
      words: e.words,
      prompt: e.prompt,
      correctAnswer: e.correctAnswer,
      acceptableAnswers: e.acceptableAnswers,
    }));

    console.log("[generateLesson] Successfully generated lesson from LLM");
    return { content: lesson, context };
  } catch (err) {
    console.error("[generateLesson] Failed to generate lesson:", err);
    return {
      content: buildFallbackLesson(options.level, options.domain, context),
      context,
    };
  }
}
