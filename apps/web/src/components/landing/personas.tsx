const personas = [
  {
    emoji: "🔥",
    name: "情報の遅延に焦る中堅エンジニア",
    age: "30代前半",
    pain: "英語論文や最新ドキュメントの読解に時間がかかり、海外の技術トレンドで後れを取る感覚がある。",
    outcome:
      "Daily 5 Lesson で技術文書特有の語彙を毎日吸収。RFC・論文の読解速度が着実に向上。",
  },
  {
    emoji: "🚀",
    name: "転職準備中の若手フルスタック",
    age: "20代後半",
    pain: "グローバル企業や外資系の面接で、技術的な受け答えを英語で行う自信がない。",
    outcome:
      "AI Rewrite でコードレビュー英語を磨き、プレイスメントテストで現在地を可視化。",
  },
  {
    emoji: "🌱",
    name: "OSS コントリビュートしたいベテラン",
    age: "40代",
    pain: "英語の PR コメントやレビューで、意図したトーンが伝わっているか毎回不安になる。",
    outcome:
      "フレーズカードで PR 慣用句を定着。トーン判定付き添削で失礼でないか確認できる。",
  },
];

export function Personas() {
  return (
    <section
      id="personas"
      aria-labelledby="personas-heading"
      className="border-t border-gray-200 bg-white py-20 sm:py-28 dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            For Engineers Like You
          </p>
          <h2
            id="personas-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-50"
          >
            こんなエンジニアに届けます
          </h2>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {personas.map((persona) => (
            <article
              key={persona.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-900/40"
            >
              <div aria-hidden="true" className="mb-4 text-4xl">
                {persona.emoji}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {persona.name}
              </h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
                {persona.age}
              </p>
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-gray-200">
                    課題
                  </dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-400">
                    {persona.pain}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-blue-700 dark:text-blue-400">
                    Teklin で得られること
                  </dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-400">
                    {persona.outcome}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
