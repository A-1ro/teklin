import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  PlacementAnswerReview,
  PlacementResultResponse,
  SkillAxis,
} from "@teklin/shared";

const LEVEL_LABELS: Record<string, { en: string; ja: string }> = {
  L1: { en: "Starter", ja: "Beginner" },
  L2: { en: "Reader", ja: "Intermediate" },
  L3: { en: "Writer", ja: "Advanced" },
  L4: { en: "Fluent", ja: "Expert" },
};

const AXIS_LABELS: Record<SkillAxis, { en: string; ja: string; icon: string }> =
  {
    reading: { en: "Reading", ja: "Reading", icon: "reading" },
    writing: { en: "Writing", ja: "Writing", icon: "writing" },
    vocabulary: { en: "Vocabulary", ja: "Vocabulary", icon: "vocabulary" },
    nuance: { en: "Nuance", ja: "Nuance", icon: "nuance" },
  };

const WEAKNESS_ADVICE: Record<SkillAxis, string> = {
  reading: "Practice reading PRs, docs, and changelogs daily.",
  writing: "Focus on writing concise commit messages and PR descriptions.",
  vocabulary: "Build familiarity with common technical terms and idioms.",
  nuance: "Pay attention to tone differences in code reviews vs Slack.",
};

function AxisIcon({ axis }: { axis: string }) {
  switch (axis) {
    case "reading":
      return (
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
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      );
    case "writing":
      return (
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
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
          />
        </svg>
      );
    case "vocabulary":
      return (
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
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      );
    case "nuance":
      return (
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
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function scoreBarColor(score: number): string {
  if (score >= 70) return "bg-teal";
  if (score >= 40) return "bg-mustard";
  return "bg-coral";
}

function scoreBadgeColor(score: number): string {
  if (score >= 70) return "text-teal";
  if (score >= 40) return "text-mustard-fg";
  return "text-coral";
}

export function PlacementResultPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [result, setResult] = useState<PlacementResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<PlacementResultResponse>("/api/placement/result")
      .then((data) => setResult(data))
      .catch(() => setError("Failed to load results."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-teal"
          role="status"
          aria-label="Loading results"
        />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="mb-4 text-ink-2">{error || "No results found."}</p>
          <Link
            to="/placement"
            className="inline-block rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark"
          >
            Take the Test
          </Link>
        </div>
      </main>
    );
  }

  const levelLabel = LEVEL_LABELS[result.level] ?? {
    en: result.level,
    ja: result.level,
  };
  const axisEntries = (
    Object.entries(result.scores) as [SkillAxis, number][]
  ).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-ink">Placement Result</h1>
        </header>

        {/* Level card */}
        <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-3">
            Your Level
          </p>
          <p className="mb-1 font-mono text-4xl font-bold text-ink">
            {result.level}
          </p>
          <p className="text-lg text-ink-2">{levelLabel.en}</p>
          <p className="mt-1 text-sm text-ink-3">
            {result.totalQuestions} questions completed
          </p>
        </div>

        {/* Score bars */}
        <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-2">
            Skill Scores
          </h2>
          <div className="space-y-4">
            {axisEntries.map(([axis, score]) => {
              const label = AXIS_LABELS[axis];
              return (
                <div key={axis}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <AxisIcon axis={axis} />
                      {label.en}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold ${scoreBadgeColor(score)}`}
                    >
                      {score}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-rule">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${scoreBarColor(score)}`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weaknesses */}
        {result.weaknesses.length > 0 && (
          <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-2">
              Areas to Improve
            </h2>
            <div className="space-y-3">
              {result.weaknesses.map((axis) => {
                const label = AXIS_LABELS[axis];
                const advice = WEAKNESS_ADVICE[axis];
                return (
                  <div
                    key={axis}
                    className="flex items-start gap-3 rounded-[14px] border border-rule bg-paper px-4 py-3"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-mustard-fg">
                      <AxisIcon axis={axis} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {label.en}
                      </p>
                      <p className="text-sm text-ink-2">{advice}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Answer review */}
        {result.answers && result.answers.length > 0 && (
          <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-2">
              Answer Review
            </h2>
            <div className="space-y-4">
              {result.answers.map((review: PlacementAnswerReview) => {
                const axisMeta = AXIS_LABELS[review.axis];
                const isSkip = review.isSkip;
                const correctChoice = review.choices?.find(
                  (c) => c.id === review.correctChoiceId
                );
                const userChoice = review.choices?.find(
                  (c) => c.id === review.userAnswer
                );
                const isCorrect =
                  !isSkip &&
                  review.type === "multiple_choice" &&
                  review.userAnswer === review.correctChoiceId;

                return (
                  <div
                    key={review.questionId}
                    className="rounded-[14px] border border-rule bg-paper p-4"
                  >
                    {/* Header: axis + result indicator */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-3">
                        {axisMeta.en}
                      </span>
                      {isSkip ? (
                        <span className="text-xs text-ink-3">スキップ</span>
                      ) : review.type === "multiple_choice" ? (
                        <span
                          className={`text-xs font-bold ${isCorrect ? "text-teal" : "text-coral"}`}
                        >
                          {isCorrect ? "正解" : "不正解"}
                        </span>
                      ) : (
                        <span
                          className={`font-mono text-xs font-bold ${scoreBadgeColor(review.score)}`}
                        >
                          {review.score}
                        </span>
                      )}
                    </div>

                    {/* Question prompt */}
                    <p className="mb-3 text-sm text-ink">{review.prompt}</p>

                    {/* MC: your answer + correct answer */}
                    {review.type === "multiple_choice" && !isSkip && (
                      <div className="space-y-1 text-xs">
                        <div className="flex gap-2">
                          <span className="w-16 flex-shrink-0 text-ink-3">あなた:</span>
                          <span
                            className={
                              isCorrect ? "text-teal" : "text-coral"
                            }
                          >
                            {userChoice?.text ?? review.userAnswer}
                          </span>
                        </div>
                        {!isCorrect && correctChoice && (
                          <div className="flex gap-2">
                            <span className="w-16 flex-shrink-0 text-ink-3">正解:</span>
                            <span className="text-teal">
                              {correctChoice.text}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Free text: your answer + advice */}
                    {review.type === "free_text" && !isSkip && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-ink-3">あなた: </span>
                          <span className="font-mono text-ink">
                            {review.userAnswer}
                          </span>
                        </div>
                        {review.advice && (
                          <div className="rounded-lg bg-paper-2 px-3 py-2 text-ink-2">
                            {review.advice}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skip */}
                    {isSkip && (
                      <p className="text-xs text-ink-3">回答なし</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="block w-full rounded-lg bg-teal px-6 py-3 text-center text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
          >
            Start Learning
          </Link>
          <Link
            to="/placement"
            className="block w-full rounded-lg border border-rule px-6 py-3 text-center text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            Retake Test
          </Link>
        </div>
      </div>
    </main>
  );
}
