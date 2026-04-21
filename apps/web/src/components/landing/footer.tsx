import { Wordmark } from "@/components/ui/wordmark";

export function Footer() {
  return (
    <footer
      className="px-4 py-6 md:px-7 md:py-8"
      style={{
        borderTop: "1px solid var(--color-rule)",
        background: "var(--color-paper)",
      }}
    >
      <div
        className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
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
