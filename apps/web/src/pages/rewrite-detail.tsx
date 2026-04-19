import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { MarkdownText } from "@/components/markdown-text";
import type {
  RewriteHistoryDetail,
  RewriteContext,
  RewriteChange,
  RewriteTone,
} from "@teklin/shared";
import { ArrowLeft, Clock, Loader2, Save, X } from "lucide-react";

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

interface ParsedExplanation {
  changes: RewriteChange[];
  tone: RewriteTone | null;
  tips: string[];
}

interface RewriteLinkedCard {
  id: string;
  phrase: string;
  translation: string;
}

interface SaveCardState {
  changeIndex: number;
  cardId: string | null;
  isExistingCard: boolean;
  phrase: string;
  translation: string;
  isSaving: boolean;
  error: string | null;
  saved: boolean;
}

function parseExplanation(raw: string): ParsedExplanation {
  try {
    const parsed = JSON.parse(raw);
    return {
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
      tone: parsed.tone ?? null,
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    };
  } catch {
    return { changes: [], tone: null, tips: [] };
  }
}

export function RewriteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useRequireAuth();

  const [detail, setDetail] = useState<RewriteHistoryDetail | null>(null);
  const [linkedCards, setLinkedCards] = useState<RewriteLinkedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState<SaveCardState | null>(null);

  useEffect(() => {
    if (authLoading || !user || !id) return;

    Promise.all([
      apiFetch<RewriteHistoryDetail>(`/api/rewrite/history/${id}`),
      apiFetch<{ items: RewriteLinkedCard[] }>(`/api/rewrite/${id}/cards`),
    ])
      .then(([detailRes, cardsRes]) => {
        setDetail(detailRes);
        setLinkedCards(cardsRes.items);
      })
      .catch(() => setError("Failed to load rewrite details."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user, id]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-violet-500"
            role="status"
            aria-label="Loading details"
          />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !detail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">{error || "Rewrite not found."}</p>
          <Link
            to="/rewrite/history"
            className="inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Back to History
          </Link>
        </div>
      </main>
    );
  }

  const date = new Date(detail.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const explanation = parseExplanation(detail.explanation);

  function findLinkedCard(change: RewriteChange): RewriteLinkedCard | undefined {
    return linkedCards.find(
      (card) =>
        card.phrase === change.corrected && card.translation === change.original
    );
  }

  function openSaveCard(changeIndex: number) {
    const change = explanation.changes[changeIndex];
    if (!change) return;

    const linkedCard = findLinkedCard(change);
    setSaveCard({
      changeIndex,
      cardId: linkedCard?.id ?? null,
      isExistingCard: linkedCard != null,
      phrase: linkedCard?.phrase ?? change.corrected,
      translation: linkedCard?.translation ?? change.original,
      isSaving: false,
      error: null,
      saved: false,
    });
  }

  async function handleSaveCard() {
    if (!saveCard || !id || saveCard.isSaving) return;

    setSaveCard((prev) =>
      prev ? { ...prev, isSaving: true, error: null } : null
    );

    try {
      if (saveCard.cardId) {
        const updated = await apiFetch<RewriteLinkedCard>(
          `/api/cards/${saveCard.cardId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              phrase: saveCard.phrase,
              translation: saveCard.translation,
            }),
          }
        );

        setLinkedCards((prev) =>
          prev.map((card) => (card.id === updated.id ? updated : card))
        );
      } else {
        const created = await apiFetch<{ cardId: string }>(
          `/api/rewrite/${id}/save-card`,
          {
            method: "POST",
            body: JSON.stringify({
              phrase: saveCard.phrase,
              translation: saveCard.translation,
            }),
          }
        );

        setLinkedCards((prev) => [
          ...prev,
          {
            id: created.cardId,
            phrase: saveCard.phrase,
            translation: saveCard.translation,
          },
        ]);

        setSaveCard((prev) =>
          prev ? { ...prev, cardId: created.cardId } : null
        );
      }

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
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/rewrite/history"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            aria-label="Back to history"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Rewrite Detail</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                {CONTEXT_LABELS[detail.context]}
              </span>
              {explanation.tone && (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_STYLES[explanation.tone].bg} ${TONE_STYLES[explanation.tone].text} ${TONE_STYLES[explanation.tone].border}`}
                >
                  {TONE_LABELS[explanation.tone]}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formattedDate} {formattedTime}
              </span>
            </div>
          </div>
        </header>

        {/* Side-by-side / stacked comparison */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Original */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Original
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {detail.originalText}
            </p>
          </div>

          {/* Rewritten */}
          <div className="rounded-2xl border border-violet-800/30 bg-violet-950/20 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Rewritten
              </h2>
              <CopyMarkdownButton text={detail.rewrittenText} />
            </div>
            <MarkdownText
              text={detail.rewrittenText}
              className="space-y-3 text-sm text-gray-100"
            />
          </div>
        </div>

        {/* Changes */}
        {explanation.changes.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-300">
              Changes ({explanation.changes.length})
            </h2>
            <div className="space-y-3">
              {explanation.changes.map((change, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-800 p-4"
                >
                  <div className="mb-2">
                    <span className="text-sm text-red-400 line-through">
                      {change.original}
                    </span>
                    <span className="mx-2 text-gray-600">&rarr;</span>
                    <span className="text-sm font-medium text-green-400">
                      {change.corrected}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-500">
                    {change.reason}
                  </p>
                  <div className="mt-3">
                    {saveCard?.changeIndex === index ? (
                      saveCard.saved ? (
                        <p className="text-xs font-medium text-green-400">
                          {saveCard.isExistingCard ? "Phrase Card updated" : "Saved to Phrase Cards"}
                        </p>
                      ) : (
                        <SaveCardForm
                          saveCard={saveCard}
                          submitLabel={saveCard.cardId ? "Update card" : "Save to Phrase Card"}
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
                        {findLinkedCard(change) ? "Edit Phrase Card" : "Save to Phrase Card"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {explanation.tips.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-300">Tips</h2>
            <ul className="space-y-2">
              {explanation.tips.map((tip, index) => (
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
      </div>
    </main>
  );
}

function SaveCardForm({
  saveCard,
  submitLabel,
  onPhraseChange,
  onTranslationChange,
  onSave,
  onCancel,
}: {
  saveCard: SaveCardState;
  submitLabel: string;
  onPhraseChange: (value: string) => void;
  onTranslationChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400">
          {saveCard.cardId ? "Edit Phrase Card" : "Save to Phrase Card"}
        </p>
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
        <label className="mb-1 block text-xs text-gray-500">Phrase (English)</label>
        <input
          type="text"
          value={saveCard.phrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          disabled={saveCard.isSaving}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Translation / Note</label>
        <input
          type="text"
          value={saveCard.translation}
          onChange={(e) => onTranslationChange(e.target.value)}
          disabled={saveCard.isSaving}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
        />
      </div>
      {saveCard.error && (
        <p className="text-xs text-red-400">{saveCard.error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saveCard.isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {saveCard.isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {submitLabel}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saveCard.isSaving}
          className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
