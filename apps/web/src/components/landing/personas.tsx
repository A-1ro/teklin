import { PaperCard } from "@/components/ui/paper-card";
import { TapeTag } from "@/components/ui/tape-tag";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";

const personas = [
  {
    id: "persona_01",
    emoji: "🧭",
    title: "シニア",
    desc: "海外チームと、もう一段上の協業を。",
  },
  {
    id: "persona_02",
    emoji: "✈",
    title: "スイッチ希望",
    desc: "外資・グローバルへの転職を視野に。",
  },
  {
    id: "persona_03",
    emoji: "◇",
    title: "OSS",
    desc: "Issue・レビューで萎縮せず発言したい。",
  },
];

export function Personas() {
  return (
    <section
      id="personas"
      style={{
        padding: "96px 28px",
        background: "var(--color-paper-2)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Kicker>§ 03 — personas</Kicker>
          <Display as="h2" size={40} style={{ marginTop: 10 }}>
            こんなエンジニアに。
          </Display>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
          }}
        >
          {personas.map((persona) => (
            <PaperCard
              key={persona.id}
              style={{ padding: "28px 26px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 36, lineHeight: 1 }}>
                  {persona.emoji}
                </span>
                <TapeTag color="ghost">{persona.id}</TapeTag>
              </div>
              <Display as="h3" size={22} style={{ marginBottom: 6 }}>
                {persona.title}
              </Display>
              <p
                style={{
                  fontSize: 14.5,
                  color: "var(--color-ink-2)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {persona.desc}
              </p>
            </PaperCard>
          ))}
        </div>
      </div>
    </section>
  );
}
