import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { MarkdownText } from "@/components/markdown-text";
import type {
  RewriteContext,
  RewriteResult,
  RewriteRequestPayload,
  RewriteRemainingResponse,
  RewriteTone,
} from "@teklin/shared";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Save,
  Sparkles,
  X,
} from "lucide-react";

const CONTEXT_OPTIONS: { value: RewriteContext; label: string }[] = [
  { value: "commit_message", label: "Commit Message" },
  { value: "pr_comment", label: "PR Comment" },
  { value: "github_issue", label: "GitHub Issue" },
  { value: "slack", label: "Slack Message" },
  { value: "general", label: "General" },
];

const CONTEXT_LABELS: Record<RewriteContext, string> = {
  commit_message: "Commit Message",
  pr_comment: "PR Comment",
  github_issue: "GitHub Issue",
  slack: "Slack Message",
  general: "General",
};

const TONE_STYLES: Record<
  RewriteTone,
  { bg: string; text: string; border: string }
> = {
  friendly: {
    bg: "bg-green-900/50",
    text: "text-green-400",
    border: "border-green-800",
  },
  professional: {
    bg: "bg-blue-900/50",
    text: "text-blue-400",
    border: "border-blue-800",
  },
  too_casual: {
    bg: "bg-yellow-900/50",
    text: "text-yellow-400",
    border: "border-yellow-800",
  },
  too_formal: {
    bg: "bg-orange-900/50",
    text: "text-orange-400",
    border: "border-orange-800",
  },
  neutral: {
    bg: "bg-gray-800",
    text: "text-gray-400",
    border: "border-gray-700",
  },
};

const TONE_LABELS: Record<RewriteTone, string> = {
  friendly: "Friendly",
  professional: "Professional",
  too_casual: "Too Casual",
  too_formal: "Too Formal",
  neutral: "Neutral",
};

interface SaveCardState {
  changeIndex: number;
  phrase: string;
  translation: string;
  isSaving: boolean;
  error: string | null;
  saved: boolean;
}

type RewriteResponse = RewriteResult & { id: string };

export function RewritePage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const [text, setText] = useState("");
  const [context, setContext] = useState<RewriteContext>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [remaining, setRemaining] = useState<RewriteRemainingResponse | null>(
    null
  );
  const [remainingLoading, setRemainingLoading] = useState(true);
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(
    new Set()
  );
  const [saveCard, setSaveCard] = useState<SaveCardState | null>(null);

  // Fetch remaining count
  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<RewriteRemainingResponse>("/api/rewrite/remaining")
      .then((res) => setRemaining(res))
      .catch(() => {})
      .finally(() => setRemainingLoading(false));
  }, [authLoading, user]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setExpandedChanges(new Set());
    setSaveCard(null);

    try {
      const payload: RewriteRequestPayload = {
        text: text.trim(),
        context,
      };
      const res = await apiFetch<RewriteResponse>("/api/rewrite", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(res);

      // Update remaining count
      if (remaining) {
        setRemaining({
          ...remaining,
          remaining: Math.max(0, remaining.remaining - 1),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to rewrite. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [text, context, isSubmitting, remaining]);

  const toggleChange = useCallback((index: number) => {
    setExpandedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const openSaveCard = useCallback(
    (changeIndex: number) => {
      if (!result) return;
      const change = result.changes[changeIndex];
      if (!change) return;

      setSaveCard({
        changeIndex,
        phrase: change.corrected,
        translation: change.original,
        isSaving: false,
        error: null,
        saved: false,
      });
    },
    [result]
  );

  const handleSaveCard = useCallback(async () => {
    if (!saveCard || !result || saveCard.isSaving) return;

    setSaveCard((prev) =>
      prev ? { ...prev, isSaving: true, error: null } : null
    );

    try {
      await apiFetch(`/api/rewrite/${result.id}/save-card`, {
        method: "POST",
        body: JSON.stringify({
          phrase: saveCard.phrase,
          translation: saveCard.translation,
        }),
      });
      setSaveCard((prev) =>
        prev ? { ...prev, isSaving: false, saved: true } : null
      );
    } catch (err) {
      setSaveCard((prev) =>
        prev
          ? {
              ...prev,
              isSaving: false,
              error:
                err instanceof Error ? err.message : "Failed to save card.",
            }
          : null
      );
    }
  }, [saveCard, result]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-violet-500"
          role="status"
          aria-label="Loading"
        />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const canSubmit = text.trim().length > 0 && !isSubmitting;
  const isOutOfRewrites = remaining !== null && remaining.remaining <= 0;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-100">AI Rewrite</h1>
          </div>

          {/* Remaining badge */}
          {remainingLoading ? (
            <div className="h-6 w-20 animate-pulse rounded-full bg-gray-800" />
          ) : remaining ? (
            <div className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-mono text-xs font-medium text-gray-300">
                {remaining.remaining}
              </span>
              <span className="text-xs text-gray-500">
                / {remaining.limit} left
              </span>
            </div>
          ) : null}
        </header>

        {/* Input Section */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <label htmlFor="rewrite-input" className="sr-only">
            Input text to rewrite
          </label>
          <textarea
            id="rewrite-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your technical English here..."
            rows={5}
            disabled={isSubmitting}
            className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-100 placeholder-gray-500 transition-colors focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 disabled:opacity-50"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Context Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="context-select"
                className="text-xs font-medium text-gray-500"
              >
                Context:
              </label>
              <select
                id="context-select"
                value={context}
                onChange={(e) => setContext(e.target.value as RewriteContext)}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 disabled:opacity-50"
              >
                {CONTEXT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isOutOfRewrites}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Rewrite
                </>
              )}
            </button>
          </div>

          {isOutOfRewrites && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-yellow-400">
              <Clock className="h-3.5 w-3.5" />
              Daily limit reached. Resets at{" "}
              {remaining
                ? new Date(remaining.resetsAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "midnight"}
              .
            </p>
          )}

          <p className="mt-2 text-right text-xs text-gray-600">
            Ctrl+Enter to submit
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-800/50 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isSubmitting && (
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              <p className="text-sm text-gray-400">
                Analyzing and rewriting your text...
              </p>
            </div>
          </div>
        )}

        {/* Result Section */}
        {result && !isSubmitting && (
          <div className="space-y-4">
            {/* Rewritten Text */}
            <div className="rounded-2xl border border-violet-800/30 bg-violet-950/20 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">
                  Rewritten
                </h2>
                <div className="flex items-center gap-2">
                  <CopyMarkdownButton text={result.rewritten} />
                  <ContextBadge context={context} />
                  <ToneBadge tone={result.tone} />
                </div>
              </div>
              <MarkdownText
                text={result.rewritten}
                className="space-y-3 text-sm text-gray-100"
              />
            </div>

            {/* Changes */}
            {result.changes.length > 0 && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="mb-4 text-sm font-semibold text-gray-300">
                  Changes ({result.changes.length})
                </h2>
                <div className="space-y-2">
                  {result.changes.map((change, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-800"
                    >
                      <button
                        type="button"
                        onClick={() => toggleChange(index)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-800/50"
                        aria-expanded={expandedChanges.has(index)}
                      >
                        <div className="mr-3 min-w-0 flex-1">
                          <span className="text-sm text-red-400 line-through">
                            {change.original}
                          </span>
                          <span className="mx-2 text-gray-600">&rarr;</span>
                          <span className="text-sm font-medium text-green-400">
                            {change.corrected}
                          </span>
                        </div>
                        {expandedChanges.has(index) ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                        )}
                      </button>
                      {expandedChanges.has(index) && (
                        <div className="border-t border-gray-800 px-4 py-3">
                          <p className="mb-3 text-sm leading-relaxed text-gray-400">
                            {change.reason}
                          </p>
                          {/* Save to Phrase Card button */}
                          {saveCard?.changeIndex === index ? (
                            saveCard.saved ? (
                              <p className="text-xs font-medium text-green-400">
                                Saved to Phrase Cards
                              </p>
                            ) : (
                              <SaveCardForm
                                saveCard={saveCard}
                                onPhraseChange={(phrase) =>
                                  setSaveCard((prev) =>
                                    prev ? { ...prev, phrase } : null
                                  )
                                }
                                onTranslationChange={(translation) =>
                                  setSaveCard((prev) =>
                                    prev ? { ...prev, translation } : null
                                  )
                                }
                                onSave={handleSaveCard}
                                onCancel={() => setSaveCard(null)}
                              />
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => openSaveCard(index)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200"
                            >
                              <Save className="h-3 w-3" />
                              Save to Phrase Card
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips.length > 0 && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="mb-3 text-sm font-semibold text-gray-300">
                  Tips
                </h2>
                <ul className="space-y-2">
                  {result.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* View History Link */}
            <div className="text-center">
              <Link
                to="/rewrite/history"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
              >
                <Clock className="h-3.5 w-3.5" />
                View History
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ToneBadge({ tone }: { tone: RewriteTone }) {
  const style = TONE_STYLES[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      {TONE_LABELS[tone]}
    </span>
  );
}

function ContextBadge({ context }: { context: RewriteContext }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
      {CONTEXT_LABELS[context]}
    </span>
  );
}

function SaveCardForm({
  saveCard,
  onPhraseChange,
  onTranslationChange,
  onSave,
  onCancel,
}: {
  saveCard: SaveCardState;
  onPhraseChange: (value: string) => void;
  onTranslationChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400">Save to Phrase Card</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div>
        <label
          htmlFor="save-phrase"
          className="mb-1 block text-xs text-gray-500"
        >
          Phrase (English)
        </label>
        <input
          id="save-phrase"
          type="text"
          value={saveCard.phrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          disabled={saveCard.isSaving}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 disabled:opacity-50"
        />
      </div>
      <div>
        <label
          htmlFor="save-translation"
          className="mb-1 block text-xs text-gray-500"
        >
          Original
        </label>
        <input
          id="save-translation"
          type="text"
          value={saveCard.translation}
          onChange={(e) => onTranslationChange(e.target.value)}
          disabled={saveCard.isSaving}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 disabled:opacity-50"
        />
      </div>
      {saveCard.error && (
        <p className="text-xs text-red-400">{saveCard.error}</p>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={
          saveCard.isSaving ||
          !saveCard.phrase.trim() ||
          !saveCard.translation.trim()
        }
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveCard.isSaving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-3 w-3" />
            Save
          </>
        )}
      </button>
    </div>
  );
}
