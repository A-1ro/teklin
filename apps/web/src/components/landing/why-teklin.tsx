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
      className="px-4 py-16 md:px-7 md:py-24"
      style={{
        background: "var(--color-paper)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Kicker>§ 02 — why teklin</Kicker>
          <Display
            as="h2"
            size={40}
            className="!text-[30px] md:!text-[40px]"
            style={{ marginTop: 10 }}
          >
            既存ツールとの、違い。
          </Display>
        </div>

        {/* Three-column container */}
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            border: "1px solid var(--color-rule)",
            borderRadius: 14,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {columns.map((col, idx) => (
            <div
              key={col.num}
              className={
                idx < columns.length - 1
                  ? "border-b border-dashed border-rule md:border-b-0 md:border-r"
                  : ""
              }
              style={{
                padding: "32px 28px",
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
