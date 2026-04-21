import type { ReactNode } from "react";

const colorMap = {
  ink: { bg: "#EEE8D6", fg: "var(--color-ink)", bd: "var(--color-rule)" },
  teal: { bg: "var(--color-teal-50)", fg: "var(--color-teal-dark)", bd: "#bfdedd" },
  coral: { bg: "var(--color-coral-50)", fg: "var(--color-coral-fg)", bd: "#efc8c0" },
  mustard: { bg: "var(--color-mustard-50)", fg: "var(--color-mustard-fg)", bd: "#e6d49a" },
  plum: { bg: "var(--color-plum-50)", fg: "var(--color-plum)", bd: "#ddcceb" },
  ghost: { bg: "var(--color-paper-2)", fg: "var(--color-ink-2)", bd: "var(--color-rule)" },
} as const;

type PillColor = keyof typeof colorMap;

export function Pill({
  children,
  color = "ink",
}: {
  children: ReactNode;
  color?: PillColor;
}) {
  const s = colorMap[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </span>
  );
}
