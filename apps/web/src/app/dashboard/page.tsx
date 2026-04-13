"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { TodayLessonResponse } from "@teklin/shared";

const LEVEL_LABELS: Record<string, string> = {
  L1: "L1 - Starter",
  L2: "L2 - Reader",
  L3: "L3 - Writer",
  L4: "L4 - Fluent",
};

const DOMAIN_LABELS: Record<string, string> = {
  web: "Web Dev",
  infra: "Infrastructure",
  ml: "Machine Learning",
  mobile: "Mobile",
};

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const [lessonData, setLessonData] = useState<TodayLessonResponse | null>(
    null
  );
  const [lessonLoading, setLessonLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;

    apiFetch<TodayLessonResponse>("/api/lessons/today")
      .then((res) => setLessonData(res))
      .catch(() => {
        // Silently fail -- lesson card will just not show
      })
      .finally(() => setLessonLoading(false));
  }, [isLoading, user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
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

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Teklin</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            Logout
          </button>
        </header>

        {/* Welcome card */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {initials}
              </span>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-100">
                Welcome, {user.name}!
              </p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Level
            </p>
            <p className="text-lg font-semibold text-gray-100">
              {LEVEL_LABELS[user.level] ?? user.level}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Domain
            </p>
            <p className="text-lg font-semibold text-gray-100">
              {DOMAIN_LABELS[user.domain] ?? user.domain}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Streak
            </p>
            <p className="text-lg font-semibold text-gray-100">
              {lessonData ? (
                <span className="flex items-center gap-1">
                  <span role="img" aria-label="Fire">
                    {lessonData.streak.currentStreak > 0
                      ? "\uD83D\uDD25"
                      : "\u2744\uFE0F"}
                  </span>
                  <span className="font-mono">
                    {lessonData.streak.currentStreak}
                  </span>
                </span>
              ) : lessonLoading ? (
                <span className="inline-block h-5 w-8 animate-pulse rounded bg-gray-800" />
              ) : (
                <span className="text-gray-500">--</span>
              )}
            </p>
          </div>
        </div>

        {/* Today's Lesson */}
        <TodayLessonCard data={lessonData} isLoading={lessonLoading} />

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href="/placement"
            className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center transition-colors hover:border-gray-700 hover:bg-gray-800"
          >
            <p className="text-sm font-semibold text-gray-200">
              Placement Test
            </p>
            <p className="mt-1 text-xs text-gray-500">Retake or view results</p>
          </Link>
          <Link
            href="/lesson"
            className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center transition-colors hover:border-gray-700 hover:bg-gray-800"
          >
            <p className="text-sm font-semibold text-gray-200">All Lessons</p>
            <p className="mt-1 text-xs text-gray-500">View lesson details</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Today's Lesson card (dashboard sub-component)
// ---------------------------------------------------------------------------

function TodayLessonCard({
  data,
  isLoading,
}: {
  data: TodayLessonResponse | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex animate-pulse flex-col gap-3">
          <div className="h-4 w-32 rounded bg-gray-800" />
          <div className="h-6 w-48 rounded bg-gray-800" />
          <div className="h-4 w-64 rounded bg-gray-800" />
          <div className="mt-2 h-10 w-full rounded-lg bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!data || !data.lesson) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="mb-1 text-sm text-gray-400">No lesson available today</p>
        <p className="text-xs text-gray-500">Check back later!</p>
      </div>
    );
  }

  const { lesson, isCompleted } = data;

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isCompleted
          ? "border-green-800/50 bg-green-950/20"
          : "border-blue-800 bg-blue-950/40"
      }`}
    >
      <p
        className={`mb-1 text-xs font-medium uppercase tracking-wider ${
          isCompleted ? "text-green-500" : "text-blue-400"
        }`}
      >
        Today&apos;s Lesson
      </p>

      <p className="mb-1 text-base font-semibold text-gray-100">
        {lesson.content.focus.phrase}
      </p>
      <p className="mb-4 text-sm text-gray-400">
        {lesson.content.focus.explanation.length > 100
          ? lesson.content.focus.explanation.slice(0, 100) + "..."
          : lesson.content.focus.explanation}
      </p>

      {isCompleted ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-green-800 bg-green-950/30 px-4 py-2.5 text-sm font-semibold text-green-400">
          <svg
            className="h-4 w-4"
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
          Completed
        </div>
      ) : (
        <Link
          href={`/lesson/${lesson.id}`}
          className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          Start Lesson
        </Link>
      )}
    </div>
  );
}
