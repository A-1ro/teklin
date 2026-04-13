const pillars = [
  {
    title: "技術現場に特化",
    description:
      "Duolingo の観光英語ではなく、PR・コミット・Issue など、エンジニアが毎日書く文脈だけに焦点を絞る。",
  },
  {
    title: "5分で続けられる",
    description:
      "忙しい実務の合間に毎日回せる設計。Warm-up から Wrap-up まで、通勤や休憩時間で完結。",
  },
  {
    title: "適応型パーソナライズ",
    description:
      "L1〜L4 の4段階と4軸の弱点分析で、あなたの現在地に最適化されたレッスンのみを届ける。",
  },
  {
    title: "実務ですぐ使える",
    description:
      "AI Rewrite は実際の PR 英文を添削。学習が即座にアウトプットに繋がる、閉じた学習ループ。",
  },
];

const comparisons = [
  {
    name: "Duolingo",
    issue: "観光・日常会話が中心で技術文脈が無い",
  },
  {
    name: "Speak",
    issue: "発話重視でライティング弱。PRコメントは学べない",
  },
  {
    name: "ChatGPT",
    issue: "添削はできるが、学習履歴・進捗・カリキュラムが無い",
  },
];

export function WhyTeklin() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28 dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Why Teklin
          </p>
          <h2
            id="why-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-50"
          >
            なぜ Teklin なのか？
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            既存の英語学習サービスでは埋まらない、エンジニアのための空白地帯。
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950"
            >
              <div
                aria-hidden="true"
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-mono text-sm font-bold text-white"
              >
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* vs ChatGPT / others */}
        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950 sm:p-10">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            既存ツールとの違い
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            ChatGPT で添削できるなら Teklin は不要？ ―
            「継続」と「進捗」が違います。
          </p>
          <ul className="mt-6 space-y-4">
            {comparisons.map((item) => (
              <li
                key={item.name}
                className="flex items-start gap-4 border-l-2 border-gray-200 pl-4 dark:border-gray-800"
              >
                <span className="min-w-[90px] text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.issue}
                </span>
              </li>
            ))}
            <li className="flex items-start gap-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <span className="min-w-[90px] text-sm font-semibold text-blue-700 dark:text-blue-300">
                Teklin
              </span>
              <span className="text-sm text-blue-900 dark:text-blue-200">
                学習履歴・SRS・レベル判定・弱点分析を持ち、毎日5分の継続ループを設計。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
