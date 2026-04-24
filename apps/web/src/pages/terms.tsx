import { useEffect } from "react";
import { Link } from "react-router-dom";

export function TermsPage() {
  useEffect(() => {
    document.title = "利用規約 | Teklin";
  }, []);

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-10">
          <Link to="/" className="text-sm text-ink-3 hover:text-ink-2">
            ← ホームに戻る
          </Link>
        </nav>

        <h1 className="mb-2 text-3xl font-bold text-ink">利用規約</h1>
        <p className="mb-10 text-sm text-ink-3">最終更新: 2026年4月</p>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第1条 総則
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            本利用規約（以下「本規約」）は、Teklin（以下「当サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で当サービスを利用するものとします。当サービスは、ソフトウェアエンジニアを対象としたAIを活用したテクニカル英語学習アプリです。本規約はユーザーと運営者との間の法的な合意を構成します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第2条 アカウント登録
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            当サービスを利用するには、所定の方法によりアカウント登録を行う必要があります。ユーザーは以下の事項に同意するものとします。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>登録情報は正確かつ最新の情報を入力すること</li>
            <li>
              アカウントの認証情報（パスワード等）は自己の責任で管理すること
            </li>
            <li>
              アカウントの不正利用が判明した場合は直ちに運営者に通知すること
            </li>
            <li>
              1人のユーザーが複数のアカウントを保有しないこと（特段の許可がある場合を除く）
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第3条 サービスの利用
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            ユーザーは、当サービスを個人の学習目的に限り利用できます。当サービスが提供する機能（レッスン、SRS単語カード、リライト練習等）は、ユーザー自身の技術英語学習のためにのみ使用するものとします。
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            当サービスの利用にあたっては、適用されるすべての法令および本規約を遵守するものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第4条 禁止事項
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            ユーザーは以下の行為を行ってはなりません。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>当サービスの運営を妨害する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>
              当サービスのコンテンツを無断で複製・転載・販売・配布する行為
            </li>
            <li>
              リバースエンジニアリング、逆コンパイル、その他当サービスの解析を行う行為
            </li>
            <li>自動化ツール等を用いた大量アクセスや不正なデータ収集行為</li>
            <li>法令または公序良俗に反する行為</li>
            <li>運営者が不適切と判断するその他の行為</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第5条 知的財産権
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            当サービス上のコンテンツ（テキスト、画像、音声、AIが生成した学習素材等を含む）に関する著作権その他の知的財産権は、運営者または正当な権利者に帰属します。ユーザーは、本規約で明示的に許可された範囲を超えてこれらを利用することはできません。ユーザーが当サービスに入力したテキスト等に関する権利はユーザー自身に帰属しますが、ユーザーはサービス改善目的での匿名化利用について許諾するものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第6条 免責事項
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            当サービスは現状有姿で提供されます。運営者は以下の事項について保証しません。
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>当サービスが中断なく、エラーなく継続して提供されること</li>
            <li>
              AIが提供する学習コンテンツの正確性・完全性・特定目的への適合性
            </li>
            <li>当サービスの利用により期待する学習効果が得られること</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            運営者は、当サービスの利用に起因するいかなる損害（直接・間接・特別・偶発的・結果的損害を含む）についても、法令上責任を負う場合を除き、責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第7条 サービスの変更・終了
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            運営者は、ユーザーへの事前通知をもって、当サービスの内容を変更し、または当サービスの提供を終了することができます。緊急性が高い場合や技術的な理由がある場合は、事前通知なしにサービスを一時停止または変更することがあります。これらによりユーザーに生じた損害について、運営者は責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-rule pb-2 text-lg font-semibold text-ink">
            第8条 準拠法・管轄裁判所
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            本規約は日本法に準拠し、日本法に従って解釈されます。本規約または当サービスに関して生じた紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>
      </div>
    </div>
  );
}
