import { LogoMark } from "./logo-mark";

export function Wordmark({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <a
      href="/"
      className="inline-flex items-center no-underline text-ink"
      style={{
        gap: 10,
        fontFamily: "var(--font-display)",
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
    >
      <LogoMark size={30} />
      <span>
        Teklin<span className="text-teal">.</span>
      </span>
    </a>
  );
}
