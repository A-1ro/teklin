-- Seed additional phrase cards for ml and mobile domains
-- ml:     5 → 20 cards (+15)
-- mobile: 4 → 20 cards (+16)
-- Covers all 5 categories across L1–L4 for both domains

INSERT OR IGNORE INTO phrase_cards (id, phrase, translation, context, domain, level, category, created_at) VALUES

-- ============================================================
-- ML — commit_messages  (existing: L3 → adding L1, L2, L4)
-- ============================================================
('card-cm-ml-01', 'feat: add data preprocessing script', 'データ前処理スクリプトを追加', 'Commit message for adding an initial data cleaning and preprocessing step to the ML pipeline', 'ml', 'L1', 'commit_messages', 1745280000000),
('card-cm-ml-02', 'fix: handle missing values in feature engineering pipeline', '特徴量エンジニアリングパイプラインの欠損値処理を修正', 'Commit message for adding imputation logic to prevent errors when input data has null fields', 'ml', 'L2', 'commit_messages', 1745280000000),
('card-cm-ml-03', 'refactor: replace manual feature engineering with learned embeddings', '手動特徴量エンジニアリングを学習済み埋め込みに置き換え', 'Commit message for removing hand-crafted feature transformations in favour of end-to-end learned representations', 'ml', 'L4', 'commit_messages', 1745280000000),

-- ============================================================
-- ML — pr_comments  (existing: L3 → adding L1, L2, L4)
-- ============================================================
('card-pr-ml-01', 'Can you add a docstring for this model class?', 'このモデルクラスにdocstringを追加してもらえますか？', 'Can you add a docstring for this model class? The parameters and expected input shapes are not obvious.', 'ml', 'L1', 'pr_comments', 1745280000000),
('card-pr-ml-02', 'Have you checked for data leakage in the train/test split?', '学習/テスト分割でデータリークがないか確認しましたか？', 'Have you checked for data leakage in the train/test split? Scaling before splitting would leak validation statistics.', 'ml', 'L2', 'pr_comments', 1745280000000),
('card-pr-ml-03', 'This feature selection step may introduce target leakage — use a pipeline to ensure proper cross-validation', 'この特徴量選択ステップはターゲットリークを引き起こす可能性があります。適切なクロスバリデーションのためにパイプラインを使用してください', 'This feature selection step may introduce target leakage — use a pipeline to ensure proper cross-validation boundaries.', 'ml', 'L4', 'pr_comments', 1745280000000),

-- ============================================================
-- ML — code_review  (existing: L4 → adding L1, L2, L3)
-- ============================================================
('card-cr-ml-01', 'The learning rate is hardcoded — make it a configurable parameter', '学習率がハードコードされています。設定可能なパラメータにしてください', 'The learning rate is hardcoded — make it a configurable parameter so experiments can be tracked properly.', 'ml', 'L1', 'code_review', 1745280000000),
('card-cr-ml-02', 'Consider normalizing the input features before training to improve convergence', '収束を改善するために学習前に入力特徴量を正規化することを検討してください', 'Consider normalizing the input features before training to improve convergence and reduce sensitivity to learning rate.', 'ml', 'L2', 'code_review', 1745280000000),
('card-cr-ml-03', 'This metric does not account for class imbalance — use F1-score or AUC-ROC instead', 'この評価指標はクラスの不均衡を考慮していません。代わりにF1スコアまたはAUC-ROCを使用してください', 'This metric does not account for class imbalance — use F1-score or AUC-ROC instead of raw accuracy.', 'ml', 'L3', 'code_review', 1745280000000),

-- ============================================================
-- ML — slack_chat  (existing: L4 → adding L1, L2, L3)
-- ============================================================
('card-sc-ml-01', 'The training job just finished', '学習ジョブが終了しました', 'The training job just finished — final validation loss is 0.032.', 'ml', 'L1', 'slack_chat', 1745280000000),
('card-sc-ml-02', 'Training took longer than expected — GPU memory was the bottleneck', '学習が予想より長くかかりました。GPUメモリがボトルネックでした', 'Training took longer than expected — GPU memory was the bottleneck, had to reduce batch size to 32.', 'ml', 'L2', 'slack_chat', 1745280000000),
('card-sc-ml-03', 'We are seeing distribution shift in the production data — model performance is degrading', '本番データに分布のシフトが見られます。モデルのパフォーマンスが低下しています', 'We are seeing distribution shift in the production data — model performance is degrading and we need to trigger a retraining run.', 'ml', 'L3', 'slack_chat', 1745280000000),

-- ============================================================
-- ML — github_issues  (existing: L4 → adding L1, L2, L3)
-- ============================================================
('card-gi-ml-01', 'Model predictions are all returning the same value', 'モデルの予測が全て同じ値を返しています', 'Model predictions are all returning the same value — looks like the model may not have trained correctly.', 'ml', 'L1', 'github_issues', 1745280000000),
('card-gi-ml-02', 'Inference latency is too high for real-time use cases', 'リアルタイムのユースケースには推論レイテンシが高すぎます', 'Inference latency is too high for real-time use cases — p99 is 800ms, target is under 100ms.', 'ml', 'L2', 'github_issues', 1745280000000),
('card-gi-ml-03', 'Model accuracy drops significantly after retraining on new data — possible catastrophic forgetting', '新しいデータで再学習後にモデルの精度が大幅に低下しています。壊滅的忘却の可能性があります', 'Model accuracy drops significantly after retraining on new data — possible catastrophic forgetting of the original distribution.', 'ml', 'L3', 'github_issues', 1745280000000),

-- ============================================================
-- Mobile — commit_messages  (existing: L2 → adding L1, L3, L4)
-- ============================================================
('card-cm-mob-01', 'fix: correct button padding on small screens', '小さい画面でのボタンのパディングを修正', 'Commit message for fixing a layout issue where buttons were clipped on devices with screens narrower than 360dp', 'mobile', 'L1', 'commit_messages', 1745280000000),
('card-cm-mob-02', 'fix: resolve memory leak in background fetch handler', 'バックグラウンドフェッチハンドラーのメモリリークを修正', 'Commit message for releasing a retained reference that was preventing the background fetch handler from being deallocated', 'mobile', 'L3', 'commit_messages', 1745280000000),
('card-cm-mob-03', 'refactor: migrate navigation to deep-link-first architecture', 'ナビゲーションをディープリンクファーストアーキテクチャに移行', 'Commit message for restructuring navigation so every screen is reachable via a URI, enabling full deep-link support', 'mobile', 'L4', 'commit_messages', 1745280000000),

-- ============================================================
-- Mobile — pr_comments  (existing: L2, L4 → adding L1, L3)
-- ============================================================
('card-pr-mob-01', 'Have you tested this on both iOS and Android?', 'iOSとAndroidの両方でテストしましたか？', 'Have you tested this on both iOS and Android? The animation API behaves differently across platforms.', 'mobile', 'L1', 'pr_comments', 1745280000000),
('card-pr-mob-02', 'This heavy operation on the main thread will cause dropped frames — move it to a background thread', 'メインスレッドでのこの重い処理はフレームドロップを引き起こします。バックグラウンドスレッドに移してください', 'This heavy operation on the main thread will cause dropped frames — move it to a background thread or use an async task.', 'mobile', 'L3', 'pr_comments', 1745280000000),

-- ============================================================
-- Mobile — code_review  (existing: none → adding L1, L2, L3, L4)
-- ============================================================
('card-cr-mob-01', 'Handle the case where the user denies the permission request', 'ユーザーが権限リクエストを拒否した場合を処理してください', 'Handle the case where the user denies the permission request — the app should degrade gracefully, not crash.', 'mobile', 'L1', 'code_review', 1745280000000),
('card-cr-mob-02', 'This will cause unnecessary re-renders — consider using memo or a selector', 'これは不要な再レンダリングを引き起こします。memoやセレクターの使用を検討してください', 'This will cause unnecessary re-renders — consider using memo or a selector to avoid cascading updates.', 'mobile', 'L2', 'code_review', 1745280000000),
('card-cr-mob-03', 'Avoid blocking the main thread — offload this computation to a background isolate', 'メインスレッドをブロックするのを避けてください。この計算をバックグラウンドのアイソレートにオフロードしてください', 'Avoid blocking the main thread — offload this computation to a background isolate to keep the UI responsive.', 'mobile', 'L3', 'code_review', 1745280000000),
('card-cr-mob-04', 'This navigation pattern breaks the platform back-gesture contract — iOS users expect swipe-to-go-back here', 'このナビゲーションパターンはプラットフォームのバックジェスチャーの規約を壊しています。iOSユーザーはここでスワイプバックを期待します', 'This navigation pattern breaks the platform back-gesture contract — iOS users expect swipe-to-go-back to work on this screen.', 'mobile', 'L4', 'code_review', 1745280000000),

-- ============================================================
-- Mobile — slack_chat  (existing: none → adding L1, L2, L3, L4)
-- ============================================================
('card-sc-mob-01', 'The app store build is live', 'App Storeのビルドが公開されました', 'The app store build is live — v2.4.1 is now available for download.', 'mobile', 'L1', 'slack_chat', 1745280000000),
('card-sc-mob-02', 'We submitted the binary to App Store review — should hear back within 24-48 hours', 'App Storeのレビューにバイナリを提出しました。24〜48時間以内に連絡が来るはずです', 'We submitted the binary to App Store review — should hear back within 24-48 hours based on current review times.', 'mobile', 'L2', 'slack_chat', 1745280000000),
('card-sc-mob-03', 'The release was rejected — the in-app purchase flow needs to match the latest App Store guidelines', 'リリースが却下されました。アプリ内購入フローを最新のApp Storeガイドラインに合わせる必要があります', 'The release was rejected — the in-app purchase flow needs to match the latest App Store guidelines before resubmission.', 'mobile', 'L3', 'slack_chat', 1745280000000),
('card-sc-mob-04', 'We need OTA update capability to ship hotfixes without going through app store review every time', 'App Storeのレビューを毎回経ずにホットフィックスを配布できるようにOTAアップデート機能が必要です', 'We need OTA update capability to ship hotfixes without going through app store review every time — let''s evaluate CodePush.', 'mobile', 'L4', 'slack_chat', 1745280000000),

-- ============================================================
-- Mobile — github_issues  (existing: L4 → adding L1, L2, L3)
-- ============================================================
('card-gi-mob-01', 'App crashes on startup for devices running iOS 16', 'iOS 16を実行しているデバイスで起動時にアプリがクラッシュします', 'App crashes on startup for devices running iOS 16 — not reproducible on iOS 17. Attaching crash log.', 'mobile', 'L1', 'github_issues', 1745280000000),
('card-gi-mob-02', 'Push notifications are not delivered when the app is in the background on Android 13+', 'Android 13以降でアプリがバックグラウンドにある場合にプッシュ通知が届きません', 'Push notifications are not delivered when the app is in the background on Android 13+ — likely a missing POST_NOTIFICATIONS permission.', 'mobile', 'L2', 'github_issues', 1745280000000),
('card-gi-mob-03', 'Deep links stop working after upgrading from v1 to v2 — the URI scheme changed without a migration path', 'v1からv2にアップグレードするとディープリンクが機能しなくなります。移行パスなしにURIスキームが変更されました', 'Deep links stop working after upgrading from v1 to v2 — the URI scheme changed without a migration path for existing bookmarks.', 'mobile', 'L3', 'github_issues', 1745280000000)

;
