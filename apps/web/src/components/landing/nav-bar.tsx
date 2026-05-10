import { useState } from "react";
import { useNavigate } from "react-router";
import { TkButton } from "@/components/ui/tk-button";
import { Wordmark } from "@/components/ui/wordmark";

const NAV_LINKS = [
  { href: "#features", label: "機能" },
  { href: "#why", label: "なぜTeklin" },
  { href: "#personas", label: "対象" },
  { href: "#pricing", label: "料金" },
];

export function NavBar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      }}
    >
      <div
        className="px-4 md:px-7"
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 28,
          height: 56,
        }}
      >
        <Wordmark size={18} />

        {/* Desktop nav */}
        <nav
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 28 }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-ink)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <a
            href="/login"
            className="hidden sm:inline"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-ink-2)",
              textDecoration: "none",
            }}
          >
            ログイン
          </a>
          <TkButton kicker="01" size="sm" onClick={() => navigate("/login")}>
            無料で始める
          </TkButton>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={mobileOpen}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "var(--color-ink)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          className="flex flex-col md:hidden"
          style={{
            borderTop: "1px dashed var(--color-rule)",
            background: "rgba(250,247,241,0.98)",
            padding: "12px 16px 16px",
            gap: 4,
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "10px 12px",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--color-ink)",
                textDecoration: "none",
                borderRadius: 8,
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/login"
            className="sm:hidden"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "block",
              padding: "10px 12px",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--color-ink-2)",
              textDecoration: "none",
              borderRadius: 8,
            }}
          >
            ログイン
          </a>
        </nav>
      )}
    </header>
  );
}
