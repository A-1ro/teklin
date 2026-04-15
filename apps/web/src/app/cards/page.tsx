"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { CardStatsResponse, CardCategory } from "@teklin/shared";
import {
  Terminal,
  GitPullRequest,
  Code,
  Hash,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

const CATEGORY_META: Record<
  CardCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  commit_messages: { label: "コミットメッセージ", icon: Terminal },
  pr_comments: { label: "PRコメント", icon: GitPullRequest },
  code_review: { label: "コードレビュー", icon: Code },
  slack_chat: { label: "Slack / チャット", icon: Hash },
  github_issues: { label: "GitHub Issues", icon: AlertCircle },
};

const CATEGORY_ORDER: CardCategory[] = [
  "commit_messages",
  "pr_comments",
  "code_review",
  "slack_chat",
  "github_issues",
];

export default function CardsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const [stats, setStats] = useState<CardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<CardStatsResponse>("/api/cards/stats")
      .then((res) => setStats(res))
      .catch(() => setError("カード情報の取得に失敗しました。"))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-emerald-500"
            role="status"
            aria-label="Loading cards"
          />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !stats) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">
            {error || "カード情報がありません。"}
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </main>
    );
  }

  const totalProgress =
    stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              aria-label="ダッシュボードに戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-100">フレーズカード</h1>
          </div>
        </header>

        {/* Today's Review CTA */}
        {stats.dueToday > 0 ? (
          <Link
            href="/cards/review"
            className="mb-6 block rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-6 transition-colors hover:border-emerald-700/50 hover:bg-emerald-950/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <RotateCcw className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-100">
                    今日の復習
                  </p>
                  <p className="text-sm text-gray-400">
                    <span className="font-mono font-semibold text-emerald-400">
                      {stats.dueToday}
                    </span>{" "}
                    枚のカードが待っています
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500">
                復習を始める
              </span>
            </div>
          </Link>
        ) : (
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800">
                <CheckCircle2 className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-100">
                  今日の復習は完了
                </p>
                <p className="text-sm text-gray-400">
                  お疲れ様でした！明日またチェックしてください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                習得済み
              </p>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
              {stats.mastered}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                学習中
              </p>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-amber-400">
              {stats.learning}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                未学習
              </p>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-gray-400">
              {stats.unseen}
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">全体の進捗</span>
            <span className="font-mono text-gray-300">{totalProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
            カテゴリ
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORY_ORDER.map((category) => {
              const meta = CATEGORY_META[category];
              const catStats = stats.byCategory[category];
              const Icon = meta.icon;
              const catTotal = catStats?.total ?? 0;
              const catMastered = catStats?.mastered ?? 0;
              const catLearning = catStats?.learning ?? 0;
              const catUnseen = catStats?.unseen ?? 0;
              const catProgress =
                catTotal > 0 ? Math.round((catMastered / catTotal) * 100) : 0;

              return (
                <Link
                  key={category}
                  href={`/cards/deck/${category}`}
                  className="group rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all duration-300 hover:border-gray-700 hover:bg-gray-800/80"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 transition-colors group-hover:bg-gray-700">
                      <Icon className="h-5 w-5 text-gray-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-100">
                        {meta.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {catTotal} フレーズ
                      </p>
                    </div>
                  </div>

                  {/* Category progress bar */}
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${catProgress}%` }}
                    />
                  </div>

                  {/* Category stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      {catMastered}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                      {catLearning}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-600" />
                      {catUnseen}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
