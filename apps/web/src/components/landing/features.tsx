import { PaperCard } from "@/components/ui/paper-card";
import { TapeTag } from "@/components/ui/tape-tag";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";

const cards = [
  {
    id: "F1",
    emoji: "📅",
    title: "Daily Lesson",
    desc: "今日のレベル・ドメインに合わせた5分のレッスン。続けるための設計。",
    accent: "var(--color-teal)",
  },
  {
    id: "F2",
    emoji: "🧾",
    title: "Phrase Cards",
    desc: "現場で即つかえるフレーズ。文脈タグで引き出せる、編集できる。",
    accent: "var(--color-mustard)",
  },
  {
    id: "F3",
    emoji: "✎",
    title: "AI Rewrite",
    desc: "PR・Slack・コミットを、文脈のまま自然な英語へ。理由つきで。",
    accent: "var(--color-plum)",
  },
  {
    id: "F0",
    emoji: "◎",
    title: "Placement",
    desc: "5問でL1〜L4を診断。毎週自動で再測定、合わせて難易度が動く。",
    accent: "var(--color-coral)",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="px-4 py-16 md:px-7 md:py-24"
      style={{
        background: "var(--color-paper-2)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header row */}
        <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <Kicker>§ 01 — features</Kicker>
            <Display
              as="h2"
              size={40}
              className="!text-[30px] md:!text-[40px]"
              style={{ marginTop: 10 }}
            >
              エンジニアの毎日に、
              <br />
              ぴったり4つ。
            </Display>
          </div>
          <p
            style={{
              fontSize: 15,
              color: "var(--color-ink-2)",
              maxWidth: 360,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            TOEICでも日常会話でもない。コードを読み書きする人のための、技術英語だけ。
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
          {cards.map((card) => (
            <PaperCard
              key={card.id}
              hoverable
              accent={card.accent}
              style={{ padding: "26px 28px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 32, lineHeight: 1 }}>
                  {card.emoji}
                </span>
                <TapeTag color="ghost">{card.id.toLowerCase()}</TapeTag>
              </div>
              <Display as="h3" size={22} style={{ marginBottom: 8 }}>
                {card.title}
              </Display>
              <p
                style={{
                  fontSize: 14.5,
                  color: "var(--color-ink-2)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {card.desc}
              </p>
            </PaperCard>
          ))}
        </div>
      </div>
    </section>
  );
}
