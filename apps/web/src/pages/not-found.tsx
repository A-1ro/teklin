import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-bold text-ink">404</p>
        <p className="mt-4 text-base text-ink-2">
          ページが見つかりませんでした。
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-block rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal/90 active:bg-teal"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </main>
  );
}
