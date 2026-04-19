#!/usr/bin/env npx tsx
/**
 * generate-lessons.ts
 *
 * Generates lesson JSON to stdout using static content templates.
 * No LLM calls — 12 static patterns (3 domains × 4 levels).
 *
 * Usage:
 *   npx tsx scripts/generate-lessons.ts --level L1 --domain web --count 1
 */

import type {
  Level,
  Domain,
  LessonContentInternal,
  WarmupQuestion,
  FocusContent,
  Exercise,
  WrapupContent,
} from "../packages/shared/src/index.js";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { level: Level; domain: Domain; count: number } {
  const args = process.argv.slice(2);
  let level: Level = "L1";
  let domain: Domain = "web";
  let count = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) {
      const val = args[++i];
      if (!["L1", "L2", "L3", "L4"].includes(val)) {
        console.error(`Invalid level: ${val}. Must be L1, L2, L3, or L4.`);
        process.exit(1);
      }
      level = val as Level;
    } else if (args[i] === "--domain" && args[i + 1]) {
      const val = args[++i];
      if (!["web", "infra", "ml"].includes(val)) {
        console.error(`Invalid domain: ${val}. Must be web, infra, or ml.`);
        process.exit(1);
      }
      domain = val as Domain;
    } else if (args[i] === "--count" && args[i + 1]) {
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val < 1) {
        console.error("--count must be a positive integer.");
        process.exit(1);
      }
      count = val;
    }
  }

  return { level, domain, count };
}

// ---------------------------------------------------------------------------
// Static content templates: 3 domains × 4 levels = 12 patterns
// ---------------------------------------------------------------------------

type DomainLevel = `${Domain}-${Level}`;

const WARMUP_QUESTIONS: Record<DomainLevel, WarmupQuestion[]> = {
  // ---- web × L1 ----
  "web-L1": [
    {
      id: "w1",
      phrase: "fix",
      translation: "修正する",
      context: "Used in commit messages to indicate a bug fix",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "Fix login button alignment" },
        { id: "b", text: "Fixed the login button alignment" },
        { id: "c", text: "Fixing login button alignment" },
        { id: "d", text: "Have fixed login button alignment" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "LGTM",
      translation: "承認、問題なし",
      context: "Used in PR comments to approve a pull request",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "Looks great to me" },
        { id: "b", text: "Looks good to me" },
        { id: "c", text: "Let's get to merging" },
        { id: "d", text: "Let go to main" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "w3",
      phrase: "feat",
      translation: "新機能",
      context: "Conventional commit prefix for a new feature",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "feat: add user profile page" },
        { id: "b", text: "feature: add user profile page" },
        { id: "c", text: "new: add user profile page" },
        { id: "d", text: "add: user profile page" },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- web × L2 ----
  "web-L2": [
    {
      id: "w1",
      phrase: "nit",
      translation: "細かい指摘",
      context: "Used in PR comments for minor, non-blocking suggestions",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "nit: prefer const over let here" },
        { id: "b", text: "small: prefer const over let here" },
        { id: "c", text: "minor: prefer const over let here" },
        { id: "d", text: "detail: prefer const over let here" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "refactor",
      translation: "リファクタリングする",
      context: "Restructuring code without changing behavior",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "refactor: Extract validation logic into helper" },
        { id: "b", text: "refactor: extracted validation logic into helper" },
        { id: "c", text: "refactor: extracting validation logic into helper" },
        { id: "d", text: "refactor: validation logic extraction" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "Blocking",
      translation: "ブロッカー",
      context: "PR comment indicating a must-fix issue before merging",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "Blocking: this will cause issues in production" },
        { id: "b", text: "Block: this will cause issues in production" },
        { id: "c", text: "Blocker: this will cause issues in production" },
        { id: "d", text: "Blocked: this will cause issues in production" },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- web × L3 ----
  "web-L3": [
    {
      id: "w1",
      phrase: "race condition",
      translation: "競合状態",
      context: "A bug caused by timing issues in concurrent operations",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "fix: resolve race condition in async handler",
        },
        {
          id: "b",
          text: "fix: resolve concurrent condition in async handler",
        },
        {
          id: "c",
          text: "fix: resolve timing issue in async handler",
        },
        {
          id: "d",
          text: "fix: resolve thread issue in async handler",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "discriminated union",
      translation: "判別可能なユニオン型",
      context: "TypeScript pattern for type-safe variants",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "Consider using a discriminated union for better type safety",
        },
        {
          id: "b",
          text: "Consider using a union type for better type safety",
        },
        {
          id: "c",
          text: "Consider using a tagged union for better type safety",
        },
        {
          id: "d",
          text: "Consider using a closed union for better type safety",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "silently swallow",
      translation: "サイレントに無視する",
      context: "Catching exceptions without re-throwing or logging",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This could silently swallow exceptions",
        },
        {
          id: "b",
          text: "This could quietly ignore exceptions",
        },
        {
          id: "c",
          text: "This could secretly hide exceptions",
        },
        {
          id: "d",
          text: "This could softly eat exceptions",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- web × L4 ----
  "web-L4": [
    {
      id: "w1",
      phrase: "leaks the abstraction",
      translation: "抽象化が漏れている",
      context: "When implementation details bleed through an interface",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This leaks the abstraction — callers should not need to know about the underlying implementation",
        },
        {
          id: "b",
          text: "This breaks the abstraction — callers should not need to know about the underlying implementation",
        },
        {
          id: "c",
          text: "This exposes the abstraction — callers should not need to know about the underlying implementation",
        },
        {
          id: "d",
          text: "This violates the abstraction — callers should not need to know about the underlying implementation",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "temporal coupling",
      translation: "時間的結合",
      context: "Hidden dependency on execution order",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This is an implicit temporal coupling that will bite us later",
        },
        {
          id: "b",
          text: "This is an implicit sequential coupling that will bite us later",
        },
        {
          id: "c",
          text: "This is an implicit order coupling that will bite us later",
        },
        {
          id: "d",
          text: "This is an implicit time coupling that will bite us later",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "idempotency",
      translation: "べき等性",
      context: "Property where repeated operations produce the same result",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "fix: ensure idempotency of payment webhook handler",
        },
        {
          id: "b",
          text: "fix: ensure idempotence of payment webhook handler",
        },
        {
          id: "c",
          text: "fix: ensure repeatability of payment webhook handler",
        },
        {
          id: "d",
          text: "fix: ensure consistency of payment webhook handler",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- infra × L1 ----
  "infra-L1": [
    {
      id: "w1",
      phrase: "chore: bump dependencies",
      translation: "依存関係のバージョンを更新",
      context: "Routine dependency upgrades",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "chore: bump dependencies" },
        { id: "b", text: "chore: update dependencies" },
        { id: "c", text: "chore: upgrade dependencies" },
        { id: "d", text: "chore: fix dependencies" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "Heads up",
      translation: "念のためお知らせします",
      context: "Slack message to alert teammates proactively",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "Heads up — the staging environment will be down for maintenance",
        },
        {
          id: "b",
          text: "Notice — the staging environment will be down for maintenance",
        },
        {
          id: "c",
          text: "Alert — the staging environment will be down for maintenance",
        },
        {
          id: "d",
          text: "Warning — the staging environment will be down for maintenance",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "FYI",
      translation: "参考までに",
      context: "Sharing information without requiring action",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "FYI, I pushed a hotfix to production" },
        { id: "b", text: "For information, I pushed a hotfix to production" },
        {
          id: "c",
          text: "For your information, I pushed a hotfix to production",
        },
        { id: "d", text: "Note, I pushed a hotfix to production" },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- infra × L2 ----
  "infra-L2": [
    {
      id: "w1",
      phrase: "ci: add GitHub Actions workflow",
      translation: "GitHub Actionsワークフローを追加",
      context: "Setting up CI/CD pipeline",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "ci: add GitHub Actions workflow for deployment",
        },
        {
          id: "b",
          text: "ci: added GitHub Actions workflow for deployment",
        },
        {
          id: "c",
          text: "ci: adding GitHub Actions workflow for deployment",
        },
        {
          id: "d",
          text: "ci: GitHub Actions workflow for deployment added",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "Pinging you for visibility",
      translation: "認識共有のためにピンしています",
      context: "Slack message to inform someone without requiring action",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "Pinging you for visibility — this incident is affecting 5% of users",
        },
        {
          id: "b",
          text: "Tagging you for visibility — this incident is affecting 5% of users",
        },
        {
          id: "c",
          text: "Notifying you for visibility — this incident is affecting 5% of users",
        },
        {
          id: "d",
          text: "Alerting you for visibility — this incident is affecting 5% of users",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "This only occurs in production",
      translation: "これは本番環境でのみ発生します",
      context: "Reporting an environment-specific bug",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This only occurs in production, not staging",
        },
        {
          id: "b",
          text: "This only happens in production, not staging",
        },
        {
          id: "c",
          text: "This only appears in production, not staging",
        },
        {
          id: "d",
          text: "This only shows in production, not staging",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- infra × L3 ----
  "infra-L3": [
    {
      id: "w1",
      phrase: "retry with exponential backoff",
      translation: "指数バックオフによるリトライ",
      context: "Retry strategy with increasing delays",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "feat: implement retry with exponential backoff",
        },
        {
          id: "b",
          text: "feat: implement retry with linear backoff",
        },
        {
          id: "c",
          text: "feat: implement retry with constant backoff",
        },
        {
          id: "d",
          text: "feat: implement retry with progressive backoff",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "not resilient to partial failures",
      translation: "部分的な障害に耐性がない",
      context: "Code review comment about error handling",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This is not resilient to partial failures",
        },
        {
          id: "b",
          text: "This is not resistant to partial failures",
        },
        {
          id: "c",
          text: "This is not robust to partial failures",
        },
        {
          id: "d",
          text: "This is not tolerant to partial failures",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "intermittently fails under load",
      translation: "高負荷時に断続的に失敗する",
      context: "Describing a flaky performance issue",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This intermittently fails under load",
        },
        {
          id: "b",
          text: "This occasionally fails under load",
        },
        {
          id: "c",
          text: "This sometimes fails under load",
        },
        {
          id: "d",
          text: "This randomly fails under load",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- infra × L4 ----
  "infra-L4": [
    {
      id: "w1",
      phrase: "event sourcing",
      translation: "イベントソーシング",
      context: "Architectural pattern using events as the source of truth",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "feat: introduce event sourcing for audit log",
        },
        {
          id: "b",
          text: "feat: introduce event logging for audit log",
        },
        {
          id: "c",
          text: "feat: introduce event streaming for audit log",
        },
        {
          id: "d",
          text: "feat: introduce event tracking for audit log",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "gap in our observability",
      translation: "オブザーバビリティのギャップ",
      context: "Missing monitoring coverage",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This exposes a gap in our observability",
        },
        {
          id: "b",
          text: "This reveals a gap in our observability",
        },
        {
          id: "c",
          text: "This shows a gap in our observability",
        },
        {
          id: "d",
          text: "This highlights a gap in our observability",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "dedicated spike",
      translation: "専用スパイク（調査タスク）",
      context: "Time-boxed exploration before committing to implementation",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This warrants a dedicated spike to explore the solution space",
        },
        {
          id: "b",
          text: "This warrants a dedicated research to explore the solution space",
        },
        {
          id: "c",
          text: "This warrants a dedicated investigation to explore the solution space",
        },
        {
          id: "d",
          text: "This warrants a dedicated analysis to explore the solution space",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- ml × L1 ----
  "ml-L1": [
    {
      id: "w1",
      phrase: "feat: add model training script",
      translation: "モデル訓練スクリプトを追加",
      context: "Adding a new ML training component",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "feat: add model training script" },
        { id: "b", text: "feat: added model training script" },
        { id: "c", text: "feat: adding model training script" },
        { id: "d", text: "feat: model training script add" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "TL;DR",
      translation: "要約すると",
      context: "Summarizing a long message for busy readers",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "TL;DR: the bug is a race condition in the payment handler",
        },
        {
          id: "b",
          text: "Summary: the bug is a race condition in the payment handler",
        },
        {
          id: "c",
          text: "Short: the bug is a race condition in the payment handler",
        },
        {
          id: "d",
          text: "Brief: the bug is a race condition in the payment handler",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "Expected behavior",
      translation: "期待される動作",
      context: "Section in a bug report describing what should happen",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "Expected behavior: The model should return predictions within 200ms",
        },
        {
          id: "b",
          text: "Expected result: The model should return predictions within 200ms",
        },
        {
          id: "c",
          text: "Expected output: The model should return predictions within 200ms",
        },
        {
          id: "d",
          text: "Expected response: The model should return predictions within 200ms",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- ml × L2 ----
  "ml-L2": [
    {
      id: "w1",
      phrase: "perf: optimize model inference",
      translation: "モデル推論を最適化",
      context: "Improving ML model speed",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "perf: optimize model inference pipeline" },
        { id: "b", text: "perf: optimized model inference pipeline" },
        { id: "c", text: "perf: optimizing model inference pipeline" },
        { id: "d", text: "perf: model inference pipeline optimization" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "Have you considered the memory implications?",
      translation: "メモリへの影響を考慮しましたか？",
      context: "PR comment about resource usage in ML code",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "Have you considered the memory implications here?",
        },
        {
          id: "b",
          text: "Did you think about the memory implications here?",
        },
        {
          id: "c",
          text: "Have you thought about memory usage here?",
        },
        {
          id: "d",
          text: "Did you consider the memory impact here?",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "Attaching a minimal reproduction",
      translation: "最小再現コードを添付します",
      context: "Providing a stripped-down example to isolate a bug",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "Attaching a minimal reproduction",
        },
        {
          id: "b",
          text: "Attaching a minimum reproduction",
        },
        {
          id: "c",
          text: "Attaching a simple reproduction",
        },
        {
          id: "d",
          text: "Attaching a small reproduction",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- ml × L3 ----
  "ml-L3": [
    {
      id: "w1",
      phrase: "replace O(n²) sort with radix sort",
      translation: "O(n²)のソートをRadixソートに置き換え",
      context: "Algorithm optimization in ML data preprocessing",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "perf: replace O(n²) sort with radix sort",
        },
        {
          id: "b",
          text: "perf: replace quadratic sort with radix sort",
        },
        {
          id: "c",
          text: "perf: replace slow sort with radix sort",
        },
        {
          id: "d",
          text: "perf: replace bubble sort with radix sort",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "cognitive load",
      translation: "認知負荷",
      context: "Mental effort required to understand code",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "The cognitive load here is high — consider breaking this into a pipeline",
        },
        {
          id: "b",
          text: "The mental load here is high — consider breaking this into a pipeline",
        },
        {
          id: "c",
          text: "The complexity here is high — consider breaking this into a pipeline",
        },
        {
          id: "d",
          text: "The difficulty here is high — consider breaking this into a pipeline",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "the root cause is",
      translation: "根本原因は〜です",
      context: "Identifying the underlying reason for a bug",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "The root cause is a missing normalization step in the preprocessing pipeline",
        },
        {
          id: "b",
          text: "The main cause is a missing normalization step in the preprocessing pipeline",
        },
        {
          id: "c",
          text: "The core cause is a missing normalization step in the preprocessing pipeline",
        },
        {
          id: "d",
          text: "The underlying cause is a missing normalization step in the preprocessing pipeline",
        },
      ],
      correctChoiceId: "a",
    },
  ],
  // ---- ml × L4 ----
  "ml-L4": [
    {
      id: "w1",
      phrase: "trade-off between correctness and performance",
      translation: "正確性とパフォーマンスのトレードオフ",
      context: "Discussion about competing goals in ML systems",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "The trade-off between correctness and performance needs to be discussed",
        },
        {
          id: "b",
          text: "The balance between correctness and performance needs to be discussed",
        },
        {
          id: "c",
          text: "The tension between correctness and performance needs to be discussed",
        },
        {
          id: "d",
          text: "The conflict between correctness and performance needs to be discussed",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w2",
      phrase: "I think we are solving for the wrong problem",
      translation: "間違った問題を解決しようとしていると思います",
      context: "Challenging the framing of a technical decision",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "I think we are solving for the wrong problem here",
        },
        {
          id: "b",
          text: "I think we are working on the wrong problem here",
        },
        {
          id: "c",
          text: "I think we are addressing the wrong problem here",
        },
        {
          id: "d",
          text: "I think we are tackling the wrong problem here",
        },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "accidental complexity",
      translation: "偶有的複雑性",
      context: "Complexity introduced by implementation choices, not the domain",
      type: "multiple_choice",
      choices: [
        {
          id: "a",
          text: "This introduces accidental complexity that the domain does not require",
        },
        {
          id: "b",
          text: "This introduces unnecessary complexity that the domain does not require",
        },
        {
          id: "c",
          text: "This introduces incidental complexity that the domain does not require",
        },
        {
          id: "d",
          text: "This introduces avoidable complexity that the domain does not require",
        },
      ],
      correctChoiceId: "a",
    },
  ],
};

// ---------------------------------------------------------------------------
// Focus content templates
// ---------------------------------------------------------------------------

const FOCUS_CONTENT: Record<DomainLevel, FocusContent> = {
  "web-L1": {
    phrase: "fix: <description>",
    explanation:
      "In conventional commits, 'fix' is used when patching a bug. Always use the imperative mood — write 'Fix' not 'Fixed'. Keep the description short and specific so reviewers instantly understand the intent.",
    examples: [
      {
        english: "fix: correct typo in README",
        japanese: "READMEのタイポを修正",
        context: "commit_message",
      },
      {
        english: "fix: resolve null check on login form",
        japanese: "ログインフォームのnullチェックを修正",
        context: "commit_message",
      },
      {
        english: "fix: prevent double submission on payment button",
        japanese: "支払いボタンの二重送信を防止",
        context: "commit_message",
      },
    ],
    tips: [
      "Use lowercase after the colon: 'fix: correct' not 'fix: Correct'",
      "Be specific — 'fix: correct null check in user service' beats 'fix: bug'",
      "Scope it if helpful: 'fix(auth): handle expired tokens'",
    ],
  },
  "web-L2": {
    phrase: "nit: <suggestion>",
    explanation:
      "'nit' (short for nitpick) signals a minor, non-blocking suggestion in a PR comment. Use it to improve code quality without blocking the merge. It sets a professional tone that distinguishes must-fix items from nice-to-haves.",
    examples: [
      {
        english: "nit: prefer const over let here since this is never reassigned",
        japanese:
          "細かい点: 再代入されないのでここではletよりconstが好ましいです",
        context: "pr_comment",
      },
      {
        english: "nit: trailing comma missing on the last item",
        japanese: "細かい点: 最後の要素にトレイリングカンマが抜けています",
        context: "pr_comment",
      },
      {
        english: "nit: consider extracting this magic number into a named constant",
        japanese:
          "細かい点: このマジックナンバーを名前付き定数に切り出すことを検討してください",
        context: "pr_comment",
      },
    ],
    tips: [
      "Distinguish nits from blockers: 'Blocking:' for must-fix, 'nit:' for optional",
      "Keep nit comments short — one sentence is usually enough",
      "If there are many nits, batch them: 'A few nits inline — none are blockers'",
    ],
  },
  "web-L3": {
    phrase: "race condition",
    explanation:
      "A race condition occurs when the behavior of code depends on the relative timing of events, such as concurrent async operations. In web development, this often appears when multiple requests modify shared state. When reviewing or reporting such bugs, be precise about the concurrent operations involved.",
    examples: [
      {
        english: "fix: resolve race condition in async handler",
        japanese: "非同期ハンドラーの競合状態を修正",
        context: "commit_message",
      },
      {
        english:
          "We should guard against concurrent writes here — this is not thread-safe as written",
        japanese:
          "ここでは同時書き込みに対して保護する必要があります。このコードはスレッドセーフではありません",
        context: "pr_comment",
      },
      {
        english:
          "This intermittently fails under load — likely a race condition triggered by concurrent requests",
        japanese:
          "高負荷時に断続的に失敗します。並行リクエストによってトリガーされる競合状態の可能性があります",
        context: "github_issue",
      },
    ],
    tips: [
      "Mention the concurrent operations: 'race condition between X and Y'",
      "Describe the failure mode: 'causes corrupted state when…'",
      "Suggest the fix class: 'should use a mutex / atomic operation / single-writer pattern'",
    ],
  },
  "web-L4": {
    phrase: "leaks the abstraction",
    explanation:
      "An abstraction 'leaks' when its callers need to understand its internal implementation to use it correctly. This is a code smell that makes APIs harder to use and more fragile. When reviewing, call it out precisely so the author understands what needs to change.",
    examples: [
      {
        english:
          "This leaks the abstraction — callers should not need to know about the underlying implementation",
        japanese:
          "これは抽象化が漏れています。呼び出し元は内部実装を知るべきではありません",
        context: "pr_comment",
      },
      {
        english:
          "The abstraction leaks implementation details — consider applying the dependency inversion principle",
        japanese:
          "抽象化が実装の詳細を漏らしています。依存性逆転の原則の適用を検討してください",
        context: "pr_comment",
      },
      {
        english:
          "refactor: decouple auth middleware from session management",
        japanese: "認証ミドルウェアをセッション管理から分離",
        context: "commit_message",
      },
    ],
    tips: [
      "Name the leaking detail: 'callers must know about the DB schema to use this'",
      "Suggest the fix: 'wrap in a DTO / introduce an interface / add a factory'",
      "Reference a principle: 'dependency inversion' or 'information hiding'",
    ],
  },
  "infra-L1": {
    phrase: "Heads up",
    explanation:
      "'Heads up' is an informal English phrase used to warn or inform someone about something in advance. In engineering teams, it's commonly used in Slack to proactively share information that might affect others' work, without requiring an immediate response.",
    examples: [
      {
        english:
          "Heads up — the staging environment will be down for maintenance this afternoon",
        japanese:
          "念のためお知らせします — ステージング環境は今日の午後メンテナンスのためダウンします",
        context: "slack",
      },
      {
        english: "Heads up: the deploy pipeline is slower than usual today",
        japanese: "お知らせ: 今日はデプロイパイプラインがいつもより遅くなっています",
        context: "slack",
      },
      {
        english:
          "Just a heads up — I'll be restarting the worker processes around 3pm",
        japanese:
          "念のためお知らせ — 午後3時頃にワーカープロセスを再起動します",
        context: "slack",
      },
    ],
    tips: [
      "Use 'Heads up' for proactive information sharing, not for urgent incidents",
      "Follow with a dash or colon, then the key information",
      "'Just a heads up' softens the tone further — use it for minor notices",
    ],
  },
  "infra-L2": {
    phrase: "This only occurs in production, not staging",
    explanation:
      "When reporting environment-specific bugs, precision is key. Stating which environment is affected and which is not immediately helps the team narrow down root causes (config differences, secrets, traffic patterns, etc.). Always include environment details in issue reports.",
    examples: [
      {
        english:
          "This only occurs in production, not staging — likely related to a config or environment difference",
        japanese:
          "これは本番環境でのみ発生し、ステージングでは発生しません。設定または環境の違いによる可能性があります",
        context: "github_issue",
      },
      {
        english:
          "Reproducible in prod but not locally — may be related to the K8s network policy",
        japanese:
          "本番環境では再現しますがローカルでは再現しません。K8sのネットワークポリシーに関連している可能性があります",
        context: "github_issue",
      },
      {
        english:
          "Environment: production (us-east-1), Node.js 20, Docker image v3.2.1",
        japanese: "環境: 本番 (us-east-1)、Node.js 20、Dockerイメージ v3.2.1",
        context: "github_issue",
      },
    ],
    tips: [
      "Always list all environments where you tested: prod / staging / local",
      "Mention the exact version or config that differs between environments",
      "Use 'reproducible' not 'reproduceable' — common misspelling",
    ],
  },
  "infra-L3": {
    phrase: "retry with exponential backoff",
    explanation:
      "Exponential backoff is a retry strategy where the wait time between retries doubles (or grows exponentially) after each failure. It is critical for building resilient distributed systems that don't overwhelm downstream services during outages.",
    examples: [
      {
        english: "feat: implement retry with exponential backoff",
        japanese: "指数バックオフによるリトライを実装",
        context: "commit_message",
      },
      {
        english:
          "The service should retry with exponential backoff and jitter to avoid thundering herd",
        japanese:
          "サービスはスロットリングハードを避けるためにジッターを加えた指数バックオフでリトライすべきです",
        context: "pr_comment",
      },
      {
        english:
          "This is not resilient to partial failures — if the upstream call fails, we have no retry logic",
        japanese:
          "これは部分的な障害に耐性がありません。アップストリームの呼び出しが失敗した場合、リトライロジックがありません",
        context: "pr_comment",
      },
    ],
    tips: [
      "Pair 'exponential backoff' with 'jitter' to prevent thundering herd",
      "Mention the max retry count: 'up to 3 retries with exponential backoff'",
      "Use 'resilient' not 'resiliant' — common misspelling",
    ],
  },
  "infra-L4": {
    phrase: "event sourcing",
    explanation:
      "Event sourcing is an architectural pattern where state changes are stored as a sequence of immutable events rather than overwriting the current state. It enables full audit trails, replay capabilities, and temporal queries. When proposing or discussing this pattern, be precise about the trade-offs.",
    examples: [
      {
        english: "feat: introduce event sourcing for audit log",
        japanese: "監査ログにイベントソーシングを導入",
        context: "commit_message",
      },
      {
        english:
          "Proposing an RFC for this architectural change — please leave feedback by Friday",
        japanese:
          "このアーキテクチャ変更についてRFCを提案します。金曜日までにフィードバックをお願いします",
        context: "github_issue",
      },
      {
        english:
          "This warrants a dedicated spike to explore the solution space before we commit to event sourcing",
        japanese:
          "イベントソーシングに踏み切る前に、解決策のスペースを探るための専用スパイクが必要です",
        context: "github_issue",
      },
    ],
    tips: [
      "Use 'event sourcing' (two words, lowercase) not 'Event Sourcing' in prose",
      "When proposing architectural changes, use 'RFC' or 'ADR' for formal proposals",
      "'Warrants a spike' signals exploration is needed before estimating",
    ],
  },
  "ml-L1": {
    phrase: "Expected behavior / Actual behavior",
    explanation:
      "When filing a bug report, separating 'Expected behavior' from 'Actual behavior' is the clearest way to communicate the problem. This format is universally understood by developers and makes it easy to write a failing test case.",
    examples: [
      {
        english:
          "Expected behavior: The model should return predictions within 200ms",
        japanese: "期待される動作: モデルは200ms以内に予測を返すべきです",
        context: "github_issue",
      },
      {
        english:
          "Actual behavior: The inference endpoint times out after 30 seconds for batch sizes > 100",
        japanese:
          "実際の動作: バッチサイズが100を超えると推論エンドポイントが30秒後にタイムアウトします",
        context: "github_issue",
      },
      {
        english: "Steps to reproduce:\n1. Send a batch of 200 samples\n2. Wait for response",
        japanese: "再現手順:\n1. 200サンプルのバッチを送信\n2. レスポンスを待つ",
        context: "github_issue",
      },
    ],
    tips: [
      "Use a consistent structure: Steps to reproduce → Expected → Actual → Environment",
      "'Expected behavior' not 'Expected result' — behavior is the standard term in issue templates",
      "Be specific with numbers: '200ms' not 'fast', '30 seconds' not 'slow'",
    ],
  },
  "ml-L2": {
    phrase: "Have you considered the memory implications?",
    explanation:
      "In ML codebases, memory management is often a critical concern due to large datasets and model sizes. When reviewing code that loads data or runs inference, asking about memory implications is a professional and important code review comment.",
    examples: [
      {
        english:
          "Have you considered the memory implications here? This could cause an OOM on large datasets",
        japanese:
          "ここでのメモリへの影響を考慮しましたか？大きなデータセットでOOMを引き起こす可能性があります",
        context: "pr_comment",
      },
      {
        english:
          "This might cause a memory leak — the tensor is never explicitly freed after inference",
        japanese:
          "これはメモリリークを引き起こす可能性があります。推論後にテンソルが明示的に解放されていません",
        context: "pr_comment",
      },
      {
        english:
          "perf: optimize model inference pipeline to reduce peak memory usage",
        japanese: "モデル推論パイプラインを最適化してピークメモリ使用量を削減",
        context: "commit_message",
      },
    ],
    tips: [
      "Phrase it as a question ('Have you considered...') to invite discussion, not defensiveness",
      "Use 'OOM' (out of memory) as a standard abbreviation in ML contexts",
      "'Memory implications' is broader than 'memory usage' — it includes leaks, fragmentation, etc.",
    ],
  },
  "ml-L3": {
    phrase: "root cause",
    explanation:
      "Identifying the 'root cause' of a bug means finding the fundamental reason, not just the symptom. In ML systems, root causes are often in data preprocessing, feature engineering, or subtle API misuse. Communicating root cause analysis clearly is essential for preventing recurrence.",
    examples: [
      {
        english:
          "The root cause is a missing normalization step in the preprocessing pipeline",
        japanese: "根本原因はプリプロセッシングパイプラインにおける正規化ステップの欠如です",
        context: "github_issue",
      },
      {
        english:
          "After investigation, the root cause turned out to be label leakage in the training set",
        japanese:
          "調査の結果、根本原因は訓練セットにおけるラベルリークであることが判明しました",
        context: "github_issue",
      },
      {
        english:
          "perf: replace O(n²) sort with radix sort in feature engineering pipeline",
        japanese: "特徴量エンジニアリングパイプラインのO(n²)ソートをRadixソートに置き換え",
        context: "commit_message",
      },
    ],
    tips: [
      "'Root cause' is always two words — never 'rootcause' or 'root-cause'",
      "Follow with 'turned out to be' or 'is' — 'The root cause is X' or 'turned out to be X'",
      "Pair with the fix: 'Root cause: X. Fix: Y'",
    ],
  },
  "ml-L4": {
    phrase: "trade-off between correctness and performance",
    explanation:
      "In ML systems, correctness (exact results) and performance (speed/throughput) are often in tension. Articulating this trade-off precisely in technical discussions shows senior engineering judgment and helps stakeholders make informed decisions.",
    examples: [
      {
        english:
          "The trade-off between correctness and performance needs to be discussed — both approaches have significant downsides",
        japanese:
          "正確性とパフォーマンスのトレードオフについて議論が必要です。どちらのアプローチにも重大な欠点があります",
        context: "github_issue",
      },
      {
        english:
          "I think we are solving for the wrong problem here — let me share some data that reframes the issue",
        japanese:
          "ここでは間違った問題を解決しようとしていると思います。問題を再定義するデータを共有させてください",
        context: "slack",
      },
      {
        english:
          "This introduces accidental complexity — the approximation does not meaningfully improve throughput",
        japanese:
          "これは偶有的複雑性を生み出しています。この近似はスループットを意味のある形で改善しません",
        context: "pr_comment",
      },
    ],
    tips: [
      "'Trade-off' uses a hyphen (not 'tradeoff' or 'trade off') in formal writing",
      "Use 'correctness' not 'accuracy' when discussing algorithm behavior vs approximate results",
      "Frame it as a shared decision: 'needs to be discussed' invites collaboration",
    ],
  },
};

// ---------------------------------------------------------------------------
// Practice exercises templates
// ---------------------------------------------------------------------------

const EXERCISES: Record<DomainLevel, Exercise[]> = {
  "web-L1": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct conventional commit prefix.",
      sentence: "___ : add user authentication feature",
      correctAnswer: "feat",
      acceptableAnswers: ["feat"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "Arrange the words to form a correct commit message.",
      words: ["alignment", "Fix", "button", "the", "login"],
      correctAnswer: "Fix the login button alignment",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a commit message for this change.",
      prompt:
        "You fixed a bug where clicking the submit button twice submitted the form twice. Write a conventional commit message.",
    },
  ],
  "web-L2": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "Fill in the blank with the correct PR comment prefix for a minor suggestion.",
      sentence: "___ : prefer const over let here since this value is never reassigned",
      correctAnswer: "nit",
      acceptableAnswers: ["nit", "Nit"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct code review comment about a memory issue.",
      words: [
        "cause",
        "This",
        "might",
        "a",
        "memory",
        "leak",
      ],
      correctAnswer: "This might cause a memory leak",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a PR comment for this situation.",
      prompt:
        "You noticed that a colleague's PR uses a hardcoded URL string 'https://api.example.com' in three different places. Write a code review comment suggesting improvement.",
    },
  ],
  "web-L3": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct technical term.",
      sentence:
        "fix: resolve ___ condition in the concurrent request handler",
      correctAnswer: "race",
      acceptableAnswers: ["race"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct code review comment.",
      words: [
        "swallow",
        "silently",
        "could",
        "exceptions",
        "This",
      ],
      correctAnswer: "This could silently swallow exceptions",
    },
    {
      id: "p3",
      type: "free_text",
      instruction:
        "Write a PR comment about this code pattern.",
      prompt:
        "You see a try/catch block that catches all errors and does nothing with them (empty catch block). Write a code review comment explaining the problem and suggesting a fix.",
    },
  ],
  "web-L4": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct term.",
      sentence:
        "This is an implicit ___ coupling — the order of initialization is not obvious",
      correctAnswer: "temporal",
      acceptableAnswers: ["temporal"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct PR comment about abstraction.",
      words: [
        "leaks",
        "This",
        "the",
        "abstraction",
      ],
      correctAnswer: "This leaks the abstraction",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a technical PR comment.",
      prompt:
        "You are reviewing a PR where a module directly accesses another module's database table by name. This creates tight coupling. Write a senior-level PR comment explaining the problem using correct terminology.",
    },
  ],
  "infra-L1": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "Fill in the blank with the correct Slack phrase for proactive sharing.",
      sentence:
        "___ — the production deploy will run at 3pm today",
      correctAnswer: "Heads up",
      acceptableAnswers: ["Heads up", "heads up", "FYI"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "Arrange the words to form a correct commit message.",
      words: ["dependencies", "chore:", "bump"],
      correctAnswer: "chore: bump dependencies",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a Slack message for this situation.",
      prompt:
        "You are about to restart the backend servers for a routine maintenance task that will take about 10 minutes. Write a Slack message to inform your team.",
    },
  ],
  "infra-L2": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct phrase.",
      sentence:
        "This ___ occurs in production, not staging — likely a config difference",
      correctAnswer: "only",
      acceptableAnswers: ["only"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct Slack message.",
      words: [
        "for",
        "you",
        "Pinging",
        "visibility",
      ],
      correctAnswer: "Pinging you for visibility",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a GitHub issue comment.",
      prompt:
        "You discovered that a memory leak bug only appears in the production Kubernetes cluster but not in the local Docker environment. Write a bug report comment explaining the environment difference.",
    },
  ],
  "infra-L3": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "Fill in the blank with the correct retry strategy term.",
      sentence:
        "feat: implement retry with ___ backoff for the webhook processor",
      correctAnswer: "exponential",
      acceptableAnswers: ["exponential"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct PR comment.",
      words: [
        "partial",
        "not",
        "resilient",
        "This",
        "to",
        "is",
        "failures",
      ],
      correctAnswer: "This is not resilient to partial failures",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a PR comment about error handling.",
      prompt:
        "You are reviewing a PR for a service that calls an external API. The code fails immediately on the first error with no retry logic. Write a PR comment suggesting exponential backoff and explaining why it matters for distributed systems.",
    },
  ],
  "infra-L4": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct architectural term.",
      sentence:
        "feat: introduce ___ sourcing for the payment audit trail",
      correctAnswer: "event",
      acceptableAnswers: ["event"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct phrase for requesting exploration.",
      words: [
        "spike",
        "warrants",
        "This",
        "dedicated",
        "a",
      ],
      correctAnswer: "This warrants a dedicated spike",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a GitHub issue for an architectural proposal.",
      prompt:
        "Your team is considering switching from a CRUD-based audit log to event sourcing. Write a GitHub issue proposing this architectural change and requesting feedback from the team before proceeding.",
    },
  ],
  "ml-L1": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "Fill in the blank with the correct section heading for a bug report.",
      sentence: "___ behavior: The model returns an error for inputs longer than 512 tokens",
      correctAnswer: "Expected",
      acceptableAnswers: ["Expected", "Actual"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct commit message.",
      words: ["training", "feat:", "script", "add", "model"],
      correctAnswer: "feat: add model training script",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a bug report section.",
      prompt:
        "The ML model endpoint should return results in under 500ms but is taking 3 seconds for inputs larger than 1000 characters. Write the 'Expected behavior' and 'Actual behavior' sections of a GitHub issue.",
    },
  ],
  "ml-L2": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "Fill in the blank to complete this PR comment about memory.",
      sentence:
        "Have you considered the ___ implications here? This could cause an OOM on large datasets",
      correctAnswer: "memory",
      acceptableAnswers: ["memory"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct commit message.",
      words: ["inference", "perf:", "model", "optimize", "pipeline"],
      correctAnswer: "perf: optimize model inference pipeline",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a PR comment about this code.",
      prompt:
        "In a PR, you see code that loads the entire training dataset (potentially millions of rows) into memory at once before processing. Write a PR comment asking about memory implications and suggesting a more memory-efficient approach.",
    },
  ],
  "ml-L3": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct term.",
      sentence:
        "The ___ cause is a missing normalization step in the feature engineering pipeline",
      correctAnswer: "root",
      acceptableAnswers: ["root"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct commit message.",
      words: [
        "sort",
        "perf:",
        "with",
        "O(n²)",
        "replace",
        "radix",
        "sort",
      ],
      correctAnswer: "perf: replace O(n²) sort with radix sort",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a root cause analysis comment.",
      prompt:
        "After investigating a bug where the ML model was producing incorrect predictions, you discovered that the data preprocessing step was not normalizing the input features to [0,1] range, causing the model to behave unexpectedly. Write a GitHub issue comment explaining the root cause.",
    },
  ],
  "ml-L4": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "Fill in the blank with the correct term.",
      sentence:
        "The ___ between correctness and performance needs to be discussed before choosing an approach",
      correctAnswer: "trade-off",
      acceptableAnswers: ["trade-off", "tradeoff", "trade off"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "Arrange the words to form a correct Slack message.",
      words: [
        "wrong",
        "solving",
        "are",
        "we",
        "the",
        "problem",
        "for",
        "I",
        "think",
      ],
      correctAnswer: "I think we are solving for the wrong problem",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "Write a senior-level technical comment.",
      prompt:
        "Your team is debating whether to use an approximate nearest neighbor algorithm (faster, less accurate) or exact nearest neighbor (slower, accurate) for a recommendation system. Write a Slack message or GitHub issue comment that articulates the trade-off and suggests a path forward.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Wrapup content templates
// ---------------------------------------------------------------------------

const WRAPUP_CONTENT: Record<DomainLevel, WrapupContent> = {
  "web-L1": {
    summary:
      "Today you practiced the foundational vocabulary of web development communication — conventional commit prefixes, PR approval phrases, and the imperative mood in commit messages.",
    keyPoints: [
      "Use imperative mood in commit messages: 'Fix' not 'Fixed'",
      "LGTM means 'Looks good to me' — a common PR approval phrase",
      "Conventional commit prefixes: fix, feat, docs, chore, style, test",
    ],
    nextPreview:
      "Next: PR comment etiquette — how to give feedback that is clear and professional",
  },
  "web-L2": {
    summary:
      "You practiced the nuanced vocabulary of professional PR reviews — from soft suggestions ('nit') to hard blockers ('Blocking'), and how to communicate code quality concerns effectively.",
    keyPoints: [
      "'nit' signals a minor, non-blocking suggestion",
      "'Blocking' flags a must-fix issue before merging",
      "Use consistent prefixes so reviewers can triage comments quickly",
    ],
    nextPreview:
      "Next: Advanced code review language — discussing architecture and design patterns",
  },
  "web-L3": {
    summary:
      "You practiced the advanced vocabulary of concurrent programming and code quality — terms like 'race condition', 'silently swallow', and 'discriminated union' that distinguish senior engineers in code reviews.",
    keyPoints: [
      "A 'race condition' is a timing-based bug in concurrent code",
      "Code that 'silently swallows exceptions' hides errors — always re-throw or log",
      "Use 'discriminated union' when a boolean flag creates ambiguous types",
    ],
    nextPreview:
      "Next: Architectural vocabulary — discussing abstraction, coupling, and design principles",
  },
  "web-L4": {
    summary:
      "You practiced the architectural vocabulary used by senior engineers — terms like 'leaks the abstraction', 'temporal coupling', and 'idempotency' that communicate deep system design insights.",
    keyPoints: [
      "'Leaks the abstraction' means implementation details are exposed through the interface",
      "'Temporal coupling' is a hidden dependency on execution order",
      "'Idempotency' means repeated operations produce the same result — critical for APIs",
    ],
    nextPreview:
      "Next: RFC and ADR writing — proposing and documenting architectural decisions",
  },
  "infra-L1": {
    summary:
      "Today you practiced the essential Slack vocabulary of infrastructure teams — 'Heads up', 'FYI', 'On it!', and conventional commits for infrastructure changes.",
    keyPoints: [
      "'Heads up' is for proactive, informal warnings to teammates",
      "'FYI' shares information without requiring action",
      "'chore' prefix is for routine maintenance like dependency bumps",
    ],
    nextPreview:
      "Next: Incident communication — how to write clear status updates during outages",
  },
  "infra-L2": {
    summary:
      "You practiced the vocabulary of environment-specific bug reporting and team communication — essential skills for infrastructure engineers who work across multiple deployment environments.",
    keyPoints: [
      "Always specify which environments are affected: 'only in production, not staging'",
      "'Pinging for visibility' means informing without requiring action",
      "Include environment details: OS, version, cloud provider, region",
    ],
    nextPreview:
      "Next: Incident postmortem language — writing blameless root cause analyses",
  },
  "infra-L3": {
    summary:
      "You practiced the resilience vocabulary of distributed systems — 'exponential backoff', 'partial failures', and 'intermittently fails under load' — terms that are essential for senior infrastructure engineers.",
    keyPoints: [
      "'Exponential backoff' is the standard retry strategy for distributed systems",
      "'Not resilient to partial failures' signals missing error handling in multi-step operations",
      "'Intermittently fails under load' suggests a race condition or resource contention",
    ],
    nextPreview:
      "Next: Observability vocabulary — discussing metrics, traces, and alerting",
  },
  "infra-L4": {
    summary:
      "You practiced the architectural vocabulary of platform engineering — 'event sourcing', 'observability gaps', and 'dedicated spike' — language that drives high-level technical decisions.",
    keyPoints: [
      "'Event sourcing' stores state as immutable events, not current values",
      "'Gap in observability' means a failure mode that monitoring cannot detect",
      "'Dedicated spike' is a time-boxed task to explore before estimating an implementation",
    ],
    nextPreview:
      "Next: Cross-team coordination language — writing RFCs and architectural decision records",
  },
  "ml-L1": {
    summary:
      "Today you practiced the fundamental bug reporting vocabulary for ML systems — 'Expected behavior', 'Actual behavior', and 'Steps to reproduce' — the universal structure of effective bug reports.",
    keyPoints: [
      "Always separate 'Expected behavior' from 'Actual behavior' in bug reports",
      "'Steps to reproduce' must be precise enough for another engineer to follow",
      "Include environment details: model version, input size, hardware",
    ],
    nextPreview:
      "Next: Performance vocabulary for ML — discussing latency, throughput, and memory",
  },
  "ml-L2": {
    summary:
      "You practiced the performance review vocabulary for ML code — 'memory implications', 'OOM', and 'memory leak' — critical terms for engineers working with large datasets and models.",
    keyPoints: [
      "'OOM' (out of memory) is a standard abbreviation in ML engineering",
      "Ask 'Have you considered the memory implications?' to invite discussion, not confront",
      "Memory leaks in ML often come from unreleased tensor references",
    ],
    nextPreview:
      "Next: Root cause analysis vocabulary — communicating what went wrong and why",
  },
  "ml-L3": {
    summary:
      "You practiced the root cause analysis vocabulary — 'root cause', 'label leakage', and algorithmic complexity terms like 'O(n²)' — language that signals deep debugging and optimization skills.",
    keyPoints: [
      "'Root cause' is always two words — the fundamental reason, not just the symptom",
      "O(n²) vs O(n log n) vs O(n) — always include Big-O when discussing algorithm optimization",
      "'Label leakage' is ML-specific: training data contaminated with test information",
    ],
    nextPreview:
      "Next: Architectural trade-offs in ML systems — correctness vs performance",
  },
  "ml-L4": {
    summary:
      "You practiced the strategic vocabulary of ML system design — 'trade-off between correctness and performance', 'accidental complexity', and 'solving for the wrong problem' — language that distinguishes principal engineers.",
    keyPoints: [
      "'Trade-off' uses a hyphen — correct in formal technical writing",
      "'Accidental complexity' is complexity from implementation choices, not the problem domain",
      "'Solving for the wrong problem' challenges the framing, not just the solution",
    ],
    nextPreview:
      "Next: Writing technical RFCs — proposing ML architecture changes to your team",
  },
};

// ---------------------------------------------------------------------------
// Lesson builder
// ---------------------------------------------------------------------------

function buildLesson(level: Level, domain: Domain): LessonContentInternal {
  const key: DomainLevel = `${domain}-${level}`;

  const warmupQuestions = WARMUP_QUESTIONS[key];
  const focusContent = FOCUS_CONTENT[key];
  const exercises = EXERCISES[key];
  const wrapupContent = WRAPUP_CONTENT[key];

  return {
    warmup: { questions: warmupQuestions },
    focus: focusContent,
    practice: { exercises },
    wrapup: wrapupContent,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { level, domain, count } = parseArgs();

  for (let i = 0; i < count; i++) {
    const lesson = buildLesson(level, domain);
    process.stdout.write(JSON.stringify(lesson, null, 2));
    if (i < count - 1) {
      process.stdout.write("\n");
    }
  }
  process.stdout.write("\n");
}

main();
