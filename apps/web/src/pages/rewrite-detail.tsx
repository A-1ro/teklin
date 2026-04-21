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
    bg: "bg-teal-50",
    text: "text-teal",
    border: "border-teal/30",
  },
  professional: {
    bg: "bg-plum-50",
    text: "text-plum",
    border: "border-plum/30",
  },
  too_casual: {
    bg: "bg-mustard-50",
    text: "text-mustard-fg",
    border: "border-mustard/30",
  },
  too_formal: {
    bg: "bg-coral-50",
    text: "text-coral-fg",
    border: "border-coral/30",
  },
  neutral: {
    bg: "bg-paper-2",
    text: "text-ink-2",
    border: "border-rule",
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
  changeIndex: number;
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
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-plum"
            role="status"
            aria-label="Loading details"
          />
          <p className="text-sm text-ink-2">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !detail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="mb-4 text-ink-2">{error || "Rewrite not found."}</p>
          <Link
            to="/rewrite/history"
            className="inline-block rounded-lg bg-plum px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
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

  function findLinkedCard(changeIndex: number): RewriteLinkedCard | undefined {
    return linkedCards.find((card) => card.changeIndex === changeIndex);
  }

  function openSaveCard(changeIndex: number) {
    const change = explanation.changes[changeIndex];
    if (!change) return;

    const linkedCard = findLinkedCard(changeIndex);
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
              changeIndex: saveCard.changeIndex,
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
            changeIndex: saveCard.changeIndex,
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
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <Link
            to="/rewrite/history"
            className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            aria-label="Back to history"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink">Rewrite Detail</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-rule bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-ink-2">
                {CONTEXT_LABELS[detail.context]}
              </span>
              {explanation.tone && (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_STYLES[explanation.tone].bg} ${TONE_STYLES[explanation.tone].text} ${TONE_STYLES[explanation.tone].border}`}
                >
                  {TONE_LABELS[explanation.tone]}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-ink-3">
                <Clock className="h-3 w-3" />
                {formattedDate} {formattedTime}
              </span>
            </div>
          </div>
        </header>

        {/* Side-by-side / stacked comparison */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Original */}
          <div className="rounded-[14px] border border-rule bg-paper-2 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-3">
              Original
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {detail.originalText}
            </p>
          </div>

          {/* Rewritten */}
          <div className="rounded-[14px] border border-plum/30 bg-plum-50 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-plum">
                Rewritten
              </h2>
              <CopyMarkdownButton text={detail.rewrittenText} />
            </div>
            <MarkdownText
              text={detail.rewrittenText}
              className="space-y-3 text-sm text-ink"
            />
          </div>
        </div>

        {/* Changes */}
        {explanation.changes.length > 0 && (
          <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">
              Changes ({explanation.changes.length})
            </h2>
            <div className="space-y-3">
              {explanation.changes.map((change, index) => (
                <div
                  key={index}
                  className="rounded-[14px] border border-rule bg-paper p-4"
                >
                  <div className="mb-2">
                    <span className="text-sm text-coral line-through">
                      {change.original}
                    </span>
                    <span className="mx-2 text-ink-3">&rarr;</span>
                    <span className="text-sm font-medium text-teal">
                      {change.corrected}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-3">
                    {change.reason}
                  </p>
                  <div className="mt-3">
                    {saveCard?.changeIndex === index ? (
                      saveCard.saved ? (
                        <p className="text-xs font-medium text-teal">
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                      >
                        <Save className="h-3 w-3" />
                        {findLinkedCard(index) ? "Edit Phrase Card" : "Save to Phrase Card"}
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
          <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
            <h2 className="mb-3 text-sm font-semibold text-ink">Tips</h2>
            <ul className="space-y-2">
              {explanation.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-ink-2"
                >
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-plum" />
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
    <div className="space-y-3 rounded-lg border border-rule bg-paper-2 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-2">
          {saveCard.cardId ? "Edit Phrase Card" : "Save to Phrase Card"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-ink-3 transition-colors hover:bg-rule hover:text-ink-2"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-3">Phrase (English)</label>
        <input
          type="text"
          value={saveCard.phrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          disabled={saveCard.isSaving}
          className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-plum focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-3">Translation / Note</label>
        <input
          type="text"
          value={saveCard.translation}
          onChange={(e) => onTranslationChange(e.target.value)}
          disabled={saveCard.isSaving}
          className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-plum focus:outline-none"
        />
      </div>
      {saveCard.error && (
        <p className="text-xs text-coral">{saveCard.error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saveCard.isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-plum px-3 py-2 text-xs font-semibold text-paper transition-colors hover:opacity-90 disabled:opacity-50"
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
          className="rounded-lg border border-rule px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
