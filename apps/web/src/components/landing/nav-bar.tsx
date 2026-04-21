import { useNavigate } from "react-router";
import { TkButton } from "@/components/ui/tk-button";
import { Wordmark } from "@/components/ui/wordmark";

export function NavBar() {
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        background: "rgba(250,247,241,0.86)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-rule)",
        height: 68,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Wordmark size={18} />

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <a
            href="#features"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              textDecoration: "none",
            }}
          >
            機能
          </a>
          <a
            href="#why"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              textDecoration: "none",
            }}
          >
            なぜTeklin
          </a>
          <a
            href="#personas"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              textDecoration: "none",
            }}
          >
            対象
          </a>
          <a
            href="#pricing"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink)",
              textDecoration: "none",
            }}
          >
            料金
          </a>
        </nav>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <a
            href="/login"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink-2)",
              textDecoration: "none",
            }}
          >
            ログイン
          </a>
          <TkButton
            kicker="01"
            size="sm"
            onClick={() => navigate("/login")}
          >
            無料で始める
          </TkButton>
        </div>
      </div>
    </header>
  );
}
