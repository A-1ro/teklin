import type { SkillAxis } from "@teklin/shared";

export interface QuestionData {
  id: string;
  axis: SkillAxis;
  difficulty: 1 | 2 | 3;
  type: "multiple_choice" | "free_text";
  prompt: string;
  context?: string;
  choices?: { id: string; text: string }[];
  correctChoiceId?: string;
  scoringCriteria?: string;
}

export const PLACEMENT_QUESTIONS: QuestionData[] = [
  // -------------------------------------------------------------------------
  // READING — difficulty 1 (easy)
  // -------------------------------------------------------------------------
  {
    id: "r-easy-1",
    axis: "reading",
    difficulty: 1,
    type: "multiple_choice",
    prompt: '「This PR introduces a breaking change」という表現は何を意味していますか？',
    context: [
      "From a pull request description:",
      "",
      '> This PR introduces a breaking change to the `getUserById` API.',
      "> Callers must now pass `{ id, includeDeleted }` instead of a plain",
      "> string ID. Update all call sites before merging.",
    ].join("\n"),
    choices: [
      { id: "A", text: "The PR fixes a bug that was breaking production." },
      {
        id: "B",
        text: "The PR changes the API in a way that is not backward-compatible.",
      },
      {
        id: "C",
        text: "The PR accidentally broke existing tests that must be fixed.",
      },
      {
        id: "D",
        text: "The PR is so large that it may break the CI pipeline.",
      },
    ],
    correctChoiceId: "B",
  },
  {
    id: "r-easy-2",
    axis: "reading",
    difficulty: 1,
    type: "multiple_choice",
    prompt: "以下のエラーログによると、何が問題でしたか？",
    context: [
      "```",
      "ERROR 2024-03-12T09:14:22Z [worker] Unhandled promise rejection:",
      "  TypeError: Cannot read properties of undefined (reading 'id')",
      "    at processOrder (/app/orders.js:42:18)",
      "    at async handleRequest (/app/server.js:88:5)",
      "```",
    ].join("\n"),
    choices: [
      { id: "A", text: "The server ran out of memory processing the order." },
      {
        id: "B",
        text: "A network timeout occurred while fetching order data.",
      },
      {
        id: "C",
        text: "The code tried to access `.id` on a value that was undefined.",
      },
      { id: "D", text: "The promise was rejected because the order ID is 0." },
    ],
    correctChoiceId: "C",
  },

  // -------------------------------------------------------------------------
  // READING — difficulty 2 (medium)
  // -------------------------------------------------------------------------
  {
    id: "r-med-1",
    axis: "reading",
    difficulty: 2,
    type: "multiple_choice",
    prompt:
      "このコメントでレビュアーはrace conditionについて何を指摘していますか？",
    context: [
      "From a GitHub PR review:",
      "",
      "> I think there's a potential race condition here. If two requests",
      "> call `getAndIncrement()` simultaneously, both could read the same",
      "> counter value before either writes the incremented result back.",
      "> We should use an atomic operation or a database-level lock to",
      "> ensure correctness.",
    ].join("\n"),
    choices: [
      {
        id: "A",
        text: "Two requests arriving at the same time will crash the server.",
      },
      {
        id: "B",
        text: "Concurrent calls may read a stale value and produce duplicate increments.",
      },
      {
        id: "C",
        text: "The counter will overflow if requests arrive too quickly.",
      },
      {
        id: "D",
        text: "The lock mechanism currently used is too slow for high concurrency.",
      },
    ],
    correctChoiceId: "B",
  },
  {
    id: "r-med-2",
    axis: "reading",
    difficulty: 2,
    type: "multiple_choice",
    prompt: "このRFC抜粋で提案されている解決策は何ですか？",
    context: [
      "From an internal RFC:",
      "",
      "> **Problem**: The current monolithic deployment requires a full",
      "> restart whenever any service configuration changes, causing",
      "> ~4 minutes of downtime per deployment.",
      ">",
      "> **Proposed Solution**: Extract each bounded context into an",
      "> independently deployable unit. Each service owns its configuration",
      "> and can be restarted without affecting siblings. This enables",
      "> zero-downtime rolling deployments via the orchestrator's health",
      "> checks.",
    ].join("\n"),
    choices: [
      {
        id: "A",
        text: "Increase server capacity to reduce restart time to under a minute.",
      },
      {
        id: "B",
        text: "Migrate to a microservices architecture for independent deployments.",
      },
      {
        id: "C",
        text: "Use blue-green deployments to mask downtime from the current monolith.",
      },
      {
        id: "D",
        text: "Cache configuration values to avoid restarts on config changes.",
      },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // READING — difficulty 3 (hard)
  // -------------------------------------------------------------------------
  {
    id: "r-hard-1",
    axis: "reading",
    difficulty: 3,
    type: "multiple_choice",
    prompt: "このコメントでレビュアーが暗に示していることは何ですか？",
    context: [
      "From a code review on a data-processing function:",
      "",
      '> Interesting approach. I\'m curious — have you considered whether',
      "> this would still hold up if `items` contained 10 million records?",
      "> No blocker, just something worth thinking about before we ship this",
      "> to the analytics pipeline.",
    ].join("\n"),
    choices: [
      {
        id: "A",
        text: "The reviewer is approving the code but wants documentation added.",
      },
      {
        id: "B",
        text: "The reviewer doubts the approach will work on any dataset.",
      },
      {
        id: "C",
        text: "The reviewer suspects there may be a performance or scalability issue at scale.",
      },
      {
        id: "D",
        text: "The reviewer wants the author to add a unit test with 10 million items.",
      },
    ],
    correctChoiceId: "C",
  },
  {
    id: "r-hard-2",
    axis: "reading",
    difficulty: 3,
    type: "multiple_choice",
    prompt:
      "このアーキテクチャ決定記録（ADR）によると、選択したアプローチの主なトレードオフは何ですか？",
    context: [
      "From an Architecture Decision Record (ADR-042):",
      "",
      "> **Decision**: We will adopt event sourcing for the orders domain.",
      ">",
      "> **Consequences**:",
      "> *Positive*: Full audit trail; ability to replay events for debugging",
      "> and read-model rebuilds; temporal decoupling of producers and consumers.",
      ">",
      "> *Negative*: Eventual consistency means downstream read models may lag",
      "> behind writes by up to several seconds. Queries that require strongly",
      "> consistent reads must either accept this lag or query the write model",
      "> directly, increasing coupling.",
    ].join("\n"),
    choices: [
      {
        id: "A",
        text: "Event sourcing is harder to implement, so development velocity will drop.",
      },
      {
        id: "B",
        text: "Read models may not immediately reflect the latest writes, complicating strongly-consistent queries.",
      },
      {
        id: "C",
        text: "Replaying events is slow and will cause performance issues in production.",
      },
      {
        id: "D",
        text: "The audit trail will grow unboundedly and require costly storage.",
      },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 1 (easy)
  // -------------------------------------------------------------------------
  {
    id: "w-easy-1",
    axis: "writing",
    difficulty: 1,
    type: "free_text",
    prompt:
      '以下の変更内容について、英語で簡潔な命令形のgitコミットメッセージを書いてください：「バグを直しました — ユーザーがログアウトしても session が残り続けていた問題を修正」',
    scoringCriteria: [
      "Uses imperative mood (e.g., 'Fix' not 'Fixed')",
      "Clearly describes what was changed and why",
      "50 characters or fewer for the subject line",
      "No trailing period",
      "Grammatically correct English",
    ].join("; "),
  },
  {
    id: "w-easy-2",
    axis: "writing",
    difficulty: 1,
    type: "free_text",
    prompt:
      "チームメートにプルリクエストのレビューをお願いする短いSlackメッセージ（2〜3文）を英語で書いてください。PRリンクのプレースホルダー [PR_LINK] を含め、急ぎではないことも伝えましょう。",
    scoringCriteria: [
      "Polite and professional tone",
      "Mentions the PR link",
      "Communicates low urgency",
      "Grammatically correct English",
      "Natural, conversational phrasing appropriate for Slack",
    ].join("; "),
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 2 (medium)
  // -------------------------------------------------------------------------
  {
    id: "w-med-1",
    axis: "writing",
    difficulty: 2,
    type: "free_text",
    prompt:
      '以下のPRレビューコメントを、建設的で具体的な表現に英語で書き直してください：「This code is bad. You should refactor it.」',
    scoringCriteria: [
      "Specific about what the problem is",
      "Suggests a concrete improvement",
      "Respectful and professional tone",
      "Does not repeat the original rudeness",
      "Grammatically correct English",
    ].join("; "),
  },
  {
    id: "w-med-2",
    axis: "writing",
    difficulty: 2,
    type: "free_text",
    prompt:
      "発見したnull pointer exceptionを説明するGitHub Issueを英語で書いてください。以下の内容を含めてください：発生箇所、再現手順（番号付きリスト）、期待される動作と実際の動作。",
    scoringCriteria: [
      "Clear title and structured body",
      "Steps to reproduce are numbered and clear",
      "Distinguishes expected vs. actual behavior",
      "Mentions the location of the error",
      "Grammatically correct and professional English",
    ].join("; "),
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 3 (hard)
  // -------------------------------------------------------------------------
  {
    id: "w-hard-1",
    axis: "writing",
    difficulty: 3,
    type: "free_text",
    prompt:
      "public APIをRESTからGraphQLに移行することを提案する技術的なRFCサマリーを英語で3〜4文で書いてください。動機、中核となる変更点、主な利点の1つを含めてください。",
    scoringCriteria: [
      "Clear motivation (e.g., over-fetching, versioning pain)",
      "Core change is precisely described",
      "At least one concrete technical benefit stated",
      "Appropriate technical vocabulary",
      "Grammatically correct and concise English",
    ].join("; "),
  },
  {
    id: "w-hard-2",
    axis: "writing",
    difficulty: 3,
    type: "free_text",
    prompt:
      "チームが実装しないと決定した機能をユーザーが要望しています。丁寧な返答（3〜5文）を英語で書いてください：要望を断り、理由を簡潔に説明し、代替案や回避策を提案してください。",
    scoringCriteria: [
      "Polite and empathetic opening",
      "Clear but tactful decline",
      "Brief, non-defensive reasoning",
      "Concrete alternative or workaround offered",
      "Professional tone suitable for a public GitHub comment",
    ].join("; "),
  },

  // -------------------------------------------------------------------------
  // VOCABULARY — difficulty 1 (easy)
  // -------------------------------------------------------------------------
  {
    id: "v-easy-1",
    axis: "vocabulary",
    difficulty: 1,
    type: "multiple_choice",
    prompt: 'ソフトウェアの文脈で「deprecated」はどういう意味ですか？',
    choices: [
      { id: "A", text: "A feature that has been deleted from the codebase." },
      {
        id: "B",
        text: "A feature that is outdated and discouraged; it may be removed in a future version.",
      },
      { id: "C", text: "A feature that contains a known security vulnerability." },
      { id: "D", text: "A feature that is experimental and not yet stable." },
    ],
    correctChoiceId: "B",
  },
  {
    id: "v-easy-2",
    axis: "vocabulary",
    difficulty: 1,
    type: "multiple_choice",
    prompt: '「refactor」はどういう意味ですか？',
    choices: [
      {
        id: "A",
        text: "To rewrite code from scratch with new features added.",
      },
      {
        id: "B",
        text: "To restructure existing code without changing its external behavior.",
      },
      {
        id: "C",
        text: "To fix a bug by changing the logic of a function.",
      },
      {
        id: "D",
        text: "To add automated tests to untested code.",
      },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // VOCABULARY — difficulty 2 (medium)
  // -------------------------------------------------------------------------
  {
    id: "v-med-1",
    axis: "vocabulary",
    difficulty: 2,
    type: "multiple_choice",
    prompt: 'HTTPやAPIの文脈で「idempotent」はどういう意味ですか？',
    choices: [
      {
        id: "A",
        text: "An operation that completes instantly regardless of payload size.",
      },
      {
        id: "B",
        text: "An operation that produces the same result whether called once or many times.",
      },
      {
        id: "C",
        text: "An operation that can only be safely executed by one client at a time.",
      },
      {
        id: "D",
        text: "An operation that automatically retries on failure.",
      },
    ],
    correctChoiceId: "B",
  },
  {
    id: "v-med-2",
    axis: "vocabulary",
    difficulty: 2,
    type: "multiple_choice",
    prompt: '「race condition」とは何ですか？',
    choices: [
      {
        id: "A",
        text: "A performance benchmark that compares the speed of two code paths.",
      },
      {
        id: "B",
        text: "A bug that occurs when two threads compete to acquire the same lock.",
      },
      {
        id: "C",
        text: "A situation where the outcome of concurrent operations depends on their unpredictable order.",
      },
      {
        id: "D",
        text: "A CI pipeline failure caused by tests running in parallel.",
      },
    ],
    correctChoiceId: "C",
  },

  // -------------------------------------------------------------------------
  // VOCABULARY — difficulty 3 (hard)
  // -------------------------------------------------------------------------
  {
    id: "v-hard-1",
    axis: "vocabulary",
    difficulty: 3,
    type: "multiple_choice",
    prompt: '分散システムにおいて「eventual consistency」はどういう意味ですか？',
    choices: [
      {
        id: "A",
        text: "All write operations block until every replica has confirmed the update.",
      },
      {
        id: "B",
        text: "Given no new updates, all replicas will converge to the same value over time.",
      },
      {
        id: "C",
        text: "The system guarantees that reads always return the most recent write.",
      },
      {
        id: "D",
        text: "Data is replicated synchronously to avoid any inconsistency window.",
      },
    ],
    correctChoiceId: "B",
  },
  {
    id: "v-hard-2",
    axis: "vocabulary",
    difficulty: 3,
    type: "multiple_choice",
    prompt:
      'ストリーミングデータパイプラインの文脈で「backpressure」はどういう意味ですか？',
    choices: [
      {
        id: "A",
        text: "The latency added when a message must travel back through multiple network hops.",
      },
      {
        id: "B",
        text: "A mechanism by which a slow consumer signals the producer to slow down or pause.",
      },
      {
        id: "C",
        text: "The overhead of compressing data before sending it downstream.",
      },
      {
        id: "D",
        text: "Retrying failed messages from a dead-letter queue.",
      },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // NUANCE — difficulty 1 (easy)
  // -------------------------------------------------------------------------
  {
    id: "n-easy-1",
    axis: "nuance",
    difficulty: 1,
    type: "multiple_choice",
    prompt: 'バグの修正をお願いするとき、より丁寧な表現はどちらですか？',
    choices: [
      { id: "A", text: "Fix this bug." },
      { id: "B", text: "Could you take a look at this bug when you have a moment?" },
      { id: "C", text: "This bug needs to be fixed immediately." },
      { id: "D", text: "Why hasn't this bug been fixed yet?" },
    ],
    correctChoiceId: "B",
  },
  {
    id: "n-easy-2",
    axis: "nuance",
    difficulty: 1,
    type: "multiple_choice",
    prompt:
      '同僚があなたのプルリクエストに「LGTM 👍」とコメントしました。これは何を伝えていますか？',
    choices: [
      { id: "A", text: "They found a critical issue but are approving anyway." },
      {
        id: "B",
        text: "They approve the change and have no blocking concerns.",
      },
      { id: "C", text: "They want you to explain your changes in more detail." },
      { id: "D", text: "They reviewed only the formatting, not the logic." },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // NUANCE — difficulty 2 (medium)
  // -------------------------------------------------------------------------
  {
    id: "n-med-1",
    axis: "nuance",
    difficulty: 2,
    type: "multiple_choice",
    prompt:
      'レビュアーが「I wonder if there might be a simpler approach here.」と書いています。この発言が最も意味している内容はどれですか？',
    choices: [
      {
        id: "A",
        text: "They are genuinely curious and have no specific concern.",
      },
      {
        id: "B",
        text: "They are politely suggesting that the current implementation is overly complex.",
      },
      {
        id: "C",
        text: "They want you to write a comment explaining why you chose this approach.",
      },
      {
        id: "D",
        text: "They are blocking the PR until you rewrite the code.",
      },
    ],
    correctChoiceId: "B",
  },
  {
    id: "n-med-2",
    axis: "nuance",
    difficulty: 2,
    type: "multiple_choice",
    prompt:
      "コードレビューでシニアエンジニアの提案に同意できない場合、最もプロフェッショナルな返答はどれですか？",
    choices: [
      {
        id: "A",
        text: '"That\'s wrong. My approach is better because it\'s faster."',
      },
      {
        id: "B",
        text: '"I see your point. I went with this approach because [reason]. Happy to discuss if you think there\'s a better way."',
      },
      {
        id: "C",
        text: '"OK, I\'ll change it."',
      },
      {
        id: "D",
        text: '"I don\'t agree but I\'ll do whatever you say."',
      },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // NUANCE — difficulty 3 (hard)
  // -------------------------------------------------------------------------
  {
    id: "n-hard-1",
    axis: "nuance",
    difficulty: 3,
    type: "multiple_choice",
    prompt:
      'シニアエンジニアがあなたのPRに「This is an interesting approach.」とコメントし、それ以上の説明はありません。この発言が実際に意味している可能性が最も高いのはどれですか？',
    context: [
      "The comment appears on a complex caching implementation you wrote.",
      "The reviewer has not approved the PR.",
    ].join("\n"),
    choices: [
      {
        id: "A",
        text: "They are genuinely impressed and are about to approve the PR.",
      },
      {
        id: "B",
        text: "They are diplomatically signaling concern or skepticism about the approach.",
      },
      {
        id: "C",
        text: "They have no opinion and are waiting for other reviewers.",
      },
      {
        id: "D",
        text: "They want you to write more documentation before they can evaluate it.",
      },
    ],
    correctChoiceId: "B",
  },
  {
    id: "n-hard-2",
    axis: "nuance",
    difficulty: 3,
    type: "multiple_choice",
    prompt:
      "本番環境の重大なバグがチームをブロックしており、根本原因は別チームが所有するライブラリにあります。そのチームのマネージャーへのメッセージとして最も適切なのはどれですか？",
    choices: [
      {
        id: "A",
        text: '"Your team\'s library is broken and is blocking us. Fix it now."',
      },
      {
        id: "B",
        text: '"Hey, just FYI, there might be a small issue somewhere."',
      },
      {
        id: "C",
        text: [
          '"Hi [Name], we\'ve identified a production issue that appears to originate',
          "in [library]. It's currently blocking [team] with [impact]. I'd appreciate",
          'your help prioritizing a fix or workaround. Happy to share a reproducer."',
        ].join(" "),
      },
      {
        id: "D",
        text: '"We opened a bug report. Please review it when you have time."',
      },
    ],
    correctChoiceId: "C",
  },
];
