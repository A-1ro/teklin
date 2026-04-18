import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import type { PlacementNextResponse } from "@teklin/shared";

const SKILL_AXES = [
  {
    key: "reading",
    label: "Reading",
    ja: "Reading",
    description: "技術ドキュメントやPRの読解力",
    icon: (
      <svg
        className="h-5 w-5 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
  },
  {
    key: "writing",
    label: "Writing",
    ja: "Writing",
    description: "コミットメッセージやPRコメントの記述力",
    icon: (
      <svg
        className="h-5 w-5 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
        />
      </svg>
    ),
  },
  {
    key: "vocabulary",
    label: "Vocabulary",
    ja: "Vocabulary",
    description: "技術英語の語彙と表現パターン",
    icon: (
      <svg
        className="h-5 w-5 text-purple-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
  },
  {
    key: "nuance",
    label: "Nuance",
    ja: "Nuance",
    description: "文脈に応じた適切なトーンの判断力",
    icon: (
      <svg
        className="h-5 w-5 text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
  },
] as const;

export function PlacementPage() {
  const { user, isLoading } = useRequireAuth();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [hasResult, setHasResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has a placement result
  useEffect(() => {
    apiFetch<unknown>("/api/placement/result")
      .then(() => setHasResult(true))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setHasResult(false);
        }
      });
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    try {
      await apiFetch<PlacementNextResponse>("/api/placement/start", {
        method: "POST",
      });
      navigate("/placement/test");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "テストの開始に失敗しました。もう一度お試しください。"
          : "予期しないエラーが発生しました。"
      );
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
          role="status"
          aria-label="Loading"
        />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Teklin</h1>
          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            Dashboard
          </Link>
        </header>

        {/* Main card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-100">
            Placement Test
          </h2>
          <p className="mb-6 text-gray-400">
            Measure your technical English skill across 4 axes.
          </p>

          {/* 4 skill axes */}
          <div className="mb-6 space-y-3">
            {SKILL_AXES.map((axis) => (
              <div
                key={axis.key}
                className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950 px-4 py-3"
              >
                <span className="mt-0.5 flex-shrink-0">{axis.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-100">
                    {axis.label}
                  </p>
                  <p className="text-sm text-gray-400">{axis.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Meta info */}
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
              About 5 min
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
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
              20 questions
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                Starting...
              </span>
            ) : (
              "Start Test"
            )}
          </button>

          {/* Previous result link */}
          {hasResult && (
            <div className="mt-4 text-center">
              <Link
                to="/placement/result"
                className="text-sm text-blue-400 underline-offset-4 transition-colors hover:text-blue-300 hover:underline"
              >
                View Previous Result
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
