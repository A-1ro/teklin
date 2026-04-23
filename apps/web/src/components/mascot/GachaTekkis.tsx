import type { TekkiId } from "@teklin/shared";

interface GachaTekkiProps {
  tekkiId: TekkiId;
  size?: number;
}

export function GachaTekkiSvg({ tekkiId, size = 120 }: GachaTekkiProps) {
  switch (tekkiId) {
    case "default":
      return <TekkiDefault size={size} />;
    case "cool":
      return <TekkiCool size={size} />;
    case "pink":
      return <TekkiPink size={size} />;
    case "mint":
      return <TekkiMint size={size} />;
    case "night":
      return <TekkiNight size={size} />;
    case "coral":
      return <TekkiCoral size={size} />;
    case "plum":
      return <TekkiPlum size={size} />;
    case "gold":
      return <TekkiGold size={size} />;
    case "wizard":
      return <TekkiWizard size={size} />;
    case "cosmos":
      return <TekkiCosmos size={size} />;
    default:
      return <TekkiDefault size={size} />;
  }
}

// ---------------------------------------------------------------------------
// default (N) — Standard teal Tekki
// ---------------------------------------------------------------------------
function TekkiDefault({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="テッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#0E7C7B" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#0E7C7B" />
      {/* Eyes */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      {/* Blush */}
      <circle cx="52" cy="110" r="5" fill="#D9634F" opacity="0.5" />
      <circle cx="128" cy="110" r="5" fill="#D9634F" opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// cool (N) — Dark navy body with pixel sunglasses
// ---------------------------------------------------------------------------
function TekkiCool({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="クールテッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#1A2B4A" />
      {/* Highlight stripe */}
      <rect
        x="38"
        y="58"
        width="104"
        height="10"
        rx="5"
        fill="#FFFFFF"
        opacity="0.08"
      />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#1A2B4A" />
      {/* Sunglasses: left lens */}
      <rect x="38" y="88" width="44" height="22" rx="8" fill="#0D1F36" />
      {/* Sunglasses: right lens */}
      <rect x="98" y="88" width="44" height="22" rx="8" fill="#0D1F36" />
      {/* Sunglasses: bridge */}
      <rect x="80" y="96" width="20" height="6" rx="3" fill="#0D1F36" />
      {/* Lens shine */}
      <rect
        x="44"
        y="93"
        width="12"
        height="5"
        rx="2"
        fill="#FFFFFF"
        opacity="0.15"
      />
      <rect
        x="104"
        y="93"
        width="12"
        height="5"
        rx="2"
        fill="#FFFFFF"
        opacity="0.15"
      />
      {/* Mouth */}
      <rect x="83" y="124" width="14" height="4" rx="2" fill="#FAF7F1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// pink (N) — Rose pink body with larger heart blush
// ---------------------------------------------------------------------------
function TekkiPink({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="ローズテッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#D4748A" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#D4748A" />
      {/* Eyes */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      {/* Larger heart-style blush */}
      <circle cx="52" cy="110" r="8" fill="#FF6B9D" opacity="0.6" />
      <circle cx="128" cy="110" r="8" fill="#FF6B9D" opacity="0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// mint (N) — Mint green body with sparkle star decoration
// ---------------------------------------------------------------------------
function TekkiMint({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="ミントテッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#4AB5A3" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#4AB5A3" />
      {/* 4-point star decoration top-right */}
      <path
        d="M148 52 L150 46 L152 52 L158 54 L152 56 L150 62 L148 56 L142 54 Z"
        fill="#FAF7F1"
        opacity="0.6"
      />
      {/* Small star center dot */}
      <circle cx="150" cy="54" r="2" fill="#FFFFFF" opacity="0.8" />
      {/* Eyes */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      {/* Blush */}
      <circle cx="52" cy="110" r="5" fill="#D9634F" opacity="0.5" />
      <circle cx="128" cy="110" r="5" fill="#D9634F" opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// night (N) — Deep navy body with stars and star-shaped eyes
// ---------------------------------------------------------------------------
function TekkiNight({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="ナイトテッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#0D1B2A" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#0D1B2A" />
      {/* Scattered tiny stars on body */}
      <circle cx="50" cy="60" r="1.5" fill="#FAF7F1" opacity="0.5" />
      <circle cx="80" cy="50" r="1" fill="#FAF7F1" opacity="0.5" />
      <circle cx="130" cy="55" r="2" fill="#FAF7F1" opacity="0.5" />
      <circle cx="110" cy="70" r="1.5" fill="#FAF7F1" opacity="0.5" />
      <circle cx="60" cy="75" r="1" fill="#FAF7F1" opacity="0.5" />
      <circle cx="140" cy="78" r="1" fill="#FAF7F1" opacity="0.4" />
      <circle cx="45" cy="90" r="1" fill="#FAF7F1" opacity="0.3" />
      {/* Crescent moon accent */}
      <path
        d="M80 42 Q94 36 98 48 Q88 44 84 52 Q76 50 80 42 Z"
        fill="#FAF7F1"
        opacity="0.5"
      />
      {/* Left eye — 4-point star */}
      <path
        d="M62 88 L64 98 L70 100 L64 102 L62 112 L60 102 L54 100 L60 98 Z"
        fill="#FAF7F1"
      />
      {/* Right eye — 4-point star */}
      <path
        d="M118 88 L120 98 L126 100 L120 102 L118 112 L116 102 L110 100 L116 98 Z"
        fill="#FAF7F1"
      />
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// coral (R) — Coral body with golden crown
// ---------------------------------------------------------------------------
function TekkiCoral({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="コーラルテッキ"
      style={{ overflow: "visible" }}
    >
      {/* Crown base */}
      <rect x="70" y="22" width="40" height="12" rx="4" fill="#C99412" />
      {/* Crown points */}
      <path d="M72 22 L78 10 L84 22" fill="#C99412" />
      <path d="M88 22 L90 10 L92 22" fill="#C99412" />
      <path d="M96 22 L102 10 L108 22" fill="#C99412" />
      {/* Crown gems */}
      <circle cx="78" cy="14" r="3" fill="#FAF7F1" opacity="0.9" />
      <circle cx="90" cy="10" r="3" fill="#FAF7F1" />
      <circle cx="102" cy="14" r="3" fill="#FAF7F1" opacity="0.9" />
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#D9634F" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#D9634F" />
      {/* Eyes */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      {/* Blush */}
      <circle cx="52" cy="110" r="5" fill="#FFD4CC" opacity="0.6" />
      <circle cx="128" cy="110" r="5" fill="#FFD4CC" opacity="0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// plum (R) — Purple body with crescent moon badge
// ---------------------------------------------------------------------------
function TekkiPlum({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="プラムテッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#6B4E8C" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#6B4E8C" />
      {/* Moon badge on body */}
      <path
        d="M108 56 Q120 50 124 62 Q115 58 112 68 Q103 65 108 56 Z"
        fill="#FAF7F1"
        opacity="0.6"
      />
      {/* Eyes */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#FAF7F1" />
      {/* Blush */}
      <circle cx="52" cy="110" r="5" fill="#A78BCC" opacity="0.5" />
      <circle cx="128" cy="110" r="5" fill="#A78BCC" opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// gold (R) — Gold/mustard body with shine and sparkle dots
// ---------------------------------------------------------------------------
function TekkiGold({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="ゴールドテッキ"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#C99412" />
      {/* Body shine highlight */}
      <rect
        x="38"
        y="50"
        width="104"
        height="14"
        rx="7"
        fill="#FAF7F1"
        opacity="0.20"
      />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#C99412" />
      {/* Sparkle dots */}
      <circle cx="48" cy="70" r="2" fill="#FAF7F1" opacity="0.5" />
      <circle cx="130" cy="65" r="2" fill="#FAF7F1" opacity="0.5" />
      <circle cx="90" cy="55" r="2.5" fill="#FAF7F1" opacity="0.5" />
      <circle cx="60" cy="90" r="1.5" fill="#FAF7F1" opacity="0.5" />
      <circle cx="120" cy="85" r="1.5" fill="#FAF7F1" opacity="0.5" />
      {/* Eyes (dark for contrast) */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#1A1A00"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#1A1A00"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#1A1A00" />
      {/* Blush */}
      <circle cx="52" cy="110" r="5" fill="#8B6B00" opacity="0.4" />
      <circle cx="128" cy="110" r="5" fill="#8B6B00" opacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// wizard (SR) — Dark plum body with wizard hat and sparkles
// ---------------------------------------------------------------------------
function TekkiWizard({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 200"
      width={size}
      height={size * (200 / 180)}
      aria-label="ウィザードテッキ"
      style={{ overflow: "visible" }}
    >
      {/* Wizard hat cone (goes above viewBox) */}
      <path d="M64 50 L90 8 L116 50 Z" fill="#3D2564" />
      {/* Hat band */}
      <rect x="62" y="42" width="56" height="8" fill="#2A1848" />
      {/* Hat brim */}
      <rect x="46" y="50" width="88" height="10" rx="5" fill="#2A1848" />
      {/* Star on hat tip */}
      <path
        d="M90 8 L92 14 L98 14 L93 18 L95 24 L90 20 L85 24 L87 18 L82 14 L88 14 Z"
        fill="#C99412"
      />
      {/* Body */}
      <rect x="26" y="52" width="128" height="110" rx="28" fill="#3D2564" />
      {/* Tail */}
      <path d="M66 162 L72 186 L92 162 Z" fill="#3D2564" />
      {/* Left sparkle */}
      <path
        d="M28 100 L30 94 L32 100 L38 102 L32 104 L30 110 L28 104 L22 102 Z"
        fill="#C99412"
        opacity="0.8"
      />
      {/* Right sparkle */}
      <path
        d="M152 100 L154 94 L156 100 L162 102 L156 104 L154 110 L152 104 L146 102 Z"
        fill="#C99412"
        opacity="0.8"
      />
      {/* Eyes */}
      <text
        x="62"
        y="128"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &gt;
      </text>
      <text
        x="118"
        y="128"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#FAF7F1"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="140" width="14" height="4" rx="2" fill="#FAF7F1" />
      {/* Blush */}
      <circle cx="52" cy="130" r="5" fill="#A78BCC" opacity="0.5" />
      <circle cx="128" cy="130" r="5" fill="#A78BCC" opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// cosmos (SSR) — Deep space black body with star halo and cyan eyes
// ---------------------------------------------------------------------------
function TekkiCosmos({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="コスモステッキ"
      style={{ overflow: "visible" }}
    >
      {/* Star halo ring */}
      <circle
        cx="90"
        cy="50"
        r="52"
        fill="none"
        stroke="#C99412"
        strokeWidth="2"
        strokeDasharray="4 8"
        opacity="0.7"
      />
      {/* Halo star dots */}
      <circle cx="90" cy="0" r="3.5" fill="#C99412" />
      <circle cx="52" cy="14" r="3" fill="#C99412" />
      <circle cx="128" cy="14" r="3" fill="#C99412" />
      <circle cx="38" cy="50" r="3" fill="#C99412" />
      <circle cx="142" cy="50" r="3" fill="#C99412" />
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#0D1422" />
      {/* Nebula glow */}
      <circle
        cx="90"
        cy="80"
        r="48"
        fill="#1A2A6C"
        opacity="0.3"
      />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#0D1422" />
      {/* Tiny star dots on body */}
      <circle cx="40" cy="55" r="1.5" fill="#FAF7F1" opacity="0.7" />
      <circle cx="130" cy="60" r="1" fill="#FAF7F1" opacity="0.5" />
      <circle cx="75" cy="50" r="1.5" fill="#FAF7F1" opacity="0.6" />
      <circle cx="115" cy="80" r="1" fill="#FAF7F1" opacity="0.5" />
      <circle cx="55" cy="85" r="1" fill="#FAF7F1" opacity="0.4" />
      <circle cx="145" cy="100" r="1.5" fill="#FAF7F1" opacity="0.6" />
      <circle cx="38" cy="100" r="1" fill="#FAF7F1" opacity="0.5" />
      <circle cx="120" cy="115" r="1" fill="#FAF7F1" opacity="0.4" />
      {/* Eyes (cyan glow) */}
      <text
        x="62"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#7DF9FF"
      >
        &gt;
      </text>
      <text
        x="118"
        y="108"
        fontSize="48"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fontWeight="700"
        fill="#7DF9FF"
      >
        &lt;
      </text>
      {/* Mouth */}
      <rect x="83" y="120" width="14" height="4" rx="2" fill="#7DF9FF" />
      {/* Subtle cyan blush */}
      <circle cx="52" cy="110" r="5" fill="#7DF9FF" opacity="0.2" />
      <circle cx="128" cy="110" r="5" fill="#7DF9FF" opacity="0.2" />
    </svg>
  );
}
