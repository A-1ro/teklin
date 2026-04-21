import { useNavigate } from "react-router";
import { PaperCard } from "@/components/ui/paper-card";
import { TapeTag } from "@/components/ui/tape-tag";
import { TkButton } from "@/components/ui/tk-button";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";

const freeFeatures = [
  { num: "01", label: "Daily Lesson 1日1本" },
  { num: "02", label: "Phrase Cards 閲覧" },
  { num: "03", label: "AI Rewrite 3回/日" },
];

const proFeatures = [
  { num: "01", label: "Daily Lesson 無制限" },
  { num: "02", label: "Phrase Cards 保存無制限" },
  { num: "03", label: "AI Rewrite 無制限" },
  { num: "04", label: "進捗レポート" },
];

export function Pricing() {
  const navigate = useNavigate();

  return (
    <section
      id="pricing"
      style={{
        padding: "96px 28px",
        background: "var(--color-paper)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Kicker>§ 04 — pricing</Kicker>
          <Display as="h2" size={40} style={{ marginTop: 10 }}>
            シンプルな、2プラン。
          </Display>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* Free plan */}
          <PaperCard style={{ background: "#fff", padding: "28px 28px 26px" }}>
            <div style={{ marginBottom: 12 }}>
              <TapeTag color="ghost">plan_free</TapeTag>
            </div>
            <Display as="h3" size={22}>
              Free
            </Display>
            <div
              style={{
                margin: "10px 0 0",
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 48,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "var(--color-ink)",
                  lineHeight: 1,
                }}
              >
                ¥0
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-ink-2)",
                fontWeight: 500,
                margin: "6px 0 20px",
              }}
            >
              まずは試す
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {freeFeatures.map((f) => (
                <div
                  key={f.num}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-3)",
                      minWidth: 22,
                    }}
                  >
                    {f.num}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--color-ink)",
                    }}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <TkButton
              variant="ghost"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate("/login")}
            >
              無料で始める
            </TkButton>
          </PaperCard>

          {/* Pro plan */}
          <PaperCard
            accent="var(--color-teal)"
            style={{
              background: "var(--color-teal-50)",
              padding: "28px 28px 26px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <TapeTag color="teal">plan_pro</TapeTag>
              <TapeTag color="coral">おすすめ</TapeTag>
            </div>
            <Display as="h3" size={22}>
              Pro
            </Display>
            <div
              style={{
                margin: "10px 0 0",
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 48,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "var(--color-ink)",
                  lineHeight: 1,
                }}
              >
                ¥980
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: "var(--color-ink-2)",
                  fontWeight: 500,
                }}
              >
                /月
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-ink-2)",
                fontWeight: 500,
                margin: "6px 0 20px",
              }}
            >
              毎日つかうなら
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {proFeatures.map((f) => (
                <div
                  key={f.num}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-3)",
                      minWidth: 22,
                    }}
                  >
                    {f.num}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--color-ink)",
                    }}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <TkButton
              variant="primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate("/login")}
            >
              Proへ進む
            </TkButton>
          </PaperCard>
        </div>
      </div>
    </section>
  );
}
