import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { TekkiSleepy } from "@/components/mascot/Tekki";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";
import { TapeTag } from "@/components/ui/tape-tag";
import { PaperCard } from "@/components/ui/paper-card";
import { TkButton } from "@/components/ui/tk-button";
import type { CardStatsResponse, CardCategory } from "@teklin/shared";

const CATEGORY_META: Record<
  CardCategory,
  {
    label: string;
    code: string;
    accent: string;
    tagColor: "teal" | "plum" | "coral" | "mustard" | "ghost";
  }
> = {
  commit_messages: {
    label: "コミットメッセージ",
    code: "cm",
    accent: "var(--color-mustard)",
    tagColor: "mustard",
  },
  pr_comments: {
    label: "PRコメント",
    code: "pr",
    accent: "var(--color-teal)",
    tagColor: "teal",
  },
  code_review: {
    label: "コードレビュー",
    code: "cr",
    accent: "var(--color-plum)",
    tagColor: "plum",
  },
  slack_chat: {
    label: "Slack / チャット",
    code: "sl",
    accent: "var(--color-coral)",
    tagColor: "coral",
  },
  github_issues: {
    label: "GitHub Issues",
    code: "is",
    accent: "var(--color-ink)",
    tagColor: "ghost",
  },
};

const CATEGORY_ORDER: CardCategory[] = [
  "commit_messages",
  "pr_comments",
  "code_review",
  "slack_chat",
  "github_issues",
];

export function CardsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<CardStatsResponse>("/api/cards/stats")
      .then((res) => setStats(res))
      .catch(() => setError("カード情報の取得に失敗しました。"))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
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
            borderTopColor: "var(--color-teal)",
            animation: "spin 0.8s linear infinite",
          }}
          role="status"
          aria-label="Loading cards"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !stats) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          gap: 16,
        }}
      >
        <p style={{ color: "var(--color-ink-2)", fontSize: 14 }}>
          {error ?? "カード情報がありません。"}
        </p>
        <TkButton variant="teal" onClick={() => navigate("/dashboard")}>
          ダッシュボードに戻る
        </TkButton>
      </div>
    );
  }

  const totalProgress =
    stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <div>
      {/* Header block */}
      <div style={{ marginBottom: 24 }}>
        <Kicker color="var(--color-teal)">§ phrase cards</Kicker>
        <Display size={34} style={{ marginTop: 8 }}>
          Phrase Cards.
        </Display>
        <p
          style={{
            fontSize: 14.5,
            color: "var(--color-ink-2)",
            margin: "8px 0 0",
          }}
        >
          技術現場で即つかえるフレーズ。カテゴリ別に引き出せる。
        </p>
      </div>

      {/* Today's review CTA — per direction */}
      {stats.dueTodayJpToEn > 0 || stats.dueTodayEnToJp > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {stats.dueTodayJpToEn > 0 && (
            <PaperCard
              accent="var(--color-teal)"
              hoverable
              onClick={() => navigate("/cards/review?direction=jp_to_en")}
              style={{ padding: "20px 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <TapeTag color="teal">JP → EN</TapeTag>
                    <Kicker color="var(--color-ink-3)">日本語 → English</Kicker>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--color-ink)",
                      margin: "0 0 4px",
                    }}
                  >
                    日本語から英語を思い出す
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-ink-2)",
                      margin: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: "var(--color-teal-dark)",
                      }}
                    >
                      {stats.dueTodayJpToEn}
                    </span>{" "}
                    枚のカードが待っています
                  </p>
                </div>
                <TkButton variant="teal" size="sm" kicker="→">
                  復習する
                </TkButton>
              </div>
            </PaperCard>
          )}
          {stats.dueTodayEnToJp > 0 && (
            <PaperCard
              accent="var(--color-plum)"
              hoverable
              onClick={() => navigate("/cards/review?direction=en_to_jp")}
              style={{ padding: "20px 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <TapeTag color="plum">EN → JP</TapeTag>
                    <Kicker color="var(--color-ink-3)">English → 日本語</Kicker>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--color-ink)",
                      margin: "0 0 4px",
                    }}
                  >
                    英語から日本語の意味を思い出す
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-ink-2)",
                      margin: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: "var(--color-plum)",
                      }}
                    >
                      {stats.dueTodayEnToJp}
                    </span>{" "}
                    枚のカードが待っています
                  </p>
                </div>
                <TkButton variant="plum" size="sm" kicker="→">
                  復習する
                </TkButton>
              </div>
            </PaperCard>
          )}
        </div>
      ) : (
        <PaperCard style={{ padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TapeTag color="ghost">today</TapeTag>
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--color-ink)",
                  margin: "0 0 2px",
                }}
              >
                今日の復習は完了
              </p>
              <p
                style={{ fontSize: 13, color: "var(--color-ink-2)", margin: 0 }}
              >
                お��れ様でした！明日ま��チェックしてください。
              </p>
            </div>
          </div>
        </PaperCard>
      )}

      {/* Overall stats */}
      <PaperCard style={{ padding: 0, marginBottom: 24 }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px dashed var(--color-rule)",
          }}
        >
          <Kicker color="var(--color-ink-3)">overall stats</Kicker>
        </div>
        <div className="grid grid-cols-3">
          <div
            style={{
              padding: "16px 18px",
              borderRight: "1px dashed var(--color-rule)",
            }}
          >
            <Kicker color="var(--color-teal)">mastered</Kicker>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                fontWeight: 700,
                color: "var(--color-teal-dark)",
                margin: "4px 0 2px",
              }}
            >
              {stats.mastered}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              習得済み
            </div>
          </div>
          <div
            style={{
              padding: "16px 18px",
              borderRight: "1px dashed var(--color-rule)",
            }}
          >
            <Kicker color="var(--color-mustard)">learning</Kicker>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                fontWeight: 700,
                color: "var(--color-mustard-fg)",
                margin: "4px 0 2px",
              }}
            >
              {stats.learning}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              学習中
            </div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <Kicker color="var(--color-ink-3)">unseen</Kicker>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                fontWeight: 700,
                color: "var(--color-ink-2)",
                margin: "4px 0 2px",
              }}
            >
              {stats.unseen}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
              未学習
            </div>
          </div>
        </div>
        {/* Overall progress bar */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px dashed var(--color-rule)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--color-ink-2)" }}>
              全体の進捗
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--color-ink-2)",
              }}
            >
              {totalProgress}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--color-paper-2)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${totalProgress}%`,
                background: "var(--color-teal)",
                borderRadius: 999,
                transition: "width 500ms ease",
              }}
            />
          </div>
        </div>
      </PaperCard>

      {/* Category cards grid */}
      {stats.total === 0 ? (
        <PaperCard
          style={{
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <TekkiSleepy size={120} />
          <Kicker color="var(--color-ink-3)">empty</Kicker>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-ink-2)",
              margin: 0,
              textAlign: "center",
            }}
          >
            このカテゴリにはまだカードがありません。
          </p>
        </PaperCard>
      ) : (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Kicker color="var(--color-ink-3)">categories</Kicker>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            {CATEGORY_ORDER.map((category) => {
              const meta = CATEGORY_META[category];
              const catStats = stats.byCategory[category];
              const catTotal = catStats?.total ?? 0;
              const catMastered = catStats?.mastered ?? 0;
              const catLearning = catStats?.learning ?? 0;
              const catUnseen = catStats?.unseen ?? 0;
              const catProgress =
                catTotal > 0 ? Math.round((catMastered / catTotal) * 100) : 0;

              return (
                <Link
                  key={category}
                  to={`/cards/deck/${category}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <PaperCard
                    accent={meta.accent}
                    hoverable
                    style={{ padding: "18px 20px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <TapeTag color={meta.tagColor}>{meta.code}</TapeTag>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--color-ink)",
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 5,
                        background: "var(--color-paper-2)",
                        borderRadius: 999,
                        overflow: "hidden",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${catProgress}%`,
                          background: meta.accent,
                          borderRadius: 999,
                          transition: "width 500ms ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-teal-dark)",
                        }}
                      >
                        ● {catMastered}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-mustard-fg)",
                        }}
                      >
                        ● {catLearning}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-ink-3)",
                        }}
                      >
                        ● {catUnseen}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-ink-3)",
                        }}
                      >
                        {catTotal} total
                      </span>
                    </div>
                  </PaperCard>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
