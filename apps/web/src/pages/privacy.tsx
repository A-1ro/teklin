import { useEffect } from "react";
import { Link } from "react-router-dom";

export function PrivacyPage() {
  useEffect(() => {
    document.title = "プライバシーポリシー | Teklin";
  }, []);

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-10">
          <Link to="/" className="text-sm text-ink-3 hover:text-ink-2">
            ← ホームに戻る
          </Link>
        </nav>

        <h1 className="mb-2 text-3xl font-bold text-ink">
          プライバシーポリシー
        </h1>
        <p className="mb-10 text-sm text-ink-3">最終更新: 2026年4月</p>

        <p className="mb-10 text-sm leading-relaxed text-ink-2">
          Teklin（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の適切な保護に努めます。本プライバシーポリシーは、当サービスが収集する情報およびその利用方法について説明します。
        </p>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            1. 収集する情報
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            当サービスは以下の情報を収集します。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>
              <span className="font-medium text-ink">アカウント情報:</span>{" "}
              OAuth認証（Google等）を通じて取得するメールアドレス、表示名、プロフィール画像URL
            </li>
            <li>
              <span className="font-medium text-ink">学習データ:</span>{" "}
              レッスン履歴、SRS（間隔反復）カードの学習進捗、リライト練習の入力・スコア
            </li>
            <li>
              <span className="font-medium text-ink">利用状況データ:</span>{" "}
              アクセス日時、学習ストリーク、機能の利用頻度
            </li>
            <li>
              <span className="font-medium text-ink">技術情報:</span>{" "}
              ブラウザの種類、OSの情報、IPアドレス（ログ管理目的）
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            2. 情報の利用目的
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            収集した情報は以下の目的で利用します。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>当サービスの提供・運営・改善</li>
            <li>ユーザーへのパーソナライズされた学習コンテンツの提供</li>
            <li>SRSアルゴリズムによる最適な復習スケジュールの計算</li>
            <li>学習進捗のトラッキングおよびフィードバックの提供</li>
            <li>不正利用の検知・防止およびセキュリティの確保</li>
            <li>サービスに関する重要なお知らせの送信</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            3. 情報の第三者提供
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            当サービスは、以下の場合を除き、収集した個人情報を第三者に提供しません。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>ユーザーの同意がある場合</li>
            <li>
              法令に基づき開示が必要な場合（裁判所・行政機関からの要請等）
            </li>
            <li>
              当サービスの運営に必要な業務委託先（クラウドインフラ、AI処理等）への提供。この場合、適切な秘密保持契約を締結します
            </li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            当サービスはCloudflare社のインフラ（Workers、D1、KV、R2、AI
            Gateway）およびOpenAI社のAPIを利用しています。これらのサービスプロバイダーのプライバシーポリシーも適用される場合があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            4. 情報の管理
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            当サービスは、収集した個人情報の安全管理のために適切な技術的・組織的措置を講じます。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>通信の暗号化（HTTPS/TLS）</li>
            <li>アクセス制御による不正アクセスの防止</li>
            <li>定期的なセキュリティレビュー</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            ユーザーはアカウント設定からご自身のデータの確認・削除を請求することができます。アカウントを削除した場合、関連する個人情報は合理的な期間内に削除されます（法令上の保存義務がある情報を除く）。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            5. クッキー・類似技術の使用
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            当サービスは、セッション管理およびユーザー体験の向上を目的として、クッキー（Cookie）およびローカルストレージを使用します。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>
              <span className="font-medium text-ink">セッションクッキー:</span>{" "}
              ログイン状態の維持に使用します
            </li>
            <li>
              <span className="font-medium text-ink">ローカルストレージ:</span>{" "}
              UI設定や一時的な学習データのキャッシュに使用します
            </li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            ブラウザの設定によりクッキーを無効にすることができますが、一部のサービス機能が正常に動作しなくなる場合があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            6. お問い合わせ
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            本プライバシーポリシーに関するご質問・個人情報の開示・訂正・削除のご要望は、当サービスのサポート窓口までお問い合わせください。本ポリシーは必要に応じて改定されることがあります。重要な変更がある場合は、サービス内でご通知します。
          </p>
        </section>
      </div>
    </div>
  );
}
