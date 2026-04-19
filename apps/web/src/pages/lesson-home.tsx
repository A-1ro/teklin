import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { TodayLessonResponse, Level } from "@teklin/shared";

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  L1: { label: "Starter", color: "bg-green-500/20 text-green-400" },
  L2: { label: "Reader", color: "bg-blue-500/20 text-blue-400" },
  L3: { label: "Writer", color: "bg-purple-500/20 text-purple-400" },
  L4: { label: "Fluent", color: "bg-amber-500/20 text-amber-400" },
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  rewrite: "Rewrite",
  reading: "Reading",
  listening: "Listening",
};

export function LessonHomePage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<TodayLessonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<TodayLessonResponse>("/api/lessons/today")
      .then((res) => setData(res))
      .catch(() => setError("Failed to load today's lesson."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
            role="status"
            aria-label="Loading lesson"
          />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">
            {error || "No lesson available."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { lesson, streak, isCompleted } = data;
  const levelMeta = lesson ? LEVEL_META[lesson.level] : null;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Teklin</h1>
          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            Dashboard
          </Link>
        </header>

        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="Fire streak">
                {streak.currentStreak > 0 ? "\uD83D\uDD25" : "\u2744\uFE0F"}
              </span>
              <div>
                <p className="font-mono text-2xl font-bold text-gray-100">
                  {streak.currentStreak}
                </p>
                <p className="text-sm text-gray-400">day streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Best
              </p>
              <p className="font-mono text-lg font-semibold text-gray-300">
                {streak.longestStreak}
              </p>
            </div>
          </div>
        </div>

        {lesson ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {levelMeta && (
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelMeta.color}`}
                >
                  {lesson.level} {levelMeta.label}
                </span>
              )}
              <span className="inline-block rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
                {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
              </span>
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-100">
              Today&apos;s Lesson
            </h2>
            <p className="mb-2 text-base text-gray-300">
              {lesson.content.focus.phrase}
            </p>
            <p className="mb-6 text-sm text-gray-400">
              {lesson.content.focus.explanation.length > 120
                ? lesson.content.focus.explanation.slice(0, 120) + "..."
                : lesson.content.focus.explanation}
            </p>

            <div className="mb-6 flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                5 min
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                  />
                </svg>
                4 steps
              </span>
            </div>

            {isCompleted ? (
              <div className="rounded-lg border border-green-800 bg-green-950/30 px-6 py-4 text-center">
                <p className="flex items-center justify-center gap-2 text-sm font-semibold text-green-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  完了済み
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  お疲れさまでした！明日また新しいレッスンが届きます。
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/lesson/${lesson.id}?review=true`)}
                  className="mt-3 text-xs text-gray-500 underline underline-offset-2 hover:text-gray-300"
                >
                  もう一度見る
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/lesson/${lesson.id}`)}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
              >
                Start Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
            <p className="mb-2 text-gray-300">No lesson available today.</p>
            <p className="text-sm text-gray-500">
              Check back later or contact support.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
