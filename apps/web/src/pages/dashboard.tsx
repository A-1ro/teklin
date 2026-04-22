import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";
import { Pill } from "@/components/ui/pill";
import { TapeTag } from "@/components/ui/tape-tag";
import { PaperCard } from "@/components/ui/paper-card";
import { TkButton } from "@/components/ui/tk-button";
import { TekkiWave } from "@/components/mascot/Tekki";
import type {
  TodayLessonResponse,
  LessonHistoryResponse,
  ReviewCardsResponse,
  PlacementResultResponse,
  RewriteContext,
} from "@teklin/shared";

const PLACEMENT_PROMPT_DISMISS_KEY = "dashboard:placement-prompt-dismissed";

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const LEVEL_LABELS_SHORT: Record<string, string> = {
  L1: "Starter",
  L2: "Reader",
  L3: "Writer",
  L4: "Fluent",
};

const DOMAIN_LABELS: Record<string, string> = {
  web: "Web Dev",
  infra: "Infrastructure",
  ml: "Machine Learning",
  mobile: "Mobile",
};

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

export function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const navigate = useNavigate();

  const [lessonData, setLessonData] = useState<TodayLessonResponse | null>(
    null
  );
  const [lessonLoading, setLessonLoading] = useState(true);
  const [isPlacementPromptDismissed, setIsPlacementPromptDismissed] =
    useState(false);

  // Extra dashboard data
  const [lessonHistory, setLessonHistory] =
    useState<LessonHistoryResponse | null>(null);
  const [recentCards, setRecentCards] = useState<ReviewCardsResponse | null>(
    null
  );
  const [placementResult, setPlacementResult] =
    useState<PlacementResultResponse | null>(null);

  // Compute dismiss key before any early returns so the hook below is unconditional
  const todayKey = getLocalDateString(new Date());
  const placementPromptDismissValue = user ? `${user.id}:${todayKey}` : "";

  useEffect(() => {
    if (isLoading || !user) return;

    apiFetch<TodayLessonResponse>("/api/lessons/today")
      .then((res) => setLessonData(res))
      .catch(() => {})
      .finally(() => setLessonLoading(false));

    apiFetch<LessonHistoryResponse>("/api/lessons/history?limit=50")
      .then((res) => setLessonHistory(res))
      .catch(() => {});

    apiFetch<ReviewCardsResponse>("/api/cards/review")
      .then((res) => setRecentCards(res))
      .catch(() => {});

    apiFetch<PlacementResultResponse>("/api/placement/result")
      .then((res) => setPlacementResult(res))
      .catch(() => {});
  }, [isLoading, user]);

  useEffect(() => {
    if (!placementPromptDismissValue) return;
    const dismissedValue = window.localStorage.getItem(
      PLACEMENT_PROMPT_DISMISS_KEY
    );
    setIsPlacementPromptDismissed(
      dismissedValue === placementPromptDismissValue
    );
  }, [placementPromptDismissValue]);

  if (isLoading) {
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
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentStreak = lessonData?.streak.currentStreak ?? 0;
  const shouldShowPlacementPrompt =
    !lessonLoading &&
    currentStreak > 0 &&
    currentStreak % 7 === 0 &&
    !isPlacementPromptDismissed;

  const handleDismissPlacementPrompt = () => {
    window.localStorage.setItem(
      PLACEMENT_PROMPT_DISMISS_KEY,
      placementPromptDismissValue
    );
    setIsPlacementPromptDismissed(true);
  };

  const firstName = user.name.split(" ")[0]?.toLowerCase() ?? user.name;
  const weekNumber = getWeekNumber(new Date());
  const nextLevel =
    user.level === "L1"
      ? "L2"
      : user.level === "L2"
        ? "L3"
        : user.level === "L3"
          ? "L4"
          : null;

  // --- Derived data from APIs ---

  // Next level progress from placement scores (average of 4 axes, 0–100)
  const nextLevelPct = placementResult
    ? Math.round(
        Object.values(placementResult.scores).reduce((a, b) => a + b, 0) /
          Object.values(placementResult.scores).length
      )
    : null;

  // Weekly progress: filter lesson history to this week
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0);
  })();

  const thisWeekLessons = (lessonHistory?.items ?? []).filter(
    (item) => new Date(item.completedAt) >= weekStart
  );

  const weeklyOverallPct =
    thisWeekLessons.length > 0
      ? Math.round(
          thisWeekLessons.reduce((sum, l) => sum + l.score, 0) /
            thisWeekLessons.length
        )
      : 0;

  const weeklyByContext = (ctx: RewriteContext): number => {
    const matched = thisWeekLessons.filter((l) => l.context === ctx);
    if (matched.length === 0) return 0;
    return Math.round(
      matched.reduce((sum, l) => sum + l.score, 0) / matched.length
    );
  };

  // Recent phrase cards (from review queue, take first 3)
  const recentPhrases = (recentCards?.cards ?? []).slice(0, 3);

  // Category code mapping for phrase tags
  const CATEGORY_CODE: Record<string, string> = {
    commit_messages: "cm",
    pr_comments: "pr",
    code_review: "cr",
    slack_chat: "sl",
    github_issues: "iss",
  };

  return (
    <div>
      {/* Top row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-8">
        <div>
          <Kicker color="var(--color-ink-3)">morning · {firstName}</Kicker>
          <Display
            size={36}
            className="!text-[26px] md:!text-[36px]"
            style={{ marginTop: 10 }}
          >
            今日も
            <span style={{ color: "var(--color-teal)", fontStyle: "italic" }}>
              5分
            </span>
            だけ、いっしょに。
          </Display>
        </div>
        <Pill color="teal">
          {user.level} · {LEVEL_LABELS_SHORT[user.level] ?? user.level}
        </Pill>
      </div>

      {/* Hero grid */}
      <div
        className="mb-5 grid grid-cols-1 gap-4 md:mb-7 md:grid-cols-[2fr_1fr] md:gap-5"
        style={{ alignItems: "stretch" }}
      >
        {/* Today's lesson card */}
        <PaperCard
          accent="var(--color-teal)"
          style={{ padding: "28px 32px", position: "relative" }}
        >
          <div
            className="hidden sm:block"
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              pointerEvents: "none",
            }}
          >
            <TekkiWave size={148} />
          </div>
          {lessonLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {[120, 200, 160, 100].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: 16,
                    width: w,
                    borderRadius: 6,
                    background: "var(--color-paper-2)",
                  }}
                />
              ))}
            </div>
          ) : lessonData && lessonData.lesson ? (
            <TodayLessonContent
              lesson={lessonData.lesson}
              isCompleted={lessonData.isCompleted}
              onNavigate={() => navigate(`/lesson/${lessonData.lesson!.id}`)}
            />
          ) : (
            <div style={{ color: "var(--color-ink-2)", fontSize: 14 }}>
              今日のレッスンはまだ準備中です。後でもう一度確認してください。
            </div>
          )}
        </PaperCard>

        {/* Stats card */}
        <PaperCard style={{ padding: 0 }}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px dashed var(--color-rule)",
            }}
          >
            <Kicker color="var(--color-ink-3)">summary</Kicker>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <StatCell
              kicker="streak"
              value={String(currentStreak)}
              label="days"
              color="#7d5e0a"
              borderRight
              borderBottom
            />
            <StatCell
              kicker="level"
              value={user.level}
              label={LEVEL_LABELS_SHORT[user.level] ?? ""}
              color="var(--color-teal)"
              borderBottom
            />
            <StatCell
              kicker="domain"
              value={user.domain.charAt(0).toUpperCase() + user.domain.slice(1)}
              label={DOMAIN_LABELS[user.domain] ?? user.domain}
              color="var(--color-ink)"
              borderRight
            />
            <StatCell
              kicker="next"
              value={nextLevel ? `L${nextLevel.slice(1)}` : "MAX"}
              label={
                nextLevel
                  ? nextLevelPct !== null
                    ? `至 ${nextLevelPct}%`
                    : "未測定"
                  : "reached"
              }
              color="var(--color-plum)"
            />
          </div>
        </PaperCard>
      </div>

      {/* Second row */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:mb-7 md:grid-cols-2 md:gap-5">
        {/* Weekly progress */}
        <PaperCard style={{ padding: "24px 26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Display as="h3" size={20}>
              今週の進捗
            </Display>
            <TapeTag color="ghost">wk_{weekNumber}</TapeTag>
          </div>
          {thisWeekLessons.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <ProgressBar
                code="all"
                label={`全体 (${thisWeekLessons.length}件)`}
                pct={weeklyOverallPct}
                color="var(--color-teal)"
              />
              <ProgressBar
                code="pr"
                label="PRコメント"
                pct={weeklyByContext("pr_comment")}
                color="var(--color-plum)"
              />
              <ProgressBar
                code="cm"
                label="コミットメッセージ"
                pct={weeklyByContext("commit_message")}
                color="var(--color-mustard)"
              />
            </div>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-ink-3)",
                margin: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              // 今週はまだレッスンがありません
            </p>
          )}
        </PaperCard>

        {/* Recent phrases */}
        <PaperCard ruled style={{ padding: "24px 26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Display as="h3" size={20}>
              最近のフレーズ
            </Display>
            <TapeTag color="ghost">
              {recentPhrases.length > 0
                ? `due · ${recentCards?.totalDue ?? 0}`
                : "—"}
            </TapeTag>
          </div>
          {recentPhrases.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentPhrases.map((card) => (
                <PhraseRow
                  key={card.id}
                  tag={CATEGORY_CODE[card.category] ?? card.category}
                  phrase={card.phrase}
                />
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-ink-3)",
                margin: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              // まだフレーズカードがありません
            </p>
          )}
        </PaperCard>
      </div>

      {/* Placement prompt */}
      {shouldShowPlacementPrompt && (
        <PaperCard
          accent="var(--color-mustard)"
          style={{ padding: "20px 24px", marginBottom: 28 }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <TapeTag color="mustard">checkpoint</TapeTag>
                <Kicker color="var(--color-mustard-fg)">
                  {currentStreak}日連続達成
                </Kicker>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-ink-2)",
                  margin: 0,
                }}
              >
                今のレベルを測ってみませんか？プレースメントテストで到達度を確認しましょう。
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <Link to="/placement">
                <TkButton variant="teal" size="sm" kicker="→">
                  テストへ
                </TkButton>
              </Link>
              <button
                type="button"
                onClick={handleDismissPlacementPrompt}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-ink-3)",
                  fontSize: 16,
                  padding: 4,
                  lineHeight: 1,
                }}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
          </div>
        </PaperCard>
      )}

      {/* Quick action grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        <PaperCard
          hoverable
          onClick={() => navigate("/rewrite")}
          style={{ padding: "18px 20px" }}
        >
          <TapeTag color="plum">§ ai rewrite</TapeTag>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              margin: "8px 0 4px",
            }}
          >
            AI Rewrite
          </p>
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>
            技術英語をブラッシュアップ
          </p>
        </PaperCard>

        <PaperCard
          hoverable
          onClick={() => navigate("/cards")}
          style={{ padding: "18px 20px" }}
        >
          <TapeTag color="teal">§ phrase cards</TapeTag>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              margin: "8px 0 4px",
            }}
          >
            Phrase Cards
          </p>
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>
            SRSフラッシュカード復習
          </p>
        </PaperCard>

        <PaperCard
          hoverable
          onClick={() => navigate("/lesson/history")}
          style={{ padding: "18px 20px" }}
        >
          <TapeTag color="ghost">§ history</TapeTag>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              margin: "8px 0 4px",
            }}
          >
            Lesson History
          </p>
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>
            過去レッスンとスコアを確認
          </p>
        </PaperCard>

        <PaperCard
          hoverable
          onClick={() => navigate("/placement")}
          style={{ padding: "18px 20px" }}
        >
          <TapeTag color="mustard">§ placement</TapeTag>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              margin: "8px 0 4px",
            }}
          >
            Placement Test
          </p>
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", margin: 0 }}>
            再受験または結果を確認
          </p>
        </PaperCard>
      </div>
    </div>
  );
}

function TodayLessonContent({
  lesson,
  isCompleted,
  onNavigate,
}: {
  lesson: NonNullable<TodayLessonResponse["lesson"]>;
  isCompleted: boolean;
  onNavigate: () => void;
}) {
  const explanation = lesson.content.focus.explanation;
  const truncated =
    explanation.length > 80 ? explanation.slice(0, 80) + "..." : explanation;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <TapeTag color="teal">today · f1</TapeTag>
        <Kicker color="var(--color-ink-3)">lesson_{lesson.id.slice(-3)}</Kicker>
      </div>

      <Display size={30} style={{ marginBottom: 12 }}>
        {lesson.content.focus.phrase}
      </Display>

      <p
        style={{
          fontSize: 15,
          color: "var(--color-ink-2)",
          margin: "14px 0 24px",
          lineHeight: 1.65,
          maxWidth: 360,
        }}
      >
        {truncated}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Pill color="ghost">◷ 約5分</Pill>
        <Pill color="ghost">
          <span style={{ fontFamily: "var(--font-mono)" }}>
            {lesson.content.warmup.questions.length +
              lesson.content.practice.exercises.length}
          </span>{" "}
          問
        </Pill>
      </div>

      {isCompleted ? (
        <Pill color="teal">完了済み</Pill>
      ) : (
        <TkButton onClick={onNavigate} variant="teal" kicker="→ resume">
          続きから再開
        </TkButton>
      )}
    </div>
  );
}

function StatCell({
  kicker,
  value,
  label,
  color,
  borderRight = false,
  borderBottom = false,
}: {
  kicker: string;
  value: string;
  label: string;
  color: string;
  borderRight?: boolean;
  borderBottom?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRight: borderRight ? "1px dashed var(--color-rule)" : undefined,
        borderBottom: borderBottom ? "1px dashed var(--color-rule)" : undefined,
      }}
    >
      <Kicker color={color}>{kicker}</Kicker>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 600,
          color,
          margin: "4px 0 2px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--color-ink-3)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ProgressBar({
  code,
  label,
  pct,
  color,
}: {
  code: string;
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <Kicker color="var(--color-ink-3)">{code}</Kicker>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--color-ink-2)",
          }}
        >
          {pct}%
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
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function PhraseRow({ tag, phrase }: { tag: string; phrase: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <TapeTag color="ghost">{tag}</TapeTag>
      <span
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--color-ink-2)",
        }}
      >
        {phrase}
      </span>
    </div>
  );
}
