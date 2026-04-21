export function Kicker({
  children,
  color = "var(--color-teal)",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="uppercase"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        color,
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}
