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
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-violet-500"
            role="status"
            aria-label="Loading history"
          />
          <p className="text-sm text-gray-400">Loading...</p>
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
            to="/rewrite"
            className="inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Back to Rewrite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/rewrite"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            aria-label="Back to Rewrite"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-100">Rewrite History</h1>
        </header>

        {/* Empty State */}
        {!data || data.items.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800">
              <FileText className="h-7 w-7 text-gray-500" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-300">
              No rewrite history yet
            </p>
            <p className="mb-6 text-xs text-gray-500">
              Your rewrite results will appear here.
            </p>
            <Link
              to="/rewrite"
              className="inline-block rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Try AI Rewrite
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-gray-500">
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
      className="group block rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-gray-700 hover:bg-gray-800/80"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
          {CONTEXT_LABELS[item.context]}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {formattedDate} {formattedTime}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-300">{truncated}</p>
    </Link>
  );
}
