export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">Teklin</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          コードを書くように、英語を書けるエンジニアになる。
        </p>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-500">
          1日5分、AIが伴走する技術英語特化アプリ
        </p>
        <div className="mt-8">
          <a
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            無料で始める
          </a>
        </div>
      </div>
    </main>
  );
}
