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

/**
 * Extract JSON from LLM response text.
 * Handles ```json blocks and stray text around the JSON object.
 */
function extractJson(text: string): string {
  // Try to extract from ```json ... ``` block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find a top-level JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text.trim();
}

/** Check that the basic top-level sections exist (before normalization) */
function hasBasicLessonStructure(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (!d.warmup || !d.focus || !d.practice || !d.wrapup) return false;

  const warmup = d.warmup as Record<string, unknown>;
  if (!Array.isArray(warmup.questions) || warmup.questions.length === 0) {
    return false;
  }

  const focus = d.focus as Record<string, unknown>;
  if (
    typeof focus.phrase !== "string" ||
    typeof focus.explanation !== "string"
  ) {
    return false;
  }

  const practice = d.practice as Record<string, unknown>;
  if (
    !Array.isArray(practice.exercises) ||
    practice.exercises.length === 0
  ) {
    return false;
  }

  return true;
}

/** Validate that all warmup questions have properly structured choices */
function hasValidWarmupChoices(lesson: LessonContentInternal): boolean {
  return lesson.warmup.questions.every(
    (q) =>
      q.choices.length > 0 &&
      q.choices.every(
        (ch) => typeof ch.id === "string" && typeof ch.text === "string" && ch.text.length > 0
      )
  );
}

/** Build a fallback lesson when LLM generation fails */
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

/** Generate a personalized daily lesson using LLM */
export async function generateLesson(
  llm: LLMService,
  options: GenerateOptions
): Promise<LessonContentInternal> {
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
    const response = await llm.router.generate(
      user,
      { system, temperature: 0.7, maxTokens: 3000 },
      "quality"
    );

    const jsonText = extractJson(response.text);
    const parsed: unknown = JSON.parse(jsonText);

    // Step 1: Basic structure check (sections exist)
    if (!hasBasicLessonStructure(parsed)) {
      console.error(
        "[generateLesson] LLM response failed basic structure check, using fallback"
      );
      return buildFallbackLesson(options.level, options.domain, context);
    }

    // Step 2: Normalize warmup choices (handle strings, missing id/text, etc.)
    const lesson = parsed as LessonContentInternal;
    const CHOICE_IDS = ["a", "b", "c", "d"];
    lesson.warmup.questions = lesson.warmup.questions.map((q, i) => {
      let normalizedChoices: { id: string; text: string }[] = [];

      if (Array.isArray(q.choices)) {
        normalizedChoices = (q.choices as unknown[]).map((ch, ci) => {
          if (typeof ch === "object" && ch !== null) {
            const obj = ch as Record<string, unknown>;
            return {
              id:
                typeof obj.id === "string"
                  ? obj.id
                  : (CHOICE_IDS[ci] ?? `c${ci}`),
              text:
                typeof obj.text === "string"
                  ? obj.text
                  : String(
                      obj.text ?? obj.label ?? obj.value ?? ""
                    ),
            };
          }
          // Choice is a plain string — wrap it
          return { id: CHOICE_IDS[ci] ?? `c${ci}`, text: String(ch) };
        });
      }

      return {
        id: q.id ?? `w${i + 1}`,
        phrase: q.phrase ?? "",
        translation: q.translation ?? "",
        context: q.context ?? "",
        type: "multiple_choice" as const,
        choices: normalizedChoices,
        correctChoiceId: q.correctChoiceId ?? "",
      };
    });

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

    // Step 3: Validate choices AFTER normalization
    if (!hasValidWarmupChoices(lesson)) {
      console.error(
        "[generateLesson] Warmup choices invalid after normalization, using fallback"
      );
      return buildFallbackLesson(options.level, options.domain, context);
    }

    return lesson;
  } catch (err) {
    console.error("[generateLesson] Failed to generate lesson:", err);
    return buildFallbackLesson(options.level, options.domain, context);
  }
}
