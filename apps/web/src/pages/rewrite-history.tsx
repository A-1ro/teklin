import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  RewriteHistoryResponse,
  RewriteHistoryItem,
  RewriteContext,
} from "@teklin/shared";
import { ArrowLeft, Clock, FileText } from "lucide-react";

const CONTEXT_LABELS: Record<RewriteContext, string> = {
  commit_message: "Commit Message",
  pr_comment: "PR Comment",
  github_issue: "GitHub Issue",
  slack: "Slack Message",
  general: "General",
};

export function RewriteHistoryPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const [data, setData] = useState<RewriteHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<RewriteHistoryResponse>("/api/rewrite/history")
      .then((res) => setData(res))
      .catch(() => setError("Failed to load rewrite history."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-plum"
            role="status"
            aria-label="Loading history"
          />
          <p className="text-sm text-ink-2">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="mb-4 text-ink-2">{error}</p>
          <Link
            to="/rewrite"
            className="inline-block rounded-lg bg-plum px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            Back to Rewrite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/rewrite"
            className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            aria-label="Back to Rewrite"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-ink">Rewrite History</h1>
        </header>

        {/* Empty State */}
        {!data || data.items.length === 0 ? (
          <div className="rounded-[14px] border border-rule bg-paper-2 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rule">
              <FileText className="h-7 w-7 text-ink-3" />
            </div>
            <p className="mb-1 text-sm font-medium text-ink">
              No rewrite history yet
            </p>
            <p className="mb-6 text-xs text-ink-3">
              Your rewrite results will appear here.
            </p>
            <Link
              to="/rewrite"
              className="inline-block rounded-lg bg-plum px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              Try AI Rewrite
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-ink-3">
              {data.total} rewrite{data.total !== 1 ? "s" : ""} total
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

function HistoryCard({ item }: { item: RewriteHistoryItem }) {
  const truncated =
    item.originalText.length > 120
      ? item.originalText.slice(0, 120) + "..."
      : item.originalText;

  const date = new Date(item.createdAt);
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
      to={`/rewrite/history/${item.id}`}
      className="group block rounded-[14px] border border-rule bg-paper-2 p-4 transition-all hover:border-ink-3 hover:bg-rule/40"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-2">
          {CONTEXT_LABELS[item.context]}
        </span>
        <span className="flex items-center gap-1 text-xs text-ink-3">
          <Clock className="h-3 w-3" />
          {formattedDate} {formattedTime}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-ink">{truncated}</p>
    </Link>
  );
}
