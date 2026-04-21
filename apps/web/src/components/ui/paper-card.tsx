import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export function PaperCard({
  children,
  ruled = false,
  accent,
  style,
  className,
  onClick,
  hoverable,
}: {
  children: ReactNode;
  ruled?: boolean;
  accent?: string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: "#fff",
        border: `1px solid ${hoverable && hover ? "var(--color-teal)" : "var(--color-rule)"}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "transform 150ms, border-color 150ms",
        transform: hoverable && hover ? "translateY(-2px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: accent,
          }}
        />
      )}
      {ruled && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "linear-gradient(var(--color-rule) 1px, transparent 1px)",
            backgroundSize: "100% 28px",
            backgroundPosition: "0 27px",
            opacity: 0.35,
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
