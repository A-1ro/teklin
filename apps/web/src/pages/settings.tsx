import { useState } from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch } from "@/lib/api";

const DOMAINS = [
  {
    value: "web",
    label: "Web Dev",
    description: "フロントエンド・バックエンド・フルスタック開発",
  },
  {
    value: "infra",
    label: "Infrastructure",
    description: "DevOps・クラウド・SRE・プラットフォーム",
  },
  {
    value: "ml",
    label: "Machine Learning",
    description: "AI・データサイエンス・MLOps",
  },
  {
    value: "mobile",
    label: "Mobile",
    description: "iOS・Android・クロスプラットフォーム",
  },
] as const;

export function SettingsPage() {
  const { user, isLoading } = useRequireAuth();
  const { refreshUser } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !user) return null;

  const currentDomain = selectedDomain ?? user.domain;
  const isDirty = selectedDomain !== null && selectedDomain !== user.domain;

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ domain: currentDomain }),
      });
      await refreshUser();
      setSaved(true);
      setSelectedDomain(null);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("変更に失敗しました。もう一度試してください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-paper)",
        color: "var(--color-ink)",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,247,241,0.9)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-rule)",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-ink-2)",
            textDecoration: "none",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          ダッシュボード
        </Link>
        <span
          style={{
            marginLeft: 16,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-ink)",
          }}
        >
          設定
        </span>
      </header>

      <main
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "32px 16px 80px",
        }}
      >
        {/* Section: Domain */}
        <section>
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-ink-3)",
                margin: "0 0 4px",
              }}
            >
              Domain
            </p>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--color-ink)",
                margin: 0,
              }}
            >
              専門ドメインを変更する
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-ink-2)",
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              ドメインを変更すると、レッスンとカードがその分野に合った内容に切り替わります。
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {DOMAINS.map((domain) => {
              const isSelected = currentDomain === domain.value;
              const isCurrentSaved = user.domain === domain.value;
              return (
                <button
                  key={domain.value}
                  type="button"
                  onClick={() => setSelectedDomain(domain.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    width: "100%",
                    padding: "14px 16px",
                    background: isSelected
                      ? "var(--color-teal-50)"
                      : "var(--color-paper-2, #f5f2ec)",
                    border: isSelected
                      ? "2px solid var(--color-teal)"
                      : "2px solid transparent",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all 120ms",
                  }}
                >
                  {/* Radio indicator */}
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: isSelected
                        ? "2px solid var(--color-teal)"
                        : "2px solid var(--color-rule)",
                      background: isSelected
                        ? "var(--color-teal)"
                        : "transparent",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#fff",
                        }}
                      />
                    )}
                  </span>

                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isSelected
                            ? "var(--color-teal-dark)"
                            : "var(--color-ink)",
                        }}
                      >
                        {domain.label}
                      </span>
                      {isCurrentSaved && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--color-teal)",
                            fontFamily: "var(--font-mono)",
                            background: "var(--color-teal-50)",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          現在
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-ink-3)",
                      }}
                    >
                      {domain.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Save button area */}
          <div style={{ marginTop: 24 }}>
            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-coral)",
                  marginBottom: 12,
                }}
              >
                {error}
              </p>
            )}
            {saved && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-teal-dark)",
                  marginBottom: 12,
                }}
              >
                ドメインを変更しました。次のレッスンから反映されます。
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                background:
                  isDirty && !saving
                    ? "var(--color-teal)"
                    : "var(--color-rule)",
                color: isDirty && !saving ? "#fff" : "var(--color-ink-3)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: isDirty && !saving ? "pointer" : "not-allowed",
                transition: "all 120ms",
              }}
            >
              {saving ? "保存中..." : "変更を保存する"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
