import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { FlameIcon } from "@/components/icons/flame-icon";
import { TekkiCheer } from "@/components/mascot/Tekki";
import type { TodayLessonResponse, Level } from "@teklin/shared";

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  L1: { label: "Starter", color: "bg-teal-50 text-teal" },
  L2: { label: "Reader", color: "bg-teal-50 text-teal" },
  L3: { label: "Writer", color: "bg-plum-50 text-plum" },
  L4: { label: "Fluent", color: "bg-mustard-50 text-mustard-fg" },
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
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<TodayLessonResponse | { status: "generating" }>("/api/lessons/today")
      .then((res) => {
        if ("status" in res) {
          setIsGenerating(true);
        } else {
          setData(res);
        }
      })
      .catch(() => setError("Failed to load today's lesson."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(() => {
      apiFetch<TodayLessonResponse | { status: "generating" }>("/api/lessons/today")
        .then((res) => {
          if (!("status" in res)) {
            setData(res);
            setIsGenerating(false);
          }
        })
        .catch(() => setIsGenerating(false));
    }, 5000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-teal"
            role="status"
            aria-label="Loading lesson"
          />
          <p className="text-sm text-ink-2">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isGenerating) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-teal"
          role="status"
          aria-label="Generating lesson"
        />
        <p className="text-sm text-ink-2">今日のレッスンを生成中です...</p>
        <p className="mt-1 text-xs text-ink-3">しばらくお待ちください</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center">
        <p className="mb-4 text-ink-2">
          {error || "レッスンが見つかりません。"}
        </p>
        <Link
          to="/dashboard"
          className="inline-block rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    );
  }

  const { lesson, streak, isCompleted } = data;
  const levelMeta = lesson ? LEVEL_META[lesson.level] : null;

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlameIcon
                size={32}
                className={
                  streak.currentStreak > 0
                    ? "text-coral"
                    : "text-ink-3"
                }
              />
              <div>
                <p className="font-mono text-2xl font-bold text-ink">
                  {streak.currentStreak}
                </p>
                <p className="text-sm text-ink-2">day streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-3">
                Best
              </p>
              <p className="font-mono text-lg font-semibold text-ink-2">
                {streak.longestStreak}
              </p>
            </div>
          </div>
        </div>

        {lesson ? (
          <div className="relative rounded-[14px] border border-rule bg-paper-2 p-6">
            {isCompleted && (
              <div
                className="pointer-events-none absolute"
                style={{ top: -12, right: 24 }}
              >
                <TekkiCheer size={110} />
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {levelMeta && (
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelMeta.color}`}
                >
                  {lesson.level} {levelMeta.label}
                </span>
              )}
              <span className="inline-block rounded-full bg-rule px-3 py-1 text-xs font-semibold text-ink-2">
                {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
              </span>
            </div>

            <h2 className="mb-2 text-xl font-bold text-ink">
              Today&apos;s Lesson
            </h2>
            <p className="mb-2 text-base text-ink">
              {lesson.content.focus.phrase}
            </p>
            <p className="mb-6 text-sm text-ink-2">
              {lesson.content.focus.explanation.length > 120
                ? lesson.content.focus.explanation.slice(0, 120) + "..."
                : lesson.content.focus.explanation}
            </p>

            <div className="mb-6 flex items-center gap-6 text-sm text-ink-2">
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
                約5分
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
                {lesson.content.warmup.questions.length + lesson.content.practice.exercises.length}問
              </span>
            </div>

            {isCompleted ? (
              <div className="rounded-lg border border-teal bg-teal-50 px-6 py-4 text-center">
                <p className="flex items-center justify-center gap-2 text-sm font-semibold text-teal">
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
                <p className="mt-1 text-xs text-ink-2">
                  お疲れさまでした！明日また新しいレッスンが届きます。
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/lesson/${lesson.id}?review=true`)}
                  className="mt-3 text-xs text-ink-3 underline underline-offset-2 hover:text-ink-2"
                >
                  もう一度見る
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/lesson/${lesson.id}`)}
                className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
              >
                Start Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-[14px] border border-rule bg-paper-2 p-6 text-center">
            <p className="mb-2 text-ink">No lesson available today.</p>
            <p className="text-sm text-ink-3">
              Check back later or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
