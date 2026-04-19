-- Teklin Phrase Cards Seed Data
-- 125 cards across 5 categories, 4 levels, 4 domains
-- Category distribution: 25 cards each
-- Level distribution: roughly even across L1-L4
-- Domain distribution: web-biased, with infra/ml/mobile coverage

INSERT OR IGNORE INTO phrase_cards (id, phrase, translation, context, domain, level, category, created_at) VALUES

-- ============================================================
-- CATEGORY: commit_messages (25 cards)
-- ============================================================

-- L1: commit_messages
('card-cm-001', 'fix: correct typo in README', 'READMEのタイポを修正', 'Commit message for a small documentation correction in the README file', 'web', 'L1', 'commit_messages', 1713139200000),
('card-cm-002', 'feat: add login page', 'ログインページを追加', 'Commit message when adding a new login screen to the application', 'web', 'L1', 'commit_messages', 1713139200000),
('card-cm-003', 'docs: update API reference', 'APIリファレンスを更新', 'Commit message for updating documentation without changing any code logic', 'web', 'L1', 'commit_messages', 1713139200000),
('card-cm-004', 'chore: bump dependencies', '依存関係のバージョンを更新', 'Commit message for routine dependency version upgrades with no feature changes', 'infra', 'L1', 'commit_messages', 1713139200000),
('card-cm-005', 'style: format code with Prettier', 'Prettierでコードをフォーマット', 'Commit message for applying automatic code formatting without logic changes', 'web', 'L1', 'commit_messages', 1713139200000),
('card-cm-006', 'test: add unit tests for auth module', '認証モジュールにユニットテストを追加', 'Commit message when writing new test cases for authentication functions', 'web', 'L1', 'commit_messages', 1713139200000),

-- L2: commit_messages
('card-cm-007', 'refactor: extract validation logic into helper', 'バリデーションロジックをヘルパーに切り出す', 'Commit message for moving inline validation code into a reusable helper function', 'web', 'L2', 'commit_messages', 1713139200000),
('card-cm-008', 'perf: optimize database queries', 'データベースクエリを最適化', 'Commit message for improving slow SQL queries to reduce response time', 'infra', 'L2', 'commit_messages', 1713139200000),
('card-cm-009', 'feat: implement pagination for user list', 'ユーザー一覧にページネーションを実装', 'Commit message for adding pagination support to a large data list endpoint', 'web', 'L2', 'commit_messages', 1713139200000),
('card-cm-010', 'fix: handle null pointer exception in parser', 'パーサーのnullポインタ例外を修正', 'Commit message for adding a null check to prevent a crash in the parsing logic', 'web', 'L2', 'commit_messages', 1713139200000),
('card-cm-011', 'ci: add GitHub Actions workflow for deployment', 'デプロイ用のGitHub Actionsワークフローを追加', 'Commit message for setting up a CI/CD pipeline using GitHub Actions', 'infra', 'L2', 'commit_messages', 1713139200000),
('card-cm-012', 'feat: add dark mode support', 'ダークモードのサポートを追加', 'Commit message for implementing theme switching between light and dark modes', 'mobile', 'L2', 'commit_messages', 1713139200000),

-- L3: commit_messages
('card-cm-013', 'fix: resolve race condition in async handler', '非同期ハンドラーの競合状態を修正', 'Commit message for fixing a timing bug where concurrent requests corrupted shared state', 'web', 'L3', 'commit_messages', 1713139200000),
('card-cm-014', 'feat: implement retry with exponential backoff', '指数バックオフによるリトライを実装', 'Commit message for adding automatic retry logic with increasing delays for failed API calls', 'infra', 'L3', 'commit_messages', 1713139200000),
('card-cm-015', 'refactor: migrate from class components to hooks', 'クラスコンポーネントをHooksに移行', 'Commit message for rewriting legacy React class components using modern function components and hooks', 'web', 'L3', 'commit_messages', 1713139200000),
('card-cm-016', 'perf: replace O(n²) sort with radix sort', 'O(n²)のソートをRadixソートに置き換え', 'Commit message for optimizing a performance bottleneck by switching to a more efficient algorithm', 'ml', 'L3', 'commit_messages', 1713139200000),
('card-cm-017', 'fix: prevent XSS via unsanitized user input', '未サニタイズのユーザー入力によるXSSを防止', 'Commit message for a security patch that adds input sanitization to prevent cross-site scripting', 'web', 'L3', 'commit_messages', 1713139200000),

-- L4: commit_messages
('card-cm-018', 'refactor: decouple auth middleware from session management', '認証ミドルウェアをセッション管理から分離', 'Commit message for separating concerns by splitting tightly coupled authentication and session logic', 'web', 'L4', 'commit_messages', 1713139200000),
('card-cm-019', 'fix: address N+1 query in user listing', 'ユーザー一覧のN+1クエリ問題を修正', 'Commit message for fixing an ORM query that was issuing one extra query per row in a list', 'web', 'L4', 'commit_messages', 1713139200000),
('card-cm-020', 'feat: introduce event sourcing for audit log', '監査ログにイベントソーシングを導入', 'Commit message for replacing direct state mutation with an event-driven audit trail pattern', 'infra', 'L4', 'commit_messages', 1713139200000),
('card-cm-021', 'refactor: apply repository pattern to data access layer', 'データアクセス層にリポジトリパターンを適用', 'Commit message for abstracting database calls behind a repository interface for testability', 'web', 'L4', 'commit_messages', 1713139200000),
('card-cm-022', 'perf: implement connection pooling for DB layer', 'DBレイヤーにコネクションプーリングを実装', 'Commit message for introducing a database connection pool to reduce overhead from repeated connections', 'infra', 'L4', 'commit_messages', 1713139200000),
('card-cm-023', 'feat: add distributed tracing with OpenTelemetry', 'OpenTelemetryによる分散トレーシングを追加', 'Commit message for instrumenting services with OpenTelemetry to enable end-to-end request tracing', 'infra', 'L4', 'commit_messages', 1713139200000),
('card-cm-024', 'refactor: replace ad-hoc error handling with Result type', 'アドホックなエラー処理をResult型に置き換え', 'Commit message for adopting a typed Result/Either pattern to make error handling explicit and composable', 'web', 'L4', 'commit_messages', 1713139200000),
('card-cm-025', 'fix: ensure idempotency of payment webhook handler', '決済Webhookハンドラーのべき等性を保証', 'Commit message for adding deduplication logic so replayed webhook events do not cause duplicate charges', 'web', 'L4', 'commit_messages', 1713139200000),

-- ============================================================
-- CATEGORY: pr_comments (25 cards)
-- ============================================================

-- L1: pr_comments
('card-pr-001', 'LGTM', '承認、問題なし', 'LGTM — no further changes needed, merging this.', 'web', 'L1', 'pr_comments', 1713139200000),
('card-pr-002', 'Looks good to me!', '問題ないと思います！', 'Looks good to me! Nice clean implementation.', 'web', 'L1', 'pr_comments', 1713139200000),
('card-pr-003', 'Could you add a comment here?', 'ここにコメントを追加してもらえますか？', 'Could you add a comment here? This logic is not immediately obvious.', 'web', 'L1', 'pr_comments', 1713139200000),
('card-pr-004', 'Great work!', 'よくできています！', 'Great work! This PR significantly improves readability.', 'web', 'L1', 'pr_comments', 1713139200000),
('card-pr-005', 'Can you add a test for this case?', 'このケースのテストを追加してもらえますか？', 'Can you add a test for this case? Want to make sure we catch regressions.', 'web', 'L1', 'pr_comments', 1713139200000),
('card-pr-006', 'Minor: you might want to rename this variable', '軽微: この変数名を変えた方が良いかもしれません', 'Minor: you might want to rename this variable to better reflect its purpose.', 'web', 'L1', 'pr_comments', 1713139200000),

-- L2: pr_comments
('card-pr-007', 'nit: prefer const over let here', '細かい点: ここではletよりconstを使った方が良いです', 'nit: prefer const over let here since this value is never reassigned.', 'web', 'L2', 'pr_comments', 1713139200000),
('card-pr-008', 'This change might break backward compatibility', 'この変更は後方互換性を壊す可能性があります', 'This change might break backward compatibility for clients using the v1 API endpoint.', 'web', 'L2', 'pr_comments', 1713139200000),
('card-pr-009', 'Blocking: this will cause issues in production', 'ブロッカー: これは本番環境で問題を引き起こします', 'Blocking: this will cause issues in production due to the missing null check.', 'web', 'L2', 'pr_comments', 1713139200000),
('card-pr-010', 'Can we add error handling for the edge case?', 'エッジケースのエラー処理を追加できますか？', 'Can we add error handling for the edge case where the API returns an empty array?', 'web', 'L2', 'pr_comments', 1713139200000),
('card-pr-011', 'This duplicates logic from the utils module', 'これはutilsモジュールのロジックと重複しています', 'This duplicates logic from the utils module — consider importing from there instead.', 'web', 'L2', 'pr_comments', 1713139200000),
('card-pr-012', 'Suggestion: extract this into a separate function', '提案: これを別の関数に切り出してはいかがでしょう', 'Suggestion: extract this into a separate function to improve testability.', 'mobile', 'L2', 'pr_comments', 1713139200000),

-- L3: pr_comments
('card-pr-013', 'Consider using a discriminated union for better type safety', '型安全性を高めるためにDiscriminated Unionの使用を検討してください', 'Consider using a discriminated union for better type safety instead of a boolean flag here.', 'web', 'L3', 'pr_comments', 1713139200000),
('card-pr-014', 'This violates the single responsibility principle', 'これは単一責任の原則に違反しています', 'This violates the single responsibility principle — this class is doing too many things.', 'web', 'L3', 'pr_comments', 1713139200000),
('card-pr-015', 'We should guard against concurrent writes here', 'ここでは同時書き込みに対して保護する必要があります', 'We should guard against concurrent writes here — this is not thread-safe as written.', 'infra', 'L3', 'pr_comments', 1713139200000),
('card-pr-016', 'This approach does not scale beyond a single instance', 'このアプローチはシングルインスタンスを超えてスケールしません', 'This approach does not scale beyond a single instance — we need to externalize state.', 'infra', 'L3', 'pr_comments', 1713139200000),
('card-pr-017', 'Have you considered the memory implications here?', 'ここでのメモリへの影響を考慮しましたか？', 'Have you considered the memory implications here? This could cause an OOM on large datasets.', 'ml', 'L3', 'pr_comments', 1713139200000),
('card-pr-018', 'This could silently swallow exceptions', 'これは例外をサイレントに飲み込む可能性があります', 'This could silently swallow exceptions — please re-throw or log before catching.', 'web', 'L3', 'pr_comments', 1713139200000),

-- L4: pr_comments
('card-pr-019', 'The coupling between these modules concerns me — could we introduce an interface?', 'これらのモジュール間の結合が気になります。インターフェースを導入できますか？', 'The coupling between these modules concerns me — could we introduce an interface to allow future substitution?', 'web', 'L4', 'pr_comments', 1713139200000),
('card-pr-020', 'This leaks the abstraction — callers should not need to know about the underlying implementation', 'これは抽象化が漏れています。呼び出し元は内部実装を知るべきではありません', 'This leaks the abstraction — callers should not need to know about the underlying implementation details.', 'web', 'L4', 'pr_comments', 1713139200000),
('card-pr-021', 'The invariant here is not enforced — what prevents an invalid state?', 'ここの不変条件が強制されていません。無効な状態を何が防ぎますか？', 'The invariant here is not enforced — what prevents an invalid state from being constructed?', 'web', 'L4', 'pr_comments', 1713139200000),
('card-pr-022', 'This is an implicit temporal coupling that will bite us later', 'これは暗黙の時間的結合で、後で問題になります', 'This is an implicit temporal coupling that will bite us later — the order of initialization matters and is not obvious.', 'web', 'L4', 'pr_comments', 1713139200000),
('card-pr-023', 'We should prefer composition over inheritance here', 'ここでは継承より合成を優先すべきです', 'We should prefer composition over inheritance here to avoid tight coupling to the base class behavior.', 'mobile', 'L4', 'pr_comments', 1713139200000),
('card-pr-024', 'This mutation makes the data flow hard to reason about', 'この変更はデータフローの追跡を難しくします', 'This mutation makes the data flow hard to reason about — could we return a new object instead?', 'web', 'L4', 'pr_comments', 1713139200000),
('card-pr-025', 'Approved with nits — feel free to address in a follow-up', '細かい点はあるが承認します。フォローアップで対応してもらえればOKです', 'Approved with nits — feel free to address in a follow-up PR rather than holding this one up.', 'web', 'L4', 'pr_comments', 1713139200000),

-- ============================================================
-- CATEGORY: code_review (25 cards)
-- ============================================================

-- L1: code_review
('card-cr-001', 'This function is too long', 'この関数は長すぎます', 'This function is too long — consider breaking it into smaller, focused functions.', 'web', 'L1', 'code_review', 1713139200000),
('card-cr-002', 'Can you add error handling here?', 'ここにエラー処理を追加してもらえますか？', 'Can you add error handling here? This API call can fail and we need to handle that gracefully.', 'web', 'L1', 'code_review', 1713139200000),
('card-cr-003', 'This variable name is confusing', 'この変数名はわかりにくいです', 'This variable name is confusing — something like userEmail would be clearer than val.', 'web', 'L1', 'code_review', 1713139200000),
('card-cr-004', 'Missing semicolon at the end of the line', '行末のセミコロンが抜けています', 'Missing semicolon at the end of the line — the linter should catch this automatically.', 'web', 'L1', 'code_review', 1713139200000),
('card-cr-005', 'Can we add a comment explaining why this is here?', 'なぜこれがあるのか説明するコメントを追加できますか？', 'Can we add a comment explaining why this is here? The intent is not clear from the code alone.', 'web', 'L1', 'code_review', 1713139200000),
('card-cr-006', 'This is dead code — it is never called', 'これはデッドコードです。呼び出されることはありません', 'This is dead code — it is never called anywhere in the codebase and should be removed.', 'web', 'L1', 'code_review', 1713139200000),

-- L2: code_review
('card-cr-007', 'This might cause a memory leak', 'これはメモリリークを引き起こす可能性があります', 'This might cause a memory leak — the event listener is never removed when the component unmounts.', 'web', 'L2', 'code_review', 1713139200000),
('card-cr-008', 'Consider using a more descriptive variable name', 'より説明的な変数名の使用を検討してください', 'Consider using a more descriptive variable name — arr does not tell us what kind of data it contains.', 'web', 'L2', 'code_review', 1713139200000),
('card-cr-009', 'This hardcoded value should be a constant', 'このハードコードされた値は定数にすべきです', 'This hardcoded value should be a constant — define it at the top of the file with a meaningful name.', 'web', 'L2', 'code_review', 1713139200000),
('card-cr-010', 'This could throw an unhandled promise rejection', 'これは未処理のPromise拒否を引き起こす可能性があります', 'This could throw an unhandled promise rejection — wrap the await call in a try/catch block.', 'web', 'L2', 'code_review', 1713139200000),
('card-cr-011', 'Consider memoizing this computation', 'この計算をメモ化することを検討してください', 'Consider memoizing this computation — it runs on every render even when the input has not changed.', 'web', 'L2', 'code_review', 1713139200000),
('card-cr-012', 'This regex is not anchored — it may match more than intended', 'この正規表現はアンカーがないため、意図より多くにマッチする可能性があります', 'This regex is not anchored — it may match more than intended. Add ^ and $ to constrain the pattern.', 'web', 'L2', 'code_review', 1713139200000),

-- L3: code_review
('card-cr-013', 'This pattern does not scale well with concurrent requests', 'このパターンは並行リクエストにうまくスケールしません', 'This pattern does not scale well with concurrent requests — a shared mutable counter will cause race conditions.', 'infra', 'L3', 'code_review', 1713139200000),
('card-cr-014', 'We should validate the input at the boundary', '境界でインプットを検証すべきです', 'We should validate the input at the boundary before passing it deeper into the system.', 'web', 'L3', 'code_review', 1713139200000),
('card-cr-015', 'This is not resilient to partial failures', 'これは部分的な障害に耐性がありません', 'This is not resilient to partial failures — if step 2 fails, step 1 is already committed and we have no rollback.', 'infra', 'L3', 'code_review', 1713139200000),
('card-cr-016', 'The return type is too broad — narrow it to reflect what is actually returned', '戻り値の型が広すぎます。実際に返されるものを反映して絞り込んでください', 'The return type is too broad — narrow it to reflect what is actually returned for better type inference downstream.', 'web', 'L3', 'code_review', 1713139200000),
('card-cr-017', 'This is a prime candidate for lazy loading', 'これは遅延読み込みの格好の候補です', 'This is a prime candidate for lazy loading — it is a large module only used in a rarely visited route.', 'web', 'L3', 'code_review', 1713139200000),
('card-cr-018', 'Careful — this sort mutates the original array', '注意してください。このソートは元の配列を変更します', 'Careful — this sort mutates the original array. Use [...arr].sort() if you need to preserve the original.', 'web', 'L3', 'code_review', 1713139200000),

-- L4: code_review
('card-cr-019', 'The abstraction leaks implementation details — consider applying the dependency inversion principle', '抽象化が実装の詳細を漏らしています。依存性逆転の原則の適用を検討してください', 'The abstraction leaks implementation details — consider applying the dependency inversion principle to decouple this.', 'web', 'L4', 'code_review', 1713139200000),
('card-cr-020', 'This introduces accidental complexity that the domain does not require', 'これはドメインが必要としない偶有的複雑性を生み出しています', 'This introduces accidental complexity that the domain does not require — simplify by removing the indirection.', 'web', 'L4', 'code_review', 1713139200000),
('card-cr-021', 'The cognitive load here is high — consider breaking this into a pipeline of smaller transformations', 'ここの認知負荷が高いです。より小さな変換のパイプラインに分割することを検討してください', 'The cognitive load here is high — consider breaking this into a pipeline of smaller transformations.', 'ml', 'L4', 'code_review', 1713139200000),
('card-cr-022', 'This is an implicit contract that is easy to violate — make it explicit in the type system', 'これは違反しやすい暗黙の契約です。型システムで明示的にしてください', 'This is an implicit contract that is easy to violate — make it explicit in the type system or with runtime assertions.', 'web', 'L4', 'code_review', 1713139200000),
('card-cr-023', 'This creates a tight feedback loop between layers that should be independent', 'これは独立すべきレイヤー間に密結合したフィードバックループを生み出しています', 'This creates a tight feedback loop between layers that should be independent — invert the dependency.', 'web', 'L4', 'code_review', 1713139200000),
('card-cr-024', 'We are conflating two distinct concerns — separate them for clarity', '2つの異なる関心事を混同しています。明確さのために分離してください', 'We are conflating two distinct concerns — separate them for clarity and to allow each to evolve independently.', 'infra', 'L4', 'code_review', 1713139200000),
('card-cr-025', 'This assumes a specific execution order that is not guaranteed', 'これは保証されていない特定の実行順序を前提としています', 'This assumes a specific execution order that is not guaranteed — make the ordering explicit or remove the dependency.', 'web', 'L4', 'code_review', 1713139200000),

-- ============================================================
-- CATEGORY: slack_chat (25 cards)
-- ============================================================

-- L1: slack_chat
('card-sc-001', 'Heads up', '念のためお知らせします / 注意してください', 'Heads up — the staging environment will be down for maintenance this afternoon.', 'infra', 'L1', 'slack_chat', 1713139200000),
('card-sc-002', 'FYI', '参考までに / ご参考に', 'FYI, I pushed a hotfix to production 10 minutes ago.', 'web', 'L1', 'slack_chat', 1713139200000),
('card-sc-003', 'TL;DR', '要約すると / 長くて読めない人向けのまとめ', 'TL;DR: the bug is a race condition in the payment handler, fix is in review.', 'web', 'L1', 'slack_chat', 1713139200000),
('card-sc-004', 'On it!', '対応します！ / やります！', 'On it! Give me about 30 minutes to look into this.', 'web', 'L1', 'slack_chat', 1713139200000),
('card-sc-005', 'Will do', 'わかりました / やっておきます', 'Will do — I will update the ticket once the fix is deployed.', 'web', 'L1', 'slack_chat', 1713139200000),
('card-sc-006', 'EOD', '今日中に / 本日の営業時間終了まで', 'Can you have the PR ready by EOD? We need it for tomorrow morning''s release.', 'web', 'L1', 'slack_chat', 1713139200000),

-- L2: slack_chat
('card-sc-007', 'FWIW, I think we should...', '参考までに言うと、私は〜すべきだと思います', 'FWIW, I think we should roll back the release rather than hotfixing in place.', 'infra', 'L2', 'slack_chat', 1713139200000),
('card-sc-008', 'Just a heads up, the deploy is running', '念のためお知らせですが、デプロイが実行中です', 'Just a heads up, the deploy is running — expect about 5 minutes of elevated error rates.', 'infra', 'L2', 'slack_chat', 1713139200000),
('card-sc-009', 'Blocked on review', 'レビュー待ちでブロックされています', 'Blocked on review — could someone from the platform team take a look at my PR?', 'web', 'L2', 'slack_chat', 1713139200000),
('card-sc-010', 'Any updates on this?', 'これについて何か進捗はありますか？', 'Any updates on this? The client is asking and I want to give them an ETA.', 'web', 'L2', 'slack_chat', 1713139200000),
('card-sc-011', 'Pinging you for visibility', '認識共有のためにピンしています', 'Pinging you for visibility — this incident is affecting 5% of users.', 'infra', 'L2', 'slack_chat', 1713139200000),
('card-sc-012', 'Can someone take a look when you have a moment?', '手が空いたときに誰か見てもらえますか？', 'Can someone take a look when you have a moment? Nothing urgent, but I am stuck.', 'web', 'L2', 'slack_chat', 1713139200000),

-- L3: slack_chat
('card-sc-013', 'Can we sync on this before EOD?', '今日中にこれについて同期できますか？', 'Can we sync on this before EOD? I have a few questions about the approach before I proceed.', 'web', 'L3', 'slack_chat', 1713139200000),
('card-sc-014', 'I will circle back after investigating', '調査してから改めてご連絡します', 'I will circle back after investigating — need to dig into the logs first.', 'infra', 'L3', 'slack_chat', 1713139200000),
('card-sc-015', 'This is getting traction', 'これは注目を集めています', 'This is getting traction — we have had three separate teams ask about the same feature this week.', 'web', 'L3', 'slack_chat', 1713139200000),
('card-sc-016', 'We need to get ahead of this', 'これに先手を打つ必要があります', 'We need to get ahead of this before it escalates — let''s schedule a postmortem for tomorrow.', 'infra', 'L3', 'slack_chat', 1713139200000),
('card-sc-017', 'Happy to jump on a call if that is easier', '必要であれば喜んで通話に参加します', 'Happy to jump on a call if that is easier — some of this is hard to explain in text.', 'web', 'L3', 'slack_chat', 1713139200000),
('card-sc-018', 'This is on my radar', 'これは把握しています / 注目しています', 'This is on my radar — I am planning to tackle it in the next sprint.', 'web', 'L3', 'slack_chat', 1713139200000),

-- L4: slack_chat
('card-sc-019', 'Let me put together a design doc and we can iterate async', 'デザインドキュメントをまとめますので、非同期でイテレーションしましょう', 'Let me put together a design doc and we can iterate async — no need to schedule a meeting for this.', 'web', 'L4', 'slack_chat', 1713139200000),
('card-sc-020', 'I want to make sure we are aligned on the trade-offs before we commit to this direction', 'この方向性に踏み切る前に、トレードオフについて認識が合っているか確認したいです', 'I want to make sure we are aligned on the trade-offs before we commit to this direction.', 'web', 'L4', 'slack_chat', 1713139200000),
('card-sc-021', 'This deserves a broader conversation with the team', 'これはチーム全体でより広く議論する価値があります', 'This deserves a broader conversation with the team — can we put it on the agenda for the next planning session?', 'web', 'L4', 'slack_chat', 1713139200000),
('card-sc-022', 'We should document the decision and the reasoning behind it', '決定とその根拠をドキュメント化すべきです', 'We should document the decision and the reasoning behind it so future team members have the context.', 'infra', 'L4', 'slack_chat', 1713139200000),
('card-sc-023', 'Let''s table this for now and revisit next quarter', 'これはいったん棚上げにして来四半期に再検討しましょう', 'Let''s table this for now and revisit next quarter when we have more data on actual usage patterns.', 'web', 'L4', 'slack_chat', 1713139200000),
('card-sc-024', 'I think we are solving for the wrong problem here', 'ここでは間違った問題を解決しようとしていると思います', 'I think we are solving for the wrong problem here — let me share some data that reframes the issue.', 'ml', 'L4', 'slack_chat', 1713139200000),
('card-sc-025', 'This has a lot of surface area — we should scope it down before starting', 'これはスコープが広すぎます。始める前に絞り込むべきです', 'This has a lot of surface area — we should scope it down before starting to reduce risk.', 'web', 'L4', 'slack_chat', 1713139200000),

-- ============================================================
-- CATEGORY: github_issues (25 cards)
-- ============================================================

-- L1: github_issues
('card-gi-001', 'Steps to reproduce', '再現手順', 'Steps to reproduce:\n1. Log in as a regular user\n2. Navigate to /settings\n3. Click Save', 'web', 'L1', 'github_issues', 1713139200000),
('card-gi-002', 'Expected behavior', '期待される動作', 'Expected behavior: The user should be redirected to the dashboard after a successful login.', 'web', 'L1', 'github_issues', 1713139200000),
('card-gi-003', 'Actual behavior', '実際の動作', 'Actual behavior: The page shows a blank screen and the console logs an uncaught TypeError.', 'web', 'L1', 'github_issues', 1713139200000),
('card-gi-004', 'Environment', '環境情報', 'Environment: macOS 14.4, Chrome 124, Node.js 20.11.0, app version v2.1.3', 'web', 'L1', 'github_issues', 1713139200000),
('card-gi-005', 'Is this a known issue?', 'これは既知の問題ですか？', 'Is this a known issue? I searched the existing issues but did not find a match.', 'web', 'L1', 'github_issues', 1713139200000),
('card-gi-006', 'Closing as a duplicate of #123', '#123の重複としてクローズします', 'Closing as a duplicate of #123 — please follow that thread for updates.', 'web', 'L1', 'github_issues', 1713139200000),

-- L2: github_issues
('card-gi-007', 'This issue is a blocker for the release', 'この問題はリリースのブロッカーです', 'This issue is a blocker for the release — tagging as P0 and assigning to the on-call engineer.', 'web', 'L2', 'github_issues', 1713139200000),
('card-gi-008', 'Can we prioritize this?', 'これを優先してもらえますか？', 'Can we prioritize this? It is blocking our team''s integration work for the next two weeks.', 'web', 'L2', 'github_issues', 1713139200000),
('card-gi-009', 'This is reproducible 100% of the time', 'これは100%の確率で再現できます', 'This is reproducible 100% of the time on both Chrome and Firefox — not a browser-specific bug.', 'web', 'L2', 'github_issues', 1713139200000),
('card-gi-010', 'Workaround available', '回避策があります', 'Workaround available: disable the feature flag ENABLE_NEW_CHECKOUT until the fix is released.', 'web', 'L2', 'github_issues', 1713139200000),
('card-gi-011', 'Attaching a minimal reproduction', '最小再現コードを添付します', 'Attaching a minimal reproduction — this isolated the issue to the useEffect dependency array.', 'web', 'L2', 'github_issues', 1713139200000),
('card-gi-012', 'This only occurs in production, not staging', 'これは本番環境でのみ発生し、ステージングでは発生しません', 'This only occurs in production, not staging — likely related to a config or environment difference.', 'infra', 'L2', 'github_issues', 1713139200000),

-- L3: github_issues
('card-gi-013', 'This is a regression introduced in v2.3.0', 'これはv2.3.0で導入されたリグレッションです', 'This is a regression introduced in v2.3.0 — the behavior was correct in v2.2.x.', 'web', 'L3', 'github_issues', 1713139200000),
('card-gi-014', 'The root cause is...', '根本原因は〜です', 'The root cause is a missing await on the async validation function, causing it to always return true.', 'web', 'L3', 'github_issues', 1713139200000),
('card-gi-015', 'This intermittently fails under load', 'これは高負荷時に断続的に失敗します', 'This intermittently fails under load — the issue is likely a race condition triggered only with concurrent users.', 'infra', 'L3', 'github_issues', 1713139200000),
('card-gi-016', 'The fix has been merged to main and will ship in the next release', '修正はmainにマージ済みで、次のリリースに含まれます', 'The fix has been merged to main and will ship in the next release, expected next Tuesday.', 'web', 'L3', 'github_issues', 1713139200000),
('card-gi-017', 'Linking the related PR for context', '関連PRをコンテキストとしてリンクします', 'Linking the related PR for context — the fix is straightforward but requires a data migration.', 'web', 'L3', 'github_issues', 1713139200000),
('card-gi-018', 'We need more information to reproduce this', 'これを再現するにはもっと情報が必要です', 'We need more information to reproduce this — could you share the full stack trace and request payload?', 'web', 'L3', 'github_issues', 1713139200000),

-- L4: github_issues
('card-gi-019', 'Proposing an RFC for this architectural change', 'このアーキテクチャ変更についてRFCを提案します', 'Proposing an RFC for this architectural change — please leave feedback by Friday before we proceed.', 'web', 'L4', 'github_issues', 1713139200000),
('card-gi-020', 'This warrants a dedicated spike to explore the solution space', 'これは解決策のスペースを探るための専用スパイクが必要です', 'This warrants a dedicated spike to explore the solution space before we commit to an implementation.', 'infra', 'L4', 'github_issues', 1713139200000),
('card-gi-021', 'The trade-off between correctness and performance needs to be discussed', '正確性とパフォーマンスのトレードオフについて議論が必要です', 'The trade-off between correctness and performance needs to be discussed — both approaches have significant downsides.', 'ml', 'L4', 'github_issues', 1713139200000),
('card-gi-022', 'This exposes a gap in our observability — we could not detect it until a user reported it', 'これはオブザーバビリティのギャップを露呈しています。ユーザーが報告するまで検出できませんでした', 'This exposes a gap in our observability — we could not detect it until a user reported it. Adding alerting is a follow-up.', 'infra', 'L4', 'github_issues', 1713139200000),
('card-gi-023', 'The long-term fix requires deprecating the legacy endpoint', '長期的な修正はレガシーエンドポイントの非推奨化が必要です', 'The long-term fix requires deprecating the legacy endpoint — the short-term patch is in the linked PR.', 'web', 'L4', 'github_issues', 1713139200000),
('card-gi-024', 'Opening this as a tracking issue for the broader initiative', 'より広いイニシアチブのトラッキングイシューとして開きます', 'Opening this as a tracking issue for the broader initiative — sub-tasks are linked below.', 'web', 'L4', 'github_issues', 1713139200000),
('card-gi-025', 'This requires cross-team coordination — tagging the relevant stakeholders', 'これはクロスチームの調整が必要です。関連するステークホルダーをタグ付けします', 'This requires cross-team coordination — tagging the relevant stakeholders for visibility.', 'mobile', 'L4', 'github_issues', 1713139200000)

;
