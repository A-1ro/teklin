import type { ElementType, CSSProperties, ReactNode } from "react";

export function Display({
  as: Tag = "h1",
  children,
  size = 44,
  style,
  className,
}: {
  as?: ElementType;
  children: ReactNode;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <Tag
      className={className}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1.05,
        color: "var(--color-ink)",
        margin: 0,
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
