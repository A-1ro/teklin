import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function scoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function scoreBadgeColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
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
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
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
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">{error || "No results found."}</p>
          <Link
            to="/placement"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
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

        {/* Level card */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            Your Level
          </p>
          <p className="mb-1 font-mono text-4xl font-bold text-gray-100">
            {result.level}
          </p>
          <p className="text-lg text-gray-300">{levelLabel.en}</p>
          <p className="mt-1 text-sm text-gray-500">
            {result.totalQuestions} questions completed
          </p>
        </div>

        {/* Score bars */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Skill Scores
          </h2>
          <div className="space-y-4">
            {axisEntries.map(([axis, score]) => {
              const label = AXIS_LABELS[axis];
              return (
                <div key={axis}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-300">
                      <AxisIcon axis={axis} />
                      {label.en}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold ${scoreBadgeColor(score)}`}
                    >
                      {score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${scoreColor(score)}`}
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
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Areas to Improve
            </h2>
            <div className="space-y-3">
              {result.weaknesses.map((axis) => {
                const label = AXIS_LABELS[axis];
                const advice = WEAKNESS_ADVICE[axis];
                return (
                  <div
                    key={axis}
                    className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950 px-4 py-3"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-amber-400">
                      <AxisIcon axis={axis} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">
                        {label.en}
                      </p>
                      <p className="text-sm text-gray-400">{advice}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Answer review */}
        {result.answers && result.answers.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
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
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                  >
                    {/* Header: axis + result indicator */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        {axisMeta.en}
                      </span>
                      {isSkip ? (
                        <span className="text-xs text-gray-600">スキップ</span>
                      ) : review.type === "multiple_choice" ? (
                        <span
                          className={`text-xs font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}
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
                    <p className="mb-3 text-sm text-gray-300">{review.prompt}</p>

                    {/* MC: your answer + correct answer */}
                    {review.type === "multiple_choice" && !isSkip && (
                      <div className="space-y-1 text-xs">
                        <div className="flex gap-2">
                          <span className="w-16 flex-shrink-0 text-gray-500">あなた:</span>
                          <span
                            className={
                              isCorrect ? "text-green-400" : "text-red-400"
                            }
                          >
                            {userChoice?.text ?? review.userAnswer}
                          </span>
                        </div>
                        {!isCorrect && correctChoice && (
                          <div className="flex gap-2">
                            <span className="w-16 flex-shrink-0 text-gray-500">正解:</span>
                            <span className="text-green-400">
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
                          <span className="text-gray-500">あなた: </span>
                          <span className="font-mono text-gray-300">
                            {review.userAnswer}
                          </span>
                        </div>
                        {review.advice && (
                          <div className="rounded-lg bg-gray-900 px-3 py-2 text-gray-400">
                            💡 {review.advice}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skip */}
                    {isSkip && (
                      <p className="text-xs text-gray-600">回答なし</p>
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
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
          >
            Start Learning
          </Link>
          <Link
            to="/placement"
            className="block w-full rounded-lg border border-gray-700 px-6 py-3 text-center text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
          >
            Retake Test
          </Link>
        </div>
      </div>
    </main>
  );
}
