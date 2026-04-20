import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  LessonHistoryResponse,
  LessonHistoryItem,
  Domain,
  DifficultyFeedback,
  RewriteContext,
} from "@teklin/shared";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";

const DOMAIN_LABELS: Record<Domain, string> = {
  web: "Web",
  infra: "Infra",
  ml: "ML",
  mobile: "Mobile",
};

const CONTEXT_LABELS: Record<RewriteContext, string> = {
  commit_message: "Commit Message",
  pr_comment: "PR Comment",
  github_issue: "GitHub Issue",
  slack: "Slack",
  general: "General",
};

const FEEDBACK_LABELS: Record<DifficultyFeedback, string> = {
  too_easy: "Easy",
  just_right: "Good",
  too_hard: "Hard",
};

const FEEDBACK_COLORS: Record<DifficultyFeedback, string> = {
  too_easy: "text-emerald-400",
  just_right: "text-blue-400",
  too_hard: "text-orange-400",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function LessonHistoryPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [data, setData] = useState<LessonHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<LessonHistoryResponse>("/api/lessons/history")
      .then((res) => setData(res))
      .catch(() => setError("Failed to load lesson history."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
            role="status"
            aria-label="Loading history"
          />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">{error}</p>
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

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-100">Lesson History</h1>
        </header>

        {!data || data.items.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800">
              <BookOpen className="h-7 w-7 text-gray-500" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-300">
              No completed lessons yet
            </p>
            <p className="mb-6 text-xs text-gray-500">
              Complete your first lesson and it will appear here.
            </p>
            <Link
              to="/lesson"
              className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Start Today&apos;s Lesson
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-gray-500">
              {data.total} lesson{data.total !== 1 ? "s" : ""} completed
            </p>
            <div className="space-y-3">
              {data.items.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function HistoryCard({ item }: { item: LessonHistoryItem }) {
  const date = new Date(item.completedAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      to={`/lesson/${item.lessonId}`}
      className="group block rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-gray-700 hover:bg-gray-800/80"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
            {DOMAIN_LABELS[item.domain]}
          </span>
          {item.context && (
            <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
              {CONTEXT_LABELS[item.context]}
            </span>
          )}
          <span className="text-xs text-gray-500">{item.level}</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {formattedDate} {formattedTime}
        </span>
      </div>

      <p className="mb-2 text-sm font-medium text-gray-200">
        {item.focusPhrase || "Lesson"}
      </p>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${scoreColor(item.score)}`}>
          {item.score}%
        </span>
        {item.feedback && (
          <span
            className={`text-xs ${FEEDBACK_COLORS[item.feedback]}`}
          >
            {FEEDBACK_LABELS[item.feedback]}
          </span>
        )}
      </div>
    </Link>
  );
}
