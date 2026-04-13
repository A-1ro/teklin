interface Feature {
  title: string;
  tag: string;
  description: string;
  bullets: string[];
  icon: string;
}

const features: Feature[] = [
  {
    title: "Daily 5 Lesson",
    tag: "F1",
    description:
      "プレイスメントテスト結果に基づき、あなたのレベルと弱点に合わせた5分完結のパーソナライズレッスンを毎日配信。",
    bullets: [
      "Warm-up → Focus → Practice → Wrap-up の4ステップ",
      "コミット・PR・Issue・Slack の実践的な例文",
      "難易度フィードバックで週次にレベル自動調整",
    ],
    icon: "📅",
  },
  {
    title: "技術英語フレーズカード",
    tag: "F2",
    description:
      "LGTM / nit: / Heads up など、技術現場で使われる定型フレーズを間隔反復（SRS）で効率的に暗記。",
    bullets: [
      "SM-2 アルゴリズムで最適な復習タイミング",
      "カテゴリ別: Commit / PR / Review / Slack / Issue",
      "100枚以上のレベル別フレーズカードを収録",
    ],
    icon: "🃏",
  },
  {
    title: "AI Rewrite",
    tag: "F3",
    description:
      "あなたが書いた英文をLLMが技術現場で自然な表現に添削。変更理由とトーン判定で納得して改善。",
    bullets: [
      "コミット・PR・Issue・Slack ごとに最適化",
      "差分ハイライト＋理由付き解説",
      "「この表現を覚える」でフレーズカードに保存",
    ],
    icon: "✍️",
  },
  {
    title: "プレイスメントテスト",
    tag: "F0",
    description:
      "リーディング・ライティング・語彙・ニュアンスの4軸で技術英語レベルを5分以内に測定。L1〜L4 を自動判定。",
    bullets: [
      "適応型出題で最小の問題数で正確に測定",
      "弱点ドメイン × 弱点スキルを特定",
      "結果に基づきレッスン内容を初期設定",
    ],
    icon: "🎯",
  },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-t border-gray-200 bg-white py-20 sm:py-28 dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Features
          </p>
          <h2
            id="features-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-50"
          >
            エンジニアの現場に特化した4つの機能
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            PR・コミット・Slack・Issue ― 実務で必要な技術英語を、最短距離で。
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl dark:bg-blue-950/40"
                >
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {feature.tag}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
