import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { TekkiThinking } from "@/components/mascot/Tekki";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";
import { TapeTag } from "@/components/ui/tape-tag";
import { PaperCard } from "@/components/ui/paper-card";
import { TkButton } from "@/components/ui/tk-button";
import type {
  RewriteContext,
  RewriteResult,
  RewriteRequestPayload,
  RewriteRemainingResponse,
  RewriteTone,
} from "@teklin/shared";

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
          changeIndex: saveCard.changeIndex,
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid var(--color-rule)",
            borderTopColor: "var(--color-plum)",
            animation: "spin 0.8s linear infinite",
          }}
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const canSubmit = text.trim().length > 0 && !isSubmitting;
  const isOutOfRewrites = remaining !== null && remaining.remaining <= 0;

  return (
    <div>
      {/* Header block */}
      <div style={{ marginBottom: 24 }}>
        <Kicker color="var(--color-plum)">§ ai rewrite</Kicker>
        <Display size={34} style={{ marginTop: 8 }}>
          AI Rewrite.
        </Display>
        <p
          style={{
            fontSize: 14.5,
            color: "var(--color-ink-2)",
            margin: "8px 0 0",
          }}
        >
          日本語まじりの英語を、文脈に合わせて書き直す。理由つきで。
        </p>
      </div>

      {/* Remaining info */}
      {!remainingLoading && remaining && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <TapeTag color={remaining.remaining > 0 ? "ghost" : "coral"}>
            {remaining.remaining} / {remaining.limit} remaining
          </TapeTag>
          {isOutOfRewrites && (
            <span style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              リセット:{" "}
              {new Date(remaining.resetsAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      {/* History link */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Link
          to="/rewrite/history"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-ink-3)",
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          § history →
        </Link>
      </div>

      {/* Input card */}
      <PaperCard style={{ padding: "22px 24px", marginBottom: 16 }}>
        {/* Context row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Kicker color="var(--color-ink-3)">ctx</Kicker>
          <select
            id="context-select"
            value={context}
            onChange={(e) => setContext(e.target.value as RewriteContext)}
            disabled={isSubmitting}
            style={{
              padding: "6px 12px",
              border: "1.5px solid var(--color-rule)",
              borderRadius: 999,
              fontSize: 13,
              background: "#fff",
              color: "var(--color-ink)",
              fontFamily: "inherit",
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Textarea */}
        <label htmlFor="rewrite-input" className="sr-only">
          書き直したいテキスト
        </label>
        <textarea
          id="rewrite-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your technical English here..."
          rows={3}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "14px 16px",
            border: "1px solid var(--color-rule)",
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 15,
            lineHeight: 1.6,
            resize: "vertical",
            background: "#fff",
            color: "var(--color-ink)",
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {/* Bottom row */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-ink-3)",
            }}
          >
            {text.length} chars · ctrl+enter
          </span>
          <TkButton
            variant="teal"
            kicker={isSubmitting ? "…" : "→"}
            disabled={!canSubmit || isOutOfRewrites}
            onClick={handleSubmit}
          >
            {isSubmitting ? "書き直し中" : "Rewrite"}
          </TkButton>
        </div>
      </PaperCard>

      {/* Error state */}
      {error && (
        <PaperCard
          accent="var(--color-coral)"
          style={{ padding: "14px 18px", marginBottom: 16 }}
        >
          <p style={{ fontSize: 14, color: "var(--color-coral-fg)", margin: 0 }}>
            {error}
          </p>
        </PaperCard>
      )}

      {/* Loading state */}
      {isSubmitting && (
        <PaperCard
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <TekkiThinking size={96} />
          <div>
            <Kicker color="var(--color-plum)">thinking…</Kicker>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-ink-2)",
                margin: "4px 0 0",
              }}
            >
              文脈を読み解いて、自然な表現を考えています。
            </p>
          </div>
        </PaperCard>
      )}

      {/* Result section */}
      {result && !isSubmitting && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Main result card */}
          <PaperCard style={{ padding: "26px 28px" }}>
            {/* Tags row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <TapeTag color="plum">
                tone · {TONE_LABELS[result.tone].toLowerCase()}
              </TapeTag>
              <TapeTag color="ghost">
                {CONTEXT_LABELS[context].toLowerCase()}
              </TapeTag>
              <div style={{ marginLeft: "auto" }}>
                <CopyMarkdownButton text={result.rewritten} />
              </div>
            </div>

            {/* Diff block */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                lineHeight: 1.75,
                background: "var(--color-paper)",
                border: "1px solid var(--color-rule)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 20,
              }}
            >
              <div>
                <span
                  style={{
                    color: "var(--color-ink-3)",
                    fontWeight: 400,
                    marginRight: 8,
                  }}
                >
                  -
                </span>
                <span
                  style={{
                    color: "var(--color-coral)",
                    textDecoration: "line-through",
                  }}
                >
                  {text}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: "var(--color-ink-3)",
                    fontWeight: 400,
                    marginRight: 8,
                  }}
                >
                  +
                </span>
                <span
                  style={{
                    color: "var(--color-teal-dark)",
                    fontWeight: 600,
                  }}
                >
                  {result.rewritten}
                </span>
              </div>
            </div>

          </PaperCard>

          {/* Changes card */}
          {result.changes.length > 0 && (
            <PaperCard style={{ padding: "22px 24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <TapeTag color="ghost">changes</TapeTag>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--color-ink-3)",
                  }}
                >
                  {result.changes.length} items
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {result.changes.map((change, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid var(--color-rule)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleChange(index)}
                      aria-expanded={expandedChanges.has(index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--color-coral)",
                            textDecoration: "line-through",
                          }}
                        >
                          {change.original}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--color-ink-3)",
                            margin: "0 6px",
                          }}
                        >
                          →
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--color-teal-dark)",
                          }}
                        >
                          {change.corrected}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-ink-3)",
                          flexShrink: 0,
                        }}
                      >
                        {expandedChanges.has(index) ? "▲" : "▼"}
                      </span>
                    </button>
                    {expandedChanges.has(index) && (
                      <div
                        style={{
                          borderTop: "1px solid var(--color-rule)",
                          padding: "12px 14px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: "var(--color-ink-2)",
                            margin: "0 0 12px",
                          }}
                        >
                          {change.reason}
                        </p>
                        {/* Save to phrase card */}
                        {saveCard?.changeIndex === index ? (
                          saveCard.saved ? (
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--color-teal-dark)",
                              }}
                            >
                              ✓ Saved to Phrase Cards
                            </span>
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
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "5px 12px",
                              border: "1px solid var(--color-rule)",
                              borderRadius: 999,
                              background: "none",
                              cursor: "pointer",
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--color-ink-2)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            + save to card
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PaperCard>
          )}

          {/* Tips card */}
          {result.tips.length > 0 && (
            <PaperCard style={{ padding: "22px 24px" }}>
              <div style={{ marginBottom: 12 }}>
                <TapeTag color="mustard">tips</TapeTag>
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {result.tips.map((tip, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 14,
                      color: "var(--color-ink-2)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--color-mustard)",
                        marginTop: 3,
                        flexShrink: 0,
                      }}
                    >
                      ◆
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </PaperCard>
          )}
        </div>
      )}
    </div>
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
    <div
      style={{
        border: "1px solid var(--color-rule)",
        borderRadius: 10,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "var(--color-paper)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Kicker color="var(--color-ink-3)">save to phrase card</Kicker>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-ink-3)",
            fontSize: 14,
            padding: 2,
            lineHeight: 1,
          }}
          aria-label="Cancel"
        >
          ×
        </button>
      </div>
      <div>
        <label
          htmlFor="save-phrase"
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--color-ink-3)",
            marginBottom: 4,
            fontFamily: "var(--font-mono)",
          }}
        >
          Phrase (English)
        </label>
        <input
          id="save-phrase"
          type="text"
          value={saveCard.phrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          disabled={saveCard.isSaving}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid var(--color-rule)",
            borderRadius: 8,
            fontSize: 13,
            background: "#fff",
            color: "var(--color-ink)",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>
      <div>
        <label
          htmlFor="save-translation"
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--color-ink-3)",
            marginBottom: 4,
            fontFamily: "var(--font-mono)",
          }}
        >
          Original
        </label>
        <input
          id="save-translation"
          type="text"
          value={saveCard.translation}
          onChange={(e) => onTranslationChange(e.target.value)}
          disabled={saveCard.isSaving}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid var(--color-rule)",
            borderRadius: 8,
            fontSize: 13,
            background: "#fff",
            color: "var(--color-ink)",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>
      {saveCard.error && (
        <p style={{ fontSize: 12, color: "var(--color-coral)", margin: 0 }}>
          {saveCard.error}
        </p>
      )}
      <TkButton
        type="button"
        onClick={onSave}
        variant="teal"
        size="sm"
        disabled={
          saveCard.isSaving ||
          !saveCard.phrase.trim() ||
          !saveCard.translation.trim()
        }
        style={{ width: "100%", justifyContent: "center" }}
      >
        {saveCard.isSaving ? "Saving..." : "Save"}
      </TkButton>
    </div>
  );
}
