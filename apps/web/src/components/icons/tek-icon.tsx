interface TekIconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

/**
 * Tek stone icon — a faceted gem shape used to represent the tek currency.
 * Uses currentColor so it inherits the text color from its container.
 *
 * Anatomy (24×24 viewBox):
 *   Crown (top half, y 3–10): flat table + two angled facets
 *   Girdle (y=10): widest horizontal line
 *   Pavilion (bottom half, y 10–22): two facets meeting at the culet point
 */
export function TekIcon({ size = 24, className, style }: TekIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* ── Gem silhouette ─────────────────────────────────────── */}
      {/* Outer body: flat-top pentagon (crown + pavilion) */}
      <path
        d="M5.5 3L18.5 3L22 10L12 22L2 10Z"
        fill="currentColor"
      />

      {/* ── Crown highlights ────────────────────────────────────── */}
      {/* Table (top center triangle) — brightest face */}
      <path
        d="M5.5 3L18.5 3L12 10Z"
        fill="white"
        fillOpacity="0.30"
      />
      {/* Left crown facet — subtle secondary highlight */}
      <path
        d="M2 10L5.5 3L12 10Z"
        fill="white"
        fillOpacity="0.10"
      />

      {/* ── Pavilion sheen ──────────────────────────────────────── */}
      {/* Right pavilion catches more light */}
      <path
        d="M22 10L12 22L12 10Z"
        fill="white"
        fillOpacity="0.12"
      />

      {/* ── Facet edge lines ────────────────────────────────────── */}
      {/* Crown dividers: table corners → girdle center */}
      <path
        d="M5.5 3L12 10M18.5 3L12 10"
        stroke="white"
        strokeWidth="0.75"
        strokeOpacity="0.50"
        strokeLinecap="round"
      />
      {/* Girdle line (widest horizontal) */}
      <path
        d="M2 10L22 10"
        stroke="white"
        strokeWidth="0.60"
        strokeOpacity="0.35"
      />
      {/* Pavilion center keel */}
      <path
        d="M12 10L12 22"
        stroke="white"
        strokeWidth="0.60"
        strokeOpacity="0.22"
      />
    </svg>
  );
}
