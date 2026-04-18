import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  ReviewCardsResponse,
  CardAnswerResponse,
  CardRating,
  PhraseCardWithSrs,
  CardCategory,
  Level,
  Domain,
} from "@teklin/shared";
import { ArrowLeft, RotateCcw, Check } from "lucide-react";

const CATEGORY_LABELS: Record<CardCategory, string> = {
  commit_messages: "コミットメッセージ",
  pr_comments: "PRコメント",
  code_review: "コードレビュー",
  slack_chat: "Slack / チャット",
  github_issues: "GitHub Issues",
};

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  L1: { label: "Starter", color: "bg-green-500/20 text-green-400" },
  L2: { label: "Reader", color: "bg-blue-500/20 text-blue-400" },
  L3: { label: "Writer", color: "bg-purple-500/20 text-purple-400" },
  L4: { label: "Fluent", color: "bg-amber-500/20 text-amber-400" },
};

const DOMAIN_LABELS: Record<Domain, string> = {
  web: "Web",
  infra: "Infra",
  ml: "ML",
  mobile: "Mobile",
};

const RATING_BUTTONS: {
  rating: CardRating;
  label: string;
  estimate: string;
  color: string;
  activeColor: string;
}[] = [
  {
    rating: "again",
    label: "もう一回",
    estimate: "< 1日",
    color:
      "border-rose-800/50 bg-rose-950/30 text-rose-400 hover:bg-rose-950/50",
    activeColor: "bg-rose-600 text-white",
  },
  {
    rating: "hard",
    label: "難しい",
    estimate: "3日",
    color:
      "border-amber-800/50 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50",
    activeColor: "bg-amber-600 text-white",
  },
  {
    rating: "good",
    label: "普通",
    estimate: "7日",
    color:
      "border-blue-800/50 bg-blue-950/30 text-blue-400 hover:bg-blue-950/50",
    activeColor: "bg-blue-600 text-white",
  },
  {
    rating: "easy",
    label: "簡単",
    estimate: "14日",
    color:
      "border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50",
    activeColor: "bg-emerald-600 text-white",
  },
];

export function ReviewPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const [cards, setCards] = useState<PhraseCardWithSrs[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<CardRating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<ReviewCardsResponse>("/api/cards/review")
      .then((res) => {
        setCards(res.cards);
        if (res.cards.length === 0) {
          setIsComplete(true);
        }
      })
      .catch(() => setError("復習カードの取得に失敗しました。"))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  }, [isFlipped]);

  const handleRate = useCallback(
    async (rating: CardRating) => {
      const card = cards[currentIndex];
      if (!card || isSubmitting) return;

      setIsSubmitting(true);

      try {
        await apiFetch<CardAnswerResponse>(`/api/cards/${card.id}/answer`, {
          method: "POST",
          body: JSON.stringify({ rating }),
        });

        setAnswers((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

        const nextIndex = currentIndex + 1;
        if (nextIndex >= cards.length) {
          setIsComplete(true);
        } else {
          setCurrentIndex(nextIndex);
          setIsFlipped(false);
        }
      } catch {
        setError("回答の送信に失敗しました。");
      } finally {
        setIsSubmitting(false);
      }
    },
    [cards, currentIndex, isSubmitting]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isComplete || isSubmitting) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        }
        return;
      }

      if (isFlipped) {
        switch (e.key) {
          case "1":
            handleRate("again");
            break;
          case "2":
            handleRate("hard");
            break;
          case "3":
            handleRate("good");
            break;
          case "4":
            handleRate("easy");
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isComplete, isSubmitting, handleRate]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-emerald-500"
            role="status"
            aria-label="Loading review cards"
          />
          <p className="text-sm text-gray-400">カードを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">{error}</p>
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

  // Completion screen
  if (isComplete) {
    const totalReviewed = Object.values(answers).reduce((a, b) => a + b, 0);

    return (
      <main className="min-h-screen bg-gray-950 px-4 py-8">
        <div className="mx-auto max-w-md">
          <header className="mb-8 flex items-center gap-3">
            <Link
              to="/cards"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              aria-label="カード一覧に戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-100">復習完了</h1>
          </header>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            {totalReviewed === 0 ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-100">
                  今日の復習はすべて完了！
                </h2>
                <p className="mb-6 text-sm text-gray-400">
                  復習待ちのカードはありません。素晴らしいですね！
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-100">
                  お疲れ様でした！
                </h2>
                <p className="mb-6 text-sm text-gray-400">
                  <span className="font-mono font-semibold text-emerald-400">
                    {totalReviewed}
                  </span>{" "}
                  枚のカードを復習しました
                </p>

                {/* Rating breakdown */}
                <div className="mb-6 space-y-2">
                  {RATING_BUTTONS.map(({ rating, label, color }) => {
                    const count = answers[rating];
                    if (count === 0) return null;
                    return (
                      <div
                        key={rating}
                        className="flex items-center justify-between rounded-lg border border-gray-800 px-4 py-2"
                      >
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium ${color}`}
                        >
                          {label}
                        </span>
                        <span className="font-mono text-sm text-gray-300">
                          {count} 枚
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Link
              to="/cards"
              className="inline-block w-full rounded-lg bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-700"
            >
              カード一覧に戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Active review
  const card = cards[currentIndex];
  if (!card) return null;
  const progress = cards.length > 0 ? currentIndex + 1 : 0;
  const levelMeta = LEVEL_META[card.level];

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/cards"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              aria-label="カード一覧に戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-100">復習</h1>
          </div>
          <span className="font-mono text-sm text-gray-400">
            {progress} / {cards.length}
          </span>
        </header>

        {/* Progress bar */}
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${(currentIndex / cards.length) * 100}%`,
            }}
          />
        </div>

        {/* Flashcard */}
        <div
          className="perspective-[1000px] mb-6"
          style={{ perspective: "1000px" }}
        >
          <button
            type="button"
            onClick={handleFlip}
            disabled={isFlipped}
            className="relative w-full cursor-pointer disabled:cursor-default"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
            aria-label={
              isFlipped ? "カードの裏面" : "タップしてカードをめくる"
            }
          >
            {/* Card Front */}
            <div
              className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
                  {CATEGORY_LABELS[card.category]}
                </span>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelMeta.color}`}
                >
                  {card.level}
                </span>
              </div>

              {/* Japanese translation */}
              <div className="flex min-h-[120px] items-center justify-center py-6">
                <p className="text-center text-xl font-semibold leading-relaxed text-gray-100">
                  {card.translation}
                </p>
              </div>

              {/* Hint */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <RotateCcw className="h-4 w-4" />
                <span>タップしてめくる</span>
              </div>
            </div>

            {/* Card Back */}
            <div
              className="absolute inset-0 rounded-2xl border border-emerald-800/30 bg-gray-900 p-6"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {/* Domain badge */}
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                  {DOMAIN_LABELS[card.domain]}
                </span>
              </div>

              {/* English phrase */}
              <div className="flex min-h-[80px] items-center justify-center py-4">
                <p className="text-center font-mono text-lg font-semibold leading-relaxed text-gray-100">
                  {card.phrase}
                </p>
              </div>

              {/* Context */}
              <div className="mt-4 rounded-lg bg-gray-800/50 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                  使用例
                </p>
                <p className="text-sm leading-relaxed text-gray-300">
                  {card.context}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Rating buttons — shown only when flipped */}
        <div
          className={`grid grid-cols-4 gap-2 transition-all duration-300 ${
            isFlipped
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          {RATING_BUTTONS.map(({ rating, label, estimate, color }, index) => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              disabled={!isFlipped || isSubmitting}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200 disabled:opacity-50 ${color}`}
              aria-label={`${label} (${estimate}後に復習)`}
            >
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] opacity-70">{estimate}</span>
              <span className="hidden text-[10px] opacity-40 sm:block">
                [{index + 1}]
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
