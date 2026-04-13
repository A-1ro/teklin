interface Plan {
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "¥0",
    description: "まずは技術英語学習を始めたい人に。",
    features: [
      "Daily 5 Lesson（毎日1レッスン）",
      "フレーズカード（基本デッキ）",
      "AI Rewrite（3回/日）",
      "プレイスメントテスト",
    ],
    cta: "無料で始める",
    href: "/login",
  },
  {
    name: "Pro",
    price: "¥980",
    priceUnit: "/月",
    description: "本気で継続したいエンジニアに。",
    features: [
      "Free の全機能",
      "AI Rewrite 無制限",
      "全ドメインのレッスン開放",
      "進捗レポート（週次・月次）",
      "優先サポート",
    ],
    cta: "Pro を始める",
    href: "/login",
    highlighted: true,
    badge: "おすすめ",
  },
  {
    name: "Team",
    price: "¥800",
    priceUnit: "/月・人",
    description: "チーム全体で技術英語力を底上げ。",
    features: [
      "Pro の全機能",
      "チーム管理ダッシュボード",
      "メンバー学習状況の可視化",
      "社内フレーズデッキ共有",
      "SSO / SAML 対応",
    ],
    // Team プランの問い合わせフォームは Phase 2 で提供開始予定。それまでは
    // Pro 同様にサインアップ経由で仮受付する想定。
    cta: "まずは無料で始める",
    href: "/login",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28 dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-50"
          >
            シンプルな料金プラン
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Pro / Team は Phase 2
            で提供開始予定。価格は変更される場合があります。
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-blue-600 bg-white shadow-xl ring-1 ring-blue-600 dark:bg-gray-950"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
              }`}
            >
              {plan.badge ? (
                <span className="absolute -top-3 right-8 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              ) : null}

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                  {plan.price}
                </span>
                {plan.priceUnit ? (
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {plan.priceUnit}
                  </span>
                ) : null}
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <svg
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
