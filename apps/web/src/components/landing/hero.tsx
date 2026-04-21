import { useNavigate } from "react-router";
import { TkButton } from "@/components/ui/tk-button";
import { PaperCard } from "@/components/ui/paper-card";
import { TapeTag } from "@/components/ui/tape-tag";
import { Kicker } from "@/components/ui/kicker";
import { Display } from "@/components/ui/display";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        padding: "88px 28px 72px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        {/* Left column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <TapeTag color="teal">f0 · beta</TapeTag>
            <Kicker color="var(--color-ink-2)">
              エンジニアのための技術英語
            </Kicker>
          </div>

          <Display size={64}>
            コードを書くように、
            <br />
            <span
              style={{ fontStyle: "italic", color: "var(--color-teal)" }}
            >
              英語を書く
            </span>
            。
          </Display>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: "var(--color-ink-2)",
              maxWidth: 640,
              margin: "24px 0 0",
            }}
          >
            PR、コミット、Slack、Issue。技術の現場で要る英語だけを、1日5分。
            <br />
            AIが「なぜその表現か」まで添えて返します。
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
            }}
          >
            <TkButton
              size="lg"
              kicker="→ cmd"
              onClick={() => navigate("/login")}
            >
              無料で始める
            </TkButton>
            <TkButton
              size="lg"
              variant="ghost"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              機能を見る
            </TkButton>
          </div>

          <p
            style={{
              marginTop: 22,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-ink-3)",
            }}
          >
            // クレジットカード不要 · 5分で開始
          </p>
        </div>

        {/* Right column */}
        <PaperCard style={{ padding: 0 }}>
          {/* Top bar */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px dashed var(--color-rule)",
              background: "var(--color-paper)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--color-coral)",
                }}
              />
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--color-mustard)",
                }}
              />
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--color-teal)",
                }}
              />
            </div>
            <TapeTag color="ghost">ai_rewrite.ts</TapeTag>
          </div>

          {/* Body */}
          <div
            style={{
              padding: "20px 20px 22px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: "var(--color-ink-3)" }}>
              {"// Commit message"}
            </div>
            <div
              style={{
                color: "var(--color-coral)",
                textDecoration: "line-through",
                textDecorationThickness: 1,
              }}
            >
              - fix bug
            </div>
            <div
              style={{
                color: "var(--color-teal)",
                fontWeight: 600,
              }}
            >
              + fix: handle null pointer in auth middleware
            </div>

            <div style={{ height: 12 }} />

            <div style={{ color: "var(--color-ink-3)" }}>
              {"// PR comment"}
            </div>
            <div
              style={{
                color: "var(--color-coral)",
                textDecoration: "line-through",
                textDecorationThickness: 1,
              }}
            >
              - looks ok but one thing
            </div>
            <div
              style={{
                color: "var(--color-teal)",
                fontWeight: 600,
              }}
            >
              + LGTM with one caveat — see thread.
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px dashed var(--color-rule)",
              background: "var(--color-paper)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TapeTag>tone: professional</TapeTag>
            <TapeTag color="ghost">ctx: PR</TapeTag>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-ink-3)",
              }}
            >
              ~0.4s
            </span>
          </div>
        </PaperCard>
      </div>
    </section>
  );
}
