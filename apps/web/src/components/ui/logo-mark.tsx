export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="28" height="22" rx="6" fill="var(--color-teal)" />
      <text
        x="16"
        y="19"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontWeight="700"
        fontSize="12"
        fill="#FAF7F1"
        letterSpacing="-0.02em"
      >
        &gt;_
      </text>
      <path d="M10 26 L12 30 L15 26 Z" fill="var(--color-teal)" />
    </svg>
  );
}
