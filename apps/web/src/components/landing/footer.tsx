// 著作権表示の年。Cloudflare Pages の静的プリレンダリングで固定されるため、
// 毎年リリース時に更新する。`new Date().getFullYear()` だと年またぎでビルド
// し直さない限り古い年が残るリスクがあるためハードコード。
const COPYRIGHT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <a
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100"
              aria-label="Teklin ホーム"
            >
              <span
                aria-hidden="true"
                className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              Teklin
            </a>
            <p className="mt-3 max-w-md text-sm text-gray-600 dark:text-gray-400">
              エンジニアのための技術英語特化AI学習アプリ。
              <br />
              1日5分、PR・コミット・Slack・Issue の英語に自信を。
            </p>
          </div>

          <nav
            aria-label="フッターナビゲーション"
            className="flex flex-wrap gap-x-8 gap-y-3 text-sm"
          >
            <a
              href="/terms"
              className="rounded text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:text-gray-400 dark:hover:text-gray-100"
            >
              利用規約
            </a>
            <a
              href="/privacy"
              className="rounded text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:text-gray-400 dark:hover:text-gray-100"
            >
              プライバシーポリシー
            </a>
            <a
              href="https://github.com/a-1ro/teklin"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:text-gray-400 dark:hover:text-gray-100"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-8 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
          &copy; {COPYRIGHT_YEAR} Teklin. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
