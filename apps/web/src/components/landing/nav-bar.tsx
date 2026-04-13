export function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

        <nav
          aria-label="メインナビゲーション"
          className="hidden items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300 md:flex"
        >
          <a
            href="#features"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            機能
          </a>
          <a
            href="#why"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            なぜTeklin
          </a>
          <a
            href="#personas"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            対象ユーザー
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            料金
          </a>
        </nav>

        <a
          href="/login"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          無料で始める
        </a>
      </div>
    </header>
  );
}
