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
  too_easy: "text-teal",
  just_right: "text-teal",
  too_hard: "text-coral",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-teal";
  if (score >= 50) return "text-mustard-fg";
  return "text-coral";
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
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-teal"
            role="status"
            aria-label="Loading history"
          />
          <p className="text-sm text-ink-2">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="mb-4 text-ink-2">{error}</p>
          <Link
            to="/dashboard"
            className="inline-block rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-ink">Lesson History</h1>
        </header>

        {!data || data.items.length === 0 ? (
          <div className="rounded-[14px] border border-rule bg-paper-2 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rule">
              <BookOpen className="h-7 w-7 text-ink-3" />
            </div>
            <p className="mb-1 text-sm font-medium text-ink">
              No completed lessons yet
            </p>
            <p className="mb-6 text-xs text-ink-3">
              Complete your first lesson and it will appear here.
            </p>
            <Link
              to="/lesson"
              className="inline-block rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark"
            >
              Start Today&apos;s Lesson
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-ink-3">
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
      className="group block rounded-[14px] border border-rule bg-paper-2 p-4 transition-all hover:border-ink-3 hover:bg-rule/40"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-2">
            {DOMAIN_LABELS[item.domain]}
          </span>
          {item.context && (
            <span className="inline-flex items-center rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-2">
              {CONTEXT_LABELS[item.context]}
            </span>
          )}
          <span className="text-xs text-ink-3">{item.level}</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-ink-3">
          <Clock className="h-3 w-3" />
          {formattedDate} {formattedTime}
        </span>
      </div>

      <p className="mb-2 text-sm font-medium text-ink">
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
