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
    type: "free_text",
    prompt: "以下の変更内容に対して、英語のgitコミットメッセージを1行で書いてください。",
    context: [
      "変更内容:",
      "ログアウト時にセッションがクリアされないバグを修正した。",
    ].join("\n"),
    scoringCriteria: [
      "Score based on: imperative mood (e.g. 'Fix' not 'Fixed'), specificity about what was fixed,",
      "conciseness (ideally under 72 characters), no trailing period.",
      "A response like 'Fix session not cleared on logout' scores 90-100.",
      "Vague responses like 'fix bug' score 20-40.",
    ].join(" "),
  },
  {
    id: "w-easy-2",
    axis: "writing",
    difficulty: 1,
    type: "free_text",
    prompt: "以下のバグ報告をもとに、GitHub Issue のタイトルを英語で1行書いてください。",
    context: [
      "バグ内容:",
      "iOS 17 で、メールアドレス欄が空のままログインボタンを押すと、",
      "ボタンが反応しなくなる（スピナーが出たまま止まる）。",
    ].join("\n"),
    scoringCriteria: [
      "Score based on: specificity (what breaks, under what condition, on what platform),",
      "conciseness, and clarity.",
      "A response like 'Login button unresponsive when email field is empty on iOS 17' scores 90-100.",
      "Vague titles like 'Login bug' score 10-30.",
    ].join(" "),
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 2 (medium)
  // -------------------------------------------------------------------------
  {
    id: "w-med-1",
    axis: "writing",
    difficulty: 2,
    type: "free_text",
    prompt: "以下のコードに対して、建設的なPRレビューコメントを英語で1文書いてください。",
    context: [
      "レビュー対象のコード（JavaScript）:",
      "```js",
      "async function getUser(id) {",
      "  const res = await fetch(`/api/users/${id}`);",
      "  const data = await res.json();",
      "  return data;",
      "}",
      "```",
      "気になる点: fetch が失敗したときのエラーハンドリングがない。",
    ].join("\n"),
    scoringCriteria: [
      "Score based on: constructive and polite tone (not blunt or accusatory),",
      "actionable suggestion, professional phrasing.",
      "Responses that suggest adding error handling politely score 80-100.",
      "Blunt commands like 'Add error handling.' score 30-50.",
      "Vague comments like 'This could be better.' score 10-30.",
    ].join(" "),
  },
  {
    id: "w-med-2",
    axis: "writing",
    difficulty: 2,
    type: "free_text",
    prompt: "チームメートにPRのレビューを依頼する、英語のSlackメッセージを1〜2文で書いてください。",
    context: [
      "状況:",
      "認証まわりのリファクタリングPRをオープンした。",
      "急ぎではないが、今週中にマージしたい。",
    ].join("\n"),
    scoringCriteria: [
      "Score based on: polite and friendly tone, includes brief context about the PR,",
      "not demanding or urgent-sounding, natural phrasing.",
      "Responses that are warm, mention the PR topic, and express no urgency score 80-100.",
      "Overly formal or demanding messages score 30-60.",
    ].join(" "),
  },

  // -------------------------------------------------------------------------
  // WRITING — difficulty 3 (hard)
  // -------------------------------------------------------------------------
  {
    id: "w-hard-1",
    axis: "writing",
    difficulty: 3,
    type: "free_text",
    prompt: "以下のbreaking changeについて、PRの説明文に書く英文を1文で書いてください。変更内容と、呼び出し元が取るべきアクションが伝わるようにしてください。",
    context: [
      "変更内容:",
      "`getUserById(id: string)` のシグネチャを",
      "`getUserById({ id, includeDeleted }: { id: string; includeDeleted: boolean })` に変更した。",
      "既存の呼び出し箇所はすべて更新が必要。",
    ].join("\n"),
    scoringCriteria: [
      "Score based on: clarity about what changed (old vs new signature),",
      "actionable guidance for callers (must update call sites),",
      "concise and professional phrasing.",
      "A response clearly describing both the signature change and the required action scores 85-100.",
      "Vague responses like 'getUserById API has been updated.' score 10-30.",
    ].join(" "),
  },
  {
    id: "w-hard-2",
    axis: "writing",
    difficulty: 3,
    type: "free_text",
    prompt: "以下の機能要望に対して、丁寧に断るGitHubコメントを英語で1〜2文書いてください。",
    context: [
      "機能要望:",
      "「ダークモードに対応してほしい」というIssueが上がっている。",
      "現時点ではロードマップに含まれておらず、対応予定はない。",
      "ただし、CSSカスタムプロパティを使えばユーザー自身が対応できる。",
    ].join("\n"),
    scoringCriteria: [
      "Score based on: grateful and respectful tone, clear but kind declination,",
      "offering a workaround or alternative, leaving the door open for the future.",
      "Responses that thank the requester, explain out-of-scope, and suggest the CSS workaround score 85-100.",
      "Blunt rejections like 'We will not implement this.' score 10-30.",
    ].join(" "),
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
