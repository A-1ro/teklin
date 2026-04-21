import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";

const columns = [
  {
    num: "01",
    title: "技術英語に特化",
    desc: "PR・コミット・ドキュメントの語彙だけ。無駄なく、まっすぐ。",
    kickerColor: "var(--color-coral)",
  },
  {
    num: "02",
    title: "5分で完結",
    desc: "通勤・休憩の隙間で終わる。毎日つづけられる設計。",
    kickerColor: "var(--color-coral)",
  },
  {
    num: "03",
    title: "「なぜ」が返る",
    desc: "AIが表現の理由まで添える。暗記ではなく理屈で身につく。",
    kickerColor: "var(--color-coral)",
  },
];

export function WhyTeklin() {
  return (
    <section
      id="why"
      style={{
        padding: "96px 28px",
        background: "var(--color-paper)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Kicker>§ 02 — why teklin</Kicker>
          <Display as="h2" size={40} style={{ marginTop: 10 }}>
            既存ツールとの、違い。
          </Display>
        </div>

        {/* Three-column container */}
        <div
          style={{
            border: "1px solid var(--color-rule)",
            borderRadius: 14,
            overflow: "hidden",
            background: "#fff",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
          }}
        >
          {columns.map((col, idx) => (
            <div
              key={col.num}
              style={{
                padding: "32px 28px",
                borderRight:
                  idx < columns.length - 1
                    ? "1px dashed var(--color-rule)"
                    : undefined,
              }}
            >
              <Kicker color={col.kickerColor}>{col.num}</Kicker>
              <Display
                as="h3"
                size={22}
                style={{ marginTop: 10, marginBottom: 8 }}
              >
                {col.title}
              </Display>
              <p
                style={{
                  fontSize: 14.5,
                  color: "var(--color-ink-2)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {col.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
