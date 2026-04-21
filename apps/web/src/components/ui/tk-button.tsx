import { useState } from "react";
import type { CSSProperties, ReactNode, MouseEvent } from "react";

const variants = {
  primary: {
    bg: "var(--color-teal)",
    fg: "#fff",
    border: "var(--color-teal)",
  },
  teal: {
    bg: "var(--color-teal)",
    fg: "#fff",
    border: "var(--color-teal)",
  },
  coral: {
    bg: "var(--color-coral)",
    fg: "#fff",
    border: "var(--color-coral)",
  },
  plum: {
    bg: "var(--color-plum)",
    fg: "#fff",
    border: "var(--color-plum)",
  },
  ghost: {
    bg: "transparent",
    fg: "var(--color-ink)",
    border: "#C9C0A8",
  },
} as const;

type ButtonVariant = keyof typeof variants;
type ButtonSize = "sm" | "md" | "lg";

export function TkButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  kicker,
  style,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  kicker?: string;
  style?: CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const [hover, setHover] = useState(false);
  const v = variants[variant];
  const pad =
    size === "lg" ? "14px 26px" : size === "sm" ? "6px 14px" : "11px 20px";
  const font = size === "lg" ? 15 : size === "sm" ? 12 : 13;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: v.bg,
        color: v.fg,
        border: `1.5px solid ${v.border}`,
        fontSize: font,
        fontWeight: 600,
        padding: pad,
        borderRadius: 999,
        fontFamily: "inherit",
        letterSpacing: "-0.005em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "transform 140ms, background 140ms",
        transform: hover && !disabled ? "translateY(-1px)" : "none",
        ...style,
      }}
    >
      {kicker && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: font - 3,
            opacity: 0.6,
            fontWeight: 500,
          }}
        >
          {kicker}
        </span>
      )}
      {children}
      <span
        aria-hidden="true"
        style={{
          marginLeft: -2,
          opacity: 0.7,
          transform: hover ? "translateX(2px)" : "none",
          transition: "transform 140ms",
        }}
      >
        →
      </span>
    </button>
  );
}
