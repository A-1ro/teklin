#!/usr/bin/env npx tsx
/**
 * generate-lessons.ts
 *
 * Generates lesson JSON to stdout using static content templates.
 * No LLM calls — 12 static patterns (3 domains × 4 levels).
 * Note: "mobile" domain is not yet supported by this script.
 *
 * Usage:
 *   npx tsx scripts/generate-lessons.ts --level L1 --domain web --count 1
 *   npx tsx scripts/generate-lessons.ts --level L3 --domain infra --count 3
 *
 * Output:
 *   count=1: a single JSON object
 *   count>1: a JSON array of objects
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
        if (val === "mobile") {
          console.error(
            `Domain "mobile" is not yet supported by this script. Supported: web, infra, ml.`
          );
        } else {
          console.error(`Invalid domain: ${val}. Must be web, infra, or ml.`);
        }
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
        { id: "a", text: "修正する" },
        { id: "b", text: "追加する" },
        { id: "c", text: "削除する" },
        { id: "d", text: "更新する" },
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
        { id: "a", text: "承認、問題なし" },
        { id: "b", text: "もっと見てください" },
        { id: "c", text: "後で確認します" },
        { id: "d", text: "修正が必要です" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "feat",
      translation: "新機能",
      context: "Conventional commit prefix for a new feature",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "新機能" },
        { id: "b", text: "バグ修正" },
        { id: "c", text: "リファクタリング" },
        { id: "d", text: "ドキュメント更新" },
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
        { id: "a", text: "細かい指摘" },
        { id: "b", text: "重大なバグ" },
        { id: "c", text: "ブロッカー" },
        { id: "d", text: "承認サイン" },
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
        { id: "a", text: "リファクタリングする" },
        { id: "b", text: "新機能を追加する" },
        { id: "c", text: "バグを修正する" },
        { id: "d", text: "テストを追加する" },
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
        { id: "a", text: "ブロッカー" },
        { id: "b", text: "細かい指摘" },
        { id: "c", text: "提案" },
        { id: "d", text: "承認" },
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
        { id: "a", text: "競合状態" },
        { id: "b", text: "デッドロック" },
        { id: "c", text: "メモリリーク" },
        { id: "d", text: "スタックオーバーフロー" },
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
        { id: "a", text: "判別可能なユニオン型" },
        { id: "b", text: "交差型" },
        { id: "c", text: "ジェネリクス型" },
        { id: "d", text: "条件型" },
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
        { id: "a", text: "サイレントに無視する" },
        { id: "b", text: "例外を再スローする" },
        { id: "c", text: "エラーをログに記録する" },
        { id: "d", text: "例外を変換する" },
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
        { id: "a", text: "抽象化が漏れている" },
        { id: "b", text: "インターフェースが壊れている" },
        { id: "c", text: "カプセル化が不足している" },
        { id: "d", text: "依存関係が循環している" },
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
        { id: "a", text: "時間的結合" },
        { id: "b", text: "循環依存" },
        { id: "c", text: "密結合" },
        { id: "d", text: "データ競合" },
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
        { id: "a", text: "べき等性" },
        { id: "b", text: "原子性" },
        { id: "c", text: "一貫性" },
        { id: "d", text: "スレッドセーフ" },
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
        { id: "a", text: "依存関係のバージョンを更新" },
        { id: "b", text: "新しいライブラリを追加" },
        { id: "c", text: "不要なパッケージを削除" },
        { id: "d", text: "依存関係の脆弱性を修正" },
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
        { id: "a", text: "念のためお知らせします" },
        { id: "b", text: "至急対応が必要です" },
        { id: "c", text: "ご確認をお願いします" },
        { id: "d", text: "承認をお願いします" },
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
        { id: "a", text: "参考までに" },
        { id: "b", text: "至急ご対応ください" },
        { id: "c", text: "あなたの担当です" },
        { id: "d", text: "承認が必要です" },
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
        { id: "a", text: "GitHub Actionsワークフローを追加" },
        { id: "b", text: "Dockerイメージをビルド" },
        { id: "c", text: "テストスイートを実行" },
        { id: "d", text: "本番環境にデプロイ" },
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
        { id: "a", text: "認識共有のためにピンしています" },
        { id: "b", text: "至急対応をお願いしています" },
        { id: "c", text: "レビューを依頼しています" },
        { id: "d", text: "承認を求めています" },
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
        { id: "a", text: "これは本番環境でのみ発生します" },
        { id: "b", text: "これはすべての環境で発生します" },
        { id: "c", text: "これはローカルでのみ発生します" },
        { id: "d", text: "これはステージングでのみ発生します" },
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
        { id: "a", text: "指数バックオフによるリトライ" },
        { id: "b", text: "固定間隔でのリトライ" },
        { id: "c", text: "タイムアウトの延長" },
        { id: "d", text: "サーキットブレーカーの適用" },
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
        { id: "a", text: "部分的な障害に耐性がない" },
        { id: "b", text: "全体的な障害に耐性がない" },
        { id: "c", text: "パフォーマンスが低下している" },
        { id: "d", text: "メモリ使用量が多すぎる" },
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
        { id: "a", text: "高負荷時に断続的に失敗する" },
        { id: "b", text: "常に失敗する" },
        { id: "c", text: "起動時に失敗する" },
        { id: "d", text: "低負荷時に失敗する" },
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
        { id: "a", text: "イベントソーシング" },
        { id: "b", text: "メッセージキュー" },
        { id: "c", text: "CQRS" },
        { id: "d", text: "サガパターン" },
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
        { id: "a", text: "オブザーバビリティのギャップ" },
        { id: "b", text: "パフォーマンスのボトルネック" },
        { id: "c", text: "セキュリティの脆弱性" },
        { id: "d", text: "スケーラビリティの限界" },
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
        { id: "a", text: "専用スパイク（調査タスク）" },
        { id: "b", text: "緊急バグ修正" },
        { id: "c", text: "コードレビュー" },
        { id: "d", text: "定期メンテナンス" },
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
        { id: "a", text: "モデル訓練スクリプトを追加" },
        { id: "b", text: "モデル訓練スクリプトを削除" },
        { id: "c", text: "推論パイプラインを最適化" },
        { id: "d", text: "データセットを更新" },
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
        { id: "a", text: "要約すると" },
        { id: "b", text: "詳細については" },
        { id: "c", text: "補足情報として" },
        { id: "d", text: "ご注意ください" },
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
        { id: "a", text: "期待される動作" },
        { id: "b", text: "実際の動作" },
        { id: "c", text: "再現手順" },
        { id: "d", text: "環境情報" },
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
        { id: "a", text: "モデル推論を最適化" },
        { id: "b", text: "モデルの精度を改善" },
        { id: "c", text: "訓練データを追加" },
        { id: "d", text: "モデルのバージョンを更新" },
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
        { id: "a", text: "メモリへの影響を考慮しましたか？" },
        { id: "b", text: "CPUの使用率を確認しましたか？" },
        { id: "c", text: "テストを追加しましたか？" },
        { id: "d", text: "ドキュメントを更新しましたか？" },
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
        { id: "a", text: "最小再現コードを添付します" },
        { id: "b", text: "スクリーンショットを添付します" },
        { id: "c", text: "ログファイルを添付します" },
        { id: "d", text: "設定ファイルを添付します" },
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
        { id: "a", text: "O(n²)のソートをRadixソートに置き換え" },
        { id: "b", text: "O(n log n)のソートをバブルソートに置き換え" },
        { id: "c", text: "線形探索を二分探索に置き換え" },
        { id: "d", text: "再帰処理を反復処理に置き換え" },
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
        { id: "a", text: "認知負荷" },
        { id: "b", text: "実行コスト" },
        { id: "c", text: "技術的負債" },
        { id: "d", text: "保守コスト" },
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
        { id: "a", text: "根本原因は〜です" },
        { id: "b", text: "直接の原因は〜です" },
        { id: "c", text: "副作用として〜が起きています" },
        { id: "d", text: "回避策として〜があります" },
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
        { id: "a", text: "正確性とパフォーマンスのトレードオフ" },
        { id: "b", text: "コストとスケーラビリティのトレードオフ" },
        { id: "c", text: "セキュリティと利便性のトレードオフ" },
        { id: "d", text: "保守性と開発速度のトレードオフ" },
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
        { id: "a", text: "間違った問題を解決しようとしていると思います" },
        { id: "b", text: "この解決策に同意します" },
        { id: "c", text: "もっと良い実装方法があると思います" },
        { id: "d", text: "この変更は不要だと思います" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "w3",
      phrase: "accidental complexity",
      translation: "偶有的複雑性",
      context:
        "Complexity introduced by implementation choices, not the domain",
      type: "multiple_choice",
      choices: [
        { id: "a", text: "偶有的複雑性" },
        { id: "b", text: "本質的複雑性" },
        { id: "c", text: "循環的複雑度" },
        { id: "d", text: "認知的複雑性" },
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
        english:
          "nit: prefer const over let here since this is never reassigned",
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
        english:
          "nit: consider extracting this magic number into a named constant",
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
        english: "refactor: decouple auth middleware from session management",
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
        japanese:
          "お知らせ: 今日はデプロイパイプラインがいつもより遅くなっています",
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
        english:
          "Steps to reproduce:\n1. Send a batch of 200 samples\n2. Wait for response",
        japanese:
          "再現手順:\n1. 200サンプルのバッチを送信\n2. レスポンスを待つ",
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
        japanese:
          "根本原因はプリプロセッシングパイプラインにおける正規化ステップの欠如です",
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
        japanese:
          "特徴量エンジニアリングパイプラインのO(n²)ソートをRadixソートに置き換え",
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
      instruction:
        "空欄に正しいコンベンショナルコミットのプレフィックスを入れよう。",
      sentence: "___ : add user authentication feature",
      correctAnswer: "feat",
      acceptableAnswers: ["feat"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコミットメッセージを作ろう。",
      words: ["alignment", "Fix", "button", "the", "login"],
      correctAnswer: "Fix the login button alignment",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "この変更に対するコミットメッセージを英語で書こう。",
      prompt:
        "送信ボタンを2回クリックするとフォームが2回送信されるバグを修正しました。コンベンショナルコミット形式でコミットメッセージを書こう。",
    },
  ],
  "web-L2": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "空欄に細かい提案を示す正しいPRコメントのプレフィックスを入れよう。",
      sentence:
        "___ : prefer const over let here since this value is never reassigned",
      correctAnswer: "nit",
      acceptableAnswers: ["nit", "Nit"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction:
        "単語を並び替えてメモリ問題に関する正しいコードレビューコメントを作ろう。",
      words: ["cause", "This", "might", "a", "memory", "leak"],
      correctAnswer: "This might cause a memory leak",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "この状況に対するPRコメントを英語で書こう。",
      prompt:
        "同僚のPRで、'https://api.example.com' というハードコードされたURL文字列が3箇所で使われていることに気づきました。改善を提案するコードレビューコメントを書こう。",
    },
  ],
  "web-L3": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しい技術用語を入れよう。",
      sentence: "fix: resolve ___ condition in the concurrent request handler",
      correctAnswer: "race",
      acceptableAnswers: ["race"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコードレビューコメントを作ろう。",
      words: ["swallow", "silently", "could", "exceptions", "This"],
      correctAnswer: "This could silently swallow exceptions",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "このコードパターンについてPRコメントを英語で書こう。",
      prompt:
        "すべてのエラーをキャッチして何もしない空のcatchブロックを含むtry/catchを見つけました。問題を説明して修正を提案するコードレビューコメントを書こう。",
    },
  ],
  "web-L4": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しい用語を入れよう。",
      sentence:
        "This is an implicit ___ coupling — the order of initialization is not obvious",
      correctAnswer: "temporal",
      acceptableAnswers: ["temporal"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて抽象化に関する正しいPRコメントを作ろう。",
      words: ["leaks", "This", "the", "abstraction"],
      correctAnswer: "This leaks the abstraction",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "技術的なPRコメントを英語で書こう。",
      prompt:
        "あるモジュールが別のモジュールのデータベーステーブル名に直接アクセスしているPRをレビューしています。これは密結合を生み出します。正しい技術用語を使ってシニアエンジニアレベルのPRコメントを書こう。",
    },
  ],
  "infra-L1": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に情報を事前共有する正しいSlackのフレーズを入れよう。",
      sentence: "___ — the production deploy will run at 3pm today",
      correctAnswer: "Heads up",
      acceptableAnswers: ["Heads up", "heads up", "FYI"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコミットメッセージを作ろう。",
      words: ["dependencies", "chore:", "bump"],
      correctAnswer: "chore: bump dependencies",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "この状況に対するSlackメッセージを英語で書こう。",
      prompt:
        "約10分かかるルーティンメンテナンスのためにバックエンドサーバーを再起動しようとしています。チームに知らせるSlackメッセージを書こう。",
    },
  ],
  "infra-L2": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しい語句を入れよう。",
      sentence:
        "This ___ occurs in production, not staging — likely a config difference",
      correctAnswer: "only",
      acceptableAnswers: ["only"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいSlackメッセージを作ろう。",
      words: ["for", "you", "Pinging", "visibility"],
      correctAnswer: "Pinging you for visibility",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "GitHubのissueコメントを英語で書こう。",
      prompt:
        "メモリリークのバグが本番のKubernetesクラスターにのみ現れ、ローカルのDocker環境では再現しないことがわかりました。環境の違いを説明するバグレポートのコメントを書こう。",
    },
  ],
  "infra-L3": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しいリトライ戦略の用語を入れよう。",
      sentence:
        "feat: implement retry with ___ backoff for the webhook processor",
      correctAnswer: "exponential",
      acceptableAnswers: ["exponential"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいPRコメントを作ろう。",
      words: ["partial", "not", "resilient", "This", "to", "is", "failures"],
      correctAnswer: "This is not resilient to partial failures",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "エラーハンドリングに関するPRコメントを英語で書こう。",
      prompt:
        "外部APIを呼び出すサービスのPRをレビューしています。コードは最初のエラーで即座に失敗し、リトライロジックがありません。指数バックオフを提案して分散システムにとって重要な理由を説明するPRコメントを書こう。",
    },
  ],
  "infra-L4": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しいアーキテクチャ用語を入れよう。",
      sentence: "feat: introduce ___ sourcing for the payment audit trail",
      correctAnswer: "event",
      acceptableAnswers: ["event"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて調査を求める正しいフレーズを作ろう。",
      words: ["spike", "warrants", "This", "dedicated", "a"],
      correctAnswer: "This warrants a dedicated spike",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "アーキテクチャ提案のGitHub issueを英語で書こう。",
      prompt:
        "チームでCRUDベースの監査ログからイベントソーシングへの移行を検討しています。このアーキテクチャ変更を提案し、着手前にチームからフィードバックを求めるGitHub issueを書こう。",
    },
  ],
  "ml-L1": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄にバグレポートの正しいセクション見出しを入れよう。",
      sentence:
        "___ behavior: The model returns an error for inputs longer than 512 tokens",
      correctAnswer: "Expected",
      acceptableAnswers: ["Expected", "Actual"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコミットメッセージを作ろう。",
      words: ["training", "feat:", "script", "add", "model"],
      correctAnswer: "feat: add model training script",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "バグレポートのセクションを英語で書こう。",
      prompt:
        "MLモデルのエンドポイントは500ms以内に結果を返すべきですが、1000文字を超える入力では3秒かかっています。GitHub issueの「Expected behavior」と「Actual behavior」のセクションを書こう。",
    },
  ],
  "ml-L2": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction:
        "空欄に正しい語句を入れてメモリに関するPRコメントを完成させよう。",
      sentence:
        "Have you considered the ___ implications here? This could cause an OOM on large datasets",
      correctAnswer: "memory",
      acceptableAnswers: ["memory"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコミットメッセージを作ろう。",
      words: ["inference", "perf:", "model", "optimize", "pipeline"],
      correctAnswer: "perf: optimize model inference pipeline",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "このコードに関するPRコメントを英語で書こう。",
      prompt:
        "PRで、処理前に訓練データセット全体（数百万行になる可能性あり）を一度にメモリに読み込むコードを見つけました。メモリへの影響を指摘し、よりメモリ効率の良いアプローチを提案するPRコメントを書こう。",
    },
  ],
  "ml-L3": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しい用語を入れよう。",
      sentence:
        "The ___ cause is a missing normalization step in the feature engineering pipeline",
      correctAnswer: "root",
      acceptableAnswers: ["root"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいコミットメッセージを作ろう。",
      words: ["sort", "perf:", "with", "O(n²)", "replace", "radix", "sort"],
      correctAnswer: "perf: replace O(n²) sort with radix sort",
    },
    {
      id: "p3",
      type: "free_text",
      instruction: "根本原因分析のコメントを英語で書こう。",
      prompt:
        "MLモデルが誤った予測を出すバグを調査した結果、データ前処理ステップで入力特徴量を[0,1]の範囲に正規化していないことが原因でモデルが予期しない動作をしていることがわかりました。根本原因を説明するGitHub issueのコメントを書こう。",
    },
  ],
  "ml-L4": [
    {
      id: "p1",
      type: "fill_in_blank",
      instruction: "空欄に正しい用語を入れよう。",
      sentence:
        "The ___ between correctness and performance needs to be discussed before choosing an approach",
      correctAnswer: "trade-off",
      acceptableAnswers: ["trade-off", "tradeoff", "trade off"],
    },
    {
      id: "p2",
      type: "reorder",
      instruction: "単語を並び替えて正しいSlackメッセージを作ろう。",
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
      instruction: "シニアエンジニアらしい技術的なコメントを英語で書こう。",
      prompt:
        "レコメンデーションシステムに近似最近傍アルゴリズム（高速・低精度）と厳密最近傍（低速・高精度）のどちらを使うかチームで議論しています。トレードオフを明確に示して今後の方針を提案するSlackメッセージかGitHub issueのコメントを書こう。",
    },
  ],
};

// ---------------------------------------------------------------------------
// Wrapup content templates
// ---------------------------------------------------------------------------

const WRAPUP_CONTENT: Record<DomainLevel, WrapupContent> = {
  "web-L1": {
    summary:
      "今日はWeb開発コミュニケーションの基本語彙を練習しました。コンベンショナルコミットのプレフィックス、PR承認フレーズ、コミットメッセージの命令形の使い方です。",
    keyPoints: [
      "コミットメッセージには命令形を使う: 'Fixed' ではなく 'Fix'",
      "LGTM は 'Looks good to me' の略で、PRを承認するときによく使われる",
      "コンベンショナルコミットのプレフィックス: fix, feat, docs, chore, style, test",
    ],
    nextPreview:
      "次回: PRコメントのエチケット — 明確でプロフェッショナルなフィードバックの書き方",
  },
  "web-L2": {
    summary:
      "プロフェッショナルなPRレビューの繊細な語彙を練習しました。ソフトな提案（'nit'）からマストフィックスのブロッカー（'Blocking'）まで、コード品質の懸念を効果的に伝える方法です。",
    keyPoints: [
      "'nit' はマイナーで非ブロッキングな提案を示す",
      "'Blocking' はマージ前に必ず修正すべき問題を示す",
      "一貫したプレフィックスを使うとレビュアーがコメントをすばやく分類できる",
    ],
    nextPreview:
      "次回: 高度なコードレビュー表現 — アーキテクチャとデザインパターンの議論",
  },
  "web-L3": {
    summary:
      "並行プログラミングとコード品質の高度な語彙を練習しました。'race condition'、'silently swallow'、'discriminated union' など、コードレビューでシニアエンジニアとの差をつける用語です。",
    keyPoints: [
      "'race condition' は並行コードにおけるタイミング起因のバグ",
      "例外を 'silently swallow' するコードはエラーを隠す — 常に再スローかログを残すこと",
      "bool フラグが型の曖昧さを生み出すときは 'discriminated union' を使う",
    ],
    nextPreview: "次回: アーキテクチャ語彙 — 抽象化・結合・設計原則の議論",
  },
  "web-L4": {
    summary:
      "シニアエンジニアが使うアーキテクチャ語彙を練習しました。'leaks the abstraction'、'temporal coupling'、'idempotency' など、深いシステム設計の洞察を伝える用語です。",
    keyPoints: [
      "'leaks the abstraction' は実装の詳細がインターフェースを通じて露出していることを意味する",
      "'temporal coupling' は実行順序への隠れた依存関係",
      "'idempotency' は繰り返し実行しても同じ結果になること — APIにとって重要な性質",
    ],
    nextPreview:
      "次回: RFCとADRの書き方 — アーキテクチャ上の決定を提案・文書化する方法",
  },
  "infra-L1": {
    summary:
      "今日はインフラチームに必須のSlack語彙を練習しました。'Heads up'、'FYI'、'On it!'、そしてインフラ変更のコンベンショナルコミットです。",
    keyPoints: [
      "'Heads up' はチームメートへの事前の非公式な通知に使う",
      "'FYI' はアクションを要求せずに情報を共有する",
      "'chore' プレフィックスは依存関係のバージョン更新などのルーティンメンテナンスに使う",
    ],
    nextPreview:
      "次回: インシデントコミュニケーション — 障害時に明確なステータスアップデートを書く方法",
  },
  "infra-L2": {
    summary:
      "環境固有のバグレポートとチームコミュニケーションの語彙を練習しました。複数のデプロイ環境をまたいで作業するインフラエンジニアに必須のスキルです。",
    keyPoints: [
      "影響を受けている環境を必ず明記する: 'only in production, not staging'",
      "'Pinging for visibility' はアクションを要求せずに知らせること",
      "環境の詳細を含める: OS、バージョン、クラウドプロバイダー、リージョン",
    ],
    nextPreview:
      "次回: インシデントポストモーテムの表現 — 責任追及なしの根本原因分析の書き方",
  },
  "infra-L3": {
    summary:
      "分散システムの耐障害性語彙を練習しました。'exponential backoff'、'partial failures'、'intermittently fails under load' など、シニアインフラエンジニアに必須の用語です。",
    keyPoints: [
      "'Exponential backoff' は分散システムの標準的なリトライ戦略",
      "'Not resilient to partial failures' は複数ステップ処理のエラーハンドリング欠如を示す",
      "'Intermittently fails under load' は競合状態またはリソース競合を示唆する",
    ],
    nextPreview:
      "次回: オブザーバビリティ語彙 — メトリクス・トレース・アラートの議論",
  },
  "infra-L4": {
    summary:
      "プラットフォームエンジニアリングのアーキテクチャ語彙を練習しました。'event sourcing'、'observability gaps'、'dedicated spike' など、高レベルの技術的意思決定を推進する言葉です。",
    keyPoints: [
      "'event sourcing' は現在の値を上書きせず、不変イベントとして状態を保存するパターン",
      "'gap in observability' はモニタリングで検知できない障害モードがあることを意味する",
      "'dedicated spike' は実装を見積もる前に探索するためのタイムボックスされたタスク",
    ],
    nextPreview:
      "次回: チーム横断のコーディネーション表現 — RFCとアーキテクチャ決定記録の書き方",
  },
  "ml-L1": {
    summary:
      "今日はMLシステムの基本的なバグレポート語彙を練習しました。'Expected behavior'、'Actual behavior'、'Steps to reproduce' — 効果的なバグレポートの普遍的な構造です。",
    keyPoints: [
      "バグレポートでは 'Expected behavior' と 'Actual behavior' を必ず分けて書く",
      "'Steps to reproduce' は他のエンジニアが再現できるほど具体的に書く",
      "環境の詳細を含める: モデルバージョン、入力サイズ、ハードウェア",
    ],
    nextPreview:
      "次回: MLのパフォーマンス語彙 — レイテンシ・スループット・メモリの議論",
  },
  "ml-L2": {
    summary:
      "MLコードのパフォーマンスレビュー語彙を練習しました。'memory implications'、'OOM'、'memory leak' — 大規模データセットとモデルを扱うエンジニアに必須の用語です。",
    keyPoints: [
      "'OOM'（out of memory）はMLエンジニアリングでの標準的な略語",
      "'Have you considered the memory implications?' は対立せず議論を促す聞き方",
      "MLにおけるメモリリークは解放されていないテンソル参照から生じることが多い",
    ],
    nextPreview: "次回: 根本原因分析の語彙 — 何が起きてなぜかを伝える表現",
  },
  "ml-L3": {
    summary:
      "根本原因分析の語彙を練習しました。'root cause'、'label leakage'、'O(n²)' などのアルゴリズム計算量の表現 — 深いデバッグと最適化スキルを示す言葉です。",
    keyPoints: [
      "'root cause' は必ず2語 — 症状ではなく根本的な理由",
      "O(n²) vs O(n log n) vs O(n) — アルゴリズム最適化を議論するときは必ずBig-Oを含める",
      "'label leakage' はML固有の用語: テスト情報で汚染された訓練データのこと",
    ],
    nextPreview:
      "次回: MLシステムのアーキテクチャトレードオフ — 正確性とパフォーマンスの議論",
  },
  "ml-L4": {
    summary:
      "MLシステム設計の戦略的語彙を練習しました。'trade-off between correctness and performance'、'accidental complexity'、'solving for the wrong problem' — プリンシパルエンジニアが使う言葉です。",
    keyPoints: [
      "'trade-off' はハイフンあり — 正式な技術文書での正しい表記",
      "'accidental complexity' は問題領域ではなく実装の選択から生まれる複雑さ",
      "'solving for the wrong problem' は解決策ではなく問題の定義自体に疑問を呈する表現",
    ],
    nextPreview:
      "次回: 技術RFCの書き方 — MLアーキテクチャ変更をチームに提案する方法",
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

  if (count === 1) {
    const lesson = buildLesson(level, domain);
    process.stdout.write(JSON.stringify(lesson, null, 2) + "\n");
  } else {
    const lessons: LessonContentInternal[] = [];
    for (let i = 0; i < count; i++) {
      lessons.push(buildLesson(level, domain));
    }
    process.stdout.write(JSON.stringify(lessons, null, 2) + "\n");
  }
}

main();
