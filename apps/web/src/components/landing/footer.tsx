import { Wordmark } from "@/components/ui/wordmark";

export function Footer() {
  return (
    <footer
      style={{
        padding: "32px 28px",
        borderTop: "1px solid var(--color-rule)",
        background: "var(--color-paper)",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <Wordmark size={18} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-ink-3)",
          }}
        >
          © 2025 teklin · tech english for engineers
        </span>
      </div>
    </footer>
  );
}
