import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  DeckCardsResponse,
  PhraseCardWithSrs,
  CardCategory,
} from "@teklin/shared";
import {
  ArrowLeft,
  Terminal,
  GitPullRequest,
  Code,
  Hash,
  AlertCircle,
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

const VALID_CATEGORIES: CardCategory[] = [
  "commit_messages",
  "pr_comments",
  "code_review",
  "slack_chat",
  "github_issues",
];

function getSrsStatus(card: PhraseCardWithSrs): {
  label: string;
  color: string;
} {
  if (!card.srs) {
    return {
      label: "未学習",
      color: "bg-gray-700/50 text-gray-400",
    };
  }
  if (card.srs.interval >= 21) {
    return {
      label: "習得済み",
      color: "bg-emerald-500/20 text-emerald-400",
    };
  }
  return {
    label: "学習中",
    color: "bg-amber-500/20 text-amber-400",
  };
}

function formatNextReview(card: PhraseCardWithSrs): string {
  if (!card.srs) return "---";
  const next = new Date(card.srs.nextReview);
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "今日";
  if (diffDays === 1) return "明日";
  return `${diffDays}日後`;
}

export function DeckCategoryPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { category } = useParams<{ category: string }>();

  const [data, setData] = useState<DeckCardsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValidCategory = VALID_CATEGORIES.includes(category as CardCategory);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!isValidCategory) {
      setError("無効なカテゴリです。");
      setIsLoading(false);
      return;
    }

    apiFetch<DeckCardsResponse>(`/api/cards/deck/${category}`)
      .then((res) => setData(res))
      .catch(() => setError("カード情報の取得に失敗しました。"))
      .finally(() => setIsLoading(false));
  }, [authLoading, user, category, isValidCategory]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-emerald-500"
            role="status"
            aria-label="Loading deck"
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
            {error || "カード情報がありません。"}
          </p>
          <Link
            to="/cards"
            className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            カード一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  const meta = CATEGORY_META[category as CardCategory];
  const Icon = meta?.icon ?? Terminal;
  const label = meta?.label ?? category;

  // Sort: due first (cards with srs.nextReview in the past), then by nextReview ascending
  const sortedCards = [...data.cards].sort((a, b) => {
    if (!a.srs && !b.srs) return 0;
    if (!a.srs) return 1;
    if (!b.srs) return -1;
    return (
      new Date(a.srs.nextReview).getTime() -
      new Date(b.srs.nextReview).getTime()
    );
  });

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <Link
            to="/cards"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            aria-label="カード一覧に戻る"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
              <Icon className="h-5 w-5 text-gray-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100">{label}</h1>
              <p className="text-xs text-gray-500">{data.total} フレーズ</p>
            </div>
          </div>
        </header>

        {/* Card list */}
        {sortedCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="mb-2 text-gray-300">
              このカテゴリにはまだカードがありません
            </p>
            <p className="text-sm text-gray-500">
              レッスンを進めるとカードが追加されます。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedCards.map((card) => {
              const status = getSrsStatus(card);
              const nextReview = formatNextReview(card);

              return (
                <div
                  key={card.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="font-mono text-sm font-medium leading-relaxed text-gray-100">
                      {card.phrase}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-gray-400">
                    {card.translation}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          card.level === "L1"
                            ? "bg-green-500/20 text-green-400"
                            : card.level === "L2"
                              ? "bg-blue-500/20 text-blue-400"
                              : card.level === "L3"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {card.level}
                      </span>
                    </span>
                    {card.srs && (
                      <span className="text-gray-500">
                        次の復習: {nextReview}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
