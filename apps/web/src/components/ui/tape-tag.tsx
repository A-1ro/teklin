const colorMap = {
  ink: { bg: "#EEE8D6", fg: "var(--color-ink)" },
  teal: { bg: "var(--color-teal-50)", fg: "var(--color-teal-dark)" },
  coral: { bg: "var(--color-coral-50)", fg: "var(--color-coral-fg)" },
  mustard: { bg: "var(--color-mustard-50)", fg: "var(--color-mustard-fg)" },
  plum: { bg: "var(--color-plum-50)", fg: "var(--color-plum)" },
  ghost: { bg: "var(--color-paper-2)", fg: "var(--color-ink-2)" },
} as const;

type TapeTagColor = keyof typeof colorMap;

export function TapeTag({
  children,
  color = "ink",
}: {
  children: React.ReactNode;
  color?: TapeTagColor;
}) {
  const s = colorMap[color];
  return (
    <span
      className="inline-flex items-center lowercase"
      style={{
        background: s.bg,
        color: s.fg,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        padding: "3px 8px",
        borderRadius: 3,
      }}
    >
      {children}
    </span>
  );
}
