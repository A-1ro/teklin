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
      { id: "A", text: "本番環境を壊していたバグを修正するPR" },
      { id: "B", text: "後方互換性のない変更を加えるPR" },
      { id: "C", text: "既存のテストを誤って壊してしまったPR" },
      { id: "D", text: "大きすぎてCIパイプラインに影響するPR" },
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
      { id: "A", text: "サーバーがメモリ不足になった" },
      { id: "B", text: "注文データの取得中にネットワークタイムアウトが発生した" },
      { id: "C", text: "undefinedの値に対して`.id`にアクセスしようとした" },
      { id: "D", text: "注文IDが0だったためPromiseが失敗した" },
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
      { id: "A", text: "同時リクエストが来るとサーバーがクラッシュする" },
      { id: "B", text: "並列呼び出しが古い値を読んで、カウントが重複する可能性がある" },
      { id: "C", text: "リクエストが速すぎるとカウンターがオーバーフローする" },
      { id: "D", text: "現在使っているロック機構が高負荷時に遅すぎる" },
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
      "> **Problem**: Monolithic deployment causes ~4 min downtime on every",
      "> config change.",
      ">",
      "> **Proposed Solution**: Split into independently deployable services.",
      "> Each owns its config and can restart without affecting others.",
    ].join("\n"),
    choices: [
      { id: "A", text: "サーバーの増強で再起動時間を短縮する" },
      { id: "B", text: "独立してデプロイできるサービスに分割する" },
      { id: "C", text: "ブルーグリーンデプロイでダウンタイムを隠す" },
      { id: "D", text: "設定値をキャッシュして再起動を減らす" },
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
      { id: "A", text: "コードを承認しているが、ドキュメントを追加してほしい" },
      { id: "B", text: "このアプローチはどんなデータでも機能しないと思っている" },
      { id: "C", text: "大規模データでパフォーマンスやスケーラビリティの問題が出る可能性を懸念している" },
      { id: "D", text: "1000万件のデータを使ったユニットテストを追加してほしい" },
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
      "From an Architecture Decision Record:",
      "",
      "> **Decision**: Adopt event sourcing for the orders domain.",
      ">",
      "> **Positive**: Full audit trail; can replay events for debugging.",
      ">",
      "> **Negative**: Eventual consistency — read models may lag behind",
      "> writes by several seconds.",
    ].join("\n"),
    choices: [
      { id: "A", text: "実装が難しくなり開発速度が落ちる" },
      { id: "B", text: "読み取りモデルが最新の書き込みをすぐに反映しない場合がある" },
      { id: "C", text: "イベントの再生が遅く、本番のパフォーマンスに影響する" },
      { id: "D", text: "監査ログが無限に増えてストレージコストが膨らむ" },
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
    type: "multiple_choice",
    prompt: "正しいgitコミットメッセージはどれですか？",
    choices: [
      { id: "A", text: "fixed bug" },
      { id: "B", text: "Fix session not cleared on logout" },
      { id: "C", text: "I fixed the bug where session was not cleared when user logs out" },
      { id: "D", text: "bugfix" },
    ],
    correctChoiceId: "B",
  },
  {
    id: "w-easy-2",
    axis: "writing",
    difficulty: 1,
    type: "multiple_choice",
    prompt: "チームメートにPRレビューをお願いするSlackメッセージとして最も適切なのはどれですか？",
    choices: [
      { id: "A", text: "Review my PR now." },
      { id: "B", text: "Hey, could you take a look at my PR when you get a chance? No rush! [PR_LINK]" },
      { id: "C", text: "My PR needs a review ASAP." },
      { id: "D", text: "Please review. [PR_LINK]" },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 2 (medium)
  // -------------------------------------------------------------------------
  {
    id: "w-med-1",
    axis: "writing",
    difficulty: 2,
    type: "multiple_choice",
    prompt: "最も建設的なPRレビューコメントはどれですか？",
    choices: [
      { id: "A", text: "This code is bad. Refactor it." },
      { id: "B", text: "LGTM 👍" },
      { id: "C", text: "Consider extracting this logic into a helper function — it would make the code easier to test and read." },
      { id: "D", text: "Why did you write it this way?" },
    ],
    correctChoiceId: "C",
  },
  {
    id: "w-med-2",
    axis: "writing",
    difficulty: 2,
    type: "multiple_choice",
    prompt: "GitHub Issueのタイトルとして最も適切なのはどれですか？",
    choices: [
      { id: "A", text: "Bug" },
      { id: "B", text: "Login doesn't work" },
      { id: "C", text: "Login button unresponsive when email field is empty on iOS 17" },
      { id: "D", text: "There's a problem with login I think" },
    ],
    correctChoiceId: "C",
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 3 (hard)
  // -------------------------------------------------------------------------
  {
    id: "w-hard-1",
    axis: "writing",
    difficulty: 3,
    type: "multiple_choice",
    prompt: "PRでbreaking changeを説明する文として最も適切なのはどれですか？",
    choices: [
      { id: "A", text: "This is a big change." },
      { id: "B", text: "This PR updates getUserById to accept an object { id, includeDeleted } instead of a plain string. All call sites must be updated before merging." },
      { id: "C", text: "getUserById has been updated." },
      { id: "D", text: "I refactored the API a bit." },
    ],
    correctChoiceId: "B",
  },
  {
    id: "w-hard-2",
    axis: "writing",
    difficulty: 3,
    type: "multiple_choice",
    prompt: "ユーザーの機能要望をGitHub上で丁寧に断る返答として最も適切なのはどれですか？",
    choices: [
      { id: "A", text: "We won't implement this." },
      { id: "B", text: "Thanks for the suggestion! This is currently out of scope, but you can achieve a similar result by using [workaround]. Feel free to reopen if your use case changes." },
      { id: "C", text: "This is not possible." },
      { id: "D", text: "I'll pass this along to the team." },
    ],
    correctChoiceId: "B",
  },

  // -------------------------------------------------------------------------
  // VOCABULARY — difficulty 1 (easy)
  // -------------------------------------------------------------------------
  {
    id: "v-easy-1",
    axis: "vocabulary",
    difficulty: 1,
    type: "multiple_choice",
    prompt: '「deprecated」の意味は？',
    choices: [
      { id: "A", text: "コードから削除された機能" },
      { id: "B", text: "非推奨。将来のバージョンで削除される予定" },
      { id: "C", text: "セキュリティ脆弱性が含まれる機能" },
      { id: "D", text: "実験的でまだ不安定な機能" },
    ],
    correctChoiceId: "B",
  },
  {
    id: "v-easy-2",
    axis: "vocabulary",
    difficulty: 1,
    type: "multiple_choice",
    prompt: '「refactor」の意味は？',
    choices: [
      { id: "A", text: "新機能を追加しながらゼロから書き直す" },
      { id: "B", text: "外部の動作を変えずにコードの内部構造を整理する" },
      { id: "C", text: "バグのロジックを修正する" },
      { id: "D", text: "未テストのコードにテストを追加する" },
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
    prompt: '「idempotent」の意味は？',
    choices: [
      { id: "A", text: "ペイロードの大きさに関わらず即座に完了する処理" },
      { id: "B", text: "1回呼んでも何度呼んでも結果が変わらない処理" },
      { id: "C", text: "同時に1クライアントしか実行できない処理" },
      { id: "D", text: "失敗時に自動でリトライする処理" },
    ],
    correctChoiceId: "B",
  },
  {
    id: "v-med-2",
    axis: "vocabulary",
    difficulty: 2,
    type: "multiple_choice",
    prompt: '「race condition」の意味は？',
    choices: [
      { id: "A", text: "2つのコードパスの速度を比較するベンチマーク" },
      { id: "B", text: "2つのスレッドが同じロックを取り合うバグ" },
      { id: "C", text: "並列処理の結果が実行順序によって変わる問題" },
      { id: "D", text: "テストを並列実行したときのCIの失敗" },
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
    prompt: '「eventual consistency」の意味は？',
    choices: [
      { id: "A", text: "全レプリカが確認するまで書き込みをブロックする" },
      { id: "B", text: "更新が止まれば、いずれ全レプリカが同じ値に収束する" },
      { id: "C", text: "読み取りが常に最新の書き込みを返すことを保証する" },
      { id: "D", text: "不整合をなくすために同期レプリケーションする" },
    ],
    correctChoiceId: "B",
  },
  {
    id: "v-hard-2",
    axis: "vocabulary",
    difficulty: 3,
    type: "multiple_choice",
    prompt: '「backpressure」の意味は？',
    choices: [
      { id: "A", text: "メッセージが複数のホップを経由する際のレイテンシ" },
      { id: "B", text: "処理が追いつかないコンシューマーがプロデューサーに速度を落とさせる仕組み" },
      { id: "C", text: "データを送信前に圧縮するオーバーヘッド" },
      { id: "D", text: "デッドレターキューから失敗メッセージを再送する処理" },
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
