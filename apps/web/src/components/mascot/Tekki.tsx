export type TekkiPose =
  | "idle"
  | "wave"
  | "thinking"
  | "cheer"
  | "sleepy"
  | "oops"
  | "streak"
  | "focus";

interface TekkiProps {
  pose?: TekkiPose;
  size?: number;
  ariaLabel?: string;
}

interface PoseProps {
  size?: number;
  ariaLabel?: string;
}

export function Tekki({ pose = "idle", size, ariaLabel }: TekkiProps) {
  switch (pose) {
    case "wave":
      return <TekkiWave size={size} ariaLabel={ariaLabel} />;
    case "thinking":
      return <TekkiThinking size={size} ariaLabel={ariaLabel} />;
    case "cheer":
      return <TekkiCheer size={size} ariaLabel={ariaLabel} />;
    case "sleepy":
      return <TekkiSleepy size={size} ariaLabel={ariaLabel} />;
    case "idle":
    default:
      return <TekkiIdle size={size} ariaLabel={ariaLabel} />;
  }
}

export function TekkiWave({
  size = 120,
  ariaLabel = "Tekki waving",
}: PoseProps) {
  return (
    <svg
      viewBox="0 0 260 260"
      width={size}
      height={size}
      aria-label={ariaLabel}
      style={{ overflow: "visible" }}
    >
      <ellipse cx="130" cy="248" rx="58" ry="5" fill="#000" opacity="0.08" />
      <g className="tk-float" transform="translate(20 10)">
        <rect x="78" y="178" width="14" height="28" rx="7" fill="#0A5E5D" />
        <rect x="128" y="178" width="14" height="28" rx="7" fill="#0A5E5D" />
        <rect x="70" y="200" width="26" height="12" rx="6" fill="#3B3A36" />
        <rect x="124" y="200" width="26" height="12" rx="6" fill="#3B3A36" />
        <rect x="24" y="44" width="172" height="140" rx="36" fill="#0E7C7B" />
        <path d="M72 184 L80 212 L104 184 Z" fill="#0E7C7B" />
        <rect
          x="38"
          y="58"
          width="144"
          height="14"
          rx="7"
          fill="#FFFFFF"
          opacity="0.12"
        />
        <path
          d="M24 118 Q8 130 18 156"
          fill="none"
          stroke="#0A5E5D"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="18" cy="158" r="10" fill="#0A5E5D" />
        <g className="tk-wave">
          <path
            d="M196 110 Q226 84 214 56"
            fill="none"
            stroke="#0A5E5D"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx="214" cy="54" r="12" fill="#0A5E5D" />
          <path
            className="tk-sparkA"
            d="M226 46 Q232 40 238 44"
            stroke="#C99412"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            className="tk-sparkB"
            d="M228 58 Q236 56 240 62"
            stroke="#C99412"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        <g
          className="tk-blink"
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          fontWeight="700"
          fill="#FAF7F1"
        >
          <text x="62" y="146" fontSize="60" textAnchor="middle">
            &gt;
          </text>
          <text x="158" y="146" fontSize="60" textAnchor="middle">
            &lt;
          </text>
        </g>
        <circle cx="52" cy="156" r="5" fill="#D9634F" opacity="0.5" />
        <circle cx="168" cy="156" r="5" fill="#D9634F" opacity="0.5" />
        <rect x="102" y="160" width="16" height="4" rx="2" fill="#FAF7F1" />
      </g>
    </svg>
  );
}

export function TekkiIdle({ size = 36, ariaLabel = "Tekki" }: PoseProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label={ariaLabel}
    >
      <g className="tk-float">
        <rect x="26" y="32" width="128" height="110" rx="28" fill="#0E7C7B" />
        <path d="M66 142 L72 166 L92 142 Z" fill="#0E7C7B" />
        <g
          className="tk-blink"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          fill="#FAF7F1"
        >
          <text x="62" y="108" fontSize="48" textAnchor="middle">
            &gt;
          </text>
          <text x="118" y="108" fontSize="48" textAnchor="middle">
            &lt;
          </text>
        </g>
        <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      </g>
    </svg>
  );
}

export function TekkiThinking({
  size = 120,
  ariaLabel = "Tekki thinking",
}: PoseProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label={ariaLabel}
    >
      <ellipse cx="90" cy="172" rx="48" ry="5" fill="#000" opacity="0.08" />
      <g className="tk-tilt">
        <rect x="68" y="132" width="11" height="20" rx="5" fill="#0A5E5D" />
        <rect x="101" y="132" width="11" height="20" rx="5" fill="#0A5E5D" />
        <rect x="62" y="148" width="22" height="10" rx="5" fill="#3B3A36" />
        <rect x="96" y="148" width="22" height="10" rx="5" fill="#3B3A36" />
        <rect x="26" y="32" width="128" height="110" rx="28" fill="#0E7C7B" />
        <path d="M66 142 L72 166 L92 142 Z" fill="#0E7C7B" />
        <path
          d="M28 92 Q14 108 24 128"
          fill="none"
          stroke="#0A5E5D"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="24" cy="130" r="9" fill="#0A5E5D" />
        <path
          d="M152 92 Q168 82 134 68"
          fill="none"
          stroke="#0A5E5D"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="132" cy="66" r="9" fill="#0A5E5D" />
        <g
          className="tk-blink"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          fill="#FAF7F1"
        >
          <text x="62" y="108" fontSize="48" textAnchor="middle">
            &gt;
          </text>
          <text x="118" y="108" fontSize="48" textAnchor="middle">
            &lt;
          </text>
        </g>
        <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      </g>
      <g fill="#6B6960">
        <circle className="tk-think1" cx="146" cy="28" r="4" />
        <circle className="tk-think2" cx="158" cy="18" r="5" />
        <circle className="tk-think3" cx="172" cy="8" r="6" />
      </g>
    </svg>
  );
}

export function TekkiCheer({
  size = 140,
  ariaLabel = "Tekki cheering",
}: PoseProps) {
  return (
    <svg
      viewBox="0 0 180 200"
      width={size}
      height={size * (200 / 180)}
      aria-label={ariaLabel}
    >
      <ellipse cx="90" cy="188" rx="48" ry="5" fill="#000" opacity="0.08" />
      <g fill="#C99412">
        <path
          className="tk-sparkUp1"
          d="M0 0 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 z"
          transform="translate(30 40)"
        />
        <path
          className="tk-sparkUp2"
          d="M0 0 l2.4 4.8 l4.8 2.4 l-4.8 2.4 l-2.4 4.8 l-2.4 -4.8 l-4.8 -2.4 l4.8 -2.4 z"
          transform="translate(150 36)"
        />
        <path
          className="tk-sparkUp3"
          d="M0 0 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z"
          transform="translate(20 100)"
        />
      </g>
      <g className="tk-jump">
        <rect x="68" y="148" width="11" height="20" rx="5" fill="#0A5E5D" />
        <rect x="101" y="148" width="11" height="20" rx="5" fill="#0A5E5D" />
        <rect x="62" y="164" width="22" height="10" rx="5" fill="#3B3A36" />
        <rect x="96" y="164" width="22" height="10" rx="5" fill="#3B3A36" />
        <rect x="26" y="48" width="128" height="110" rx="28" fill="#0E7C7B" />
        <path d="M66 158 L72 182 L92 158 Z" fill="#0E7C7B" />
        <path
          d="M32 96 Q10 70 22 46"
          fill="none"
          stroke="#0A5E5D"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="22" cy="44" r="10" fill="#0A5E5D" />
        <path
          d="M148 96 Q170 70 158 46"
          fill="none"
          stroke="#0A5E5D"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="158" cy="44" r="10" fill="#0A5E5D" />
        <path
          d="M52 108 Q62 96 72 108"
          stroke="#FAF7F1"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M108 108 Q118 96 128 108"
          stroke="#FAF7F1"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="42" cy="118" r="4" fill="#D9634F" opacity="0.55" />
        <circle cx="138" cy="118" r="4" fill="#D9634F" opacity="0.55" />
        <path
          d="M78 122 Q90 138 102 122"
          stroke="#FAF7F1"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function TekkiSleepy({
  size = 140,
  ariaLabel = "Tekki sleeping",
}: PoseProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label={ariaLabel}
    >
      <ellipse cx="90" cy="172" rx="48" ry="5" fill="#000" opacity="0.08" />
      <g className="tk-breathe">
        <rect x="68" y="132" width="11" height="20" rx="5" fill="#0A5E5D" />
        <rect x="101" y="132" width="11" height="20" rx="5" fill="#0A5E5D" />
        <rect x="62" y="148" width="22" height="10" rx="5" fill="#3B3A36" />
        <rect x="96" y="148" width="22" height="10" rx="5" fill="#3B3A36" />
        <rect
          x="26"
          y="32"
          width="128"
          height="110"
          rx="28"
          fill="#0E7C7B"
          opacity="0.85"
        />
        <path d="M66 142 L72 166 L92 142 Z" fill="#0E7C7B" opacity="0.85" />
        <path d="M66 24 Q90 -2 128 20 L128 40 L66 40 Z" fill="#6B4E8C" />
        <circle cx="70" cy="22" r="8" fill="#F1ECDF" />
        <path
          d="M52 100 Q62 108 72 100"
          stroke="#FAF7F1"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M108 100 Q118 108 128 100"
          stroke="#FAF7F1"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      </g>
      <g fontFamily="ui-serif, Georgia, serif" fill="#6B4E8C" fontWeight="600">
        <text className="tk-z1" x="150" y="36" fontSize="14">
          z
        </text>
        <text className="tk-z2" x="150" y="36" fontSize="18">
          z
        </text>
        <text className="tk-z3" x="150" y="36" fontSize="22">
          Z
        </text>
      </g>
    </svg>
  );
}
