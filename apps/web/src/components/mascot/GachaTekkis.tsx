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
    case "sleepy":
      return <TekkiSleepy size={size} />;
    case "cat":
      return <TekkiCat size={size} />;
    case "samurai":
      return <TekkiSamurai size={size} />;
    case "idol":
      return <TekkiIdol size={size} />;
    case "angel":
      return <TekkiAngel size={size} />;
    default:
      return <TekkiDefault size={size} />;
  }
}

// ---------------------------------------------------------------------------
// default (N) — Standard teal Tekki
// ---------------------------------------------------------------------------
function TekkiDefault({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 180 180" width={size} height={size} aria-label="Tekki">
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
      aria-label="クールTekki"
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
      aria-label="ローズTekki"
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
      aria-label="ミントTekki"
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
      aria-label="ナイトTekki"
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
      aria-label="コーラルTekki"
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
      aria-label="プラムTekki"
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
      aria-label="ゴールドTekki"
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
      aria-label="ウィザードTekki"
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
// sleepy (N) — Lavender body with nightcap and sleeping -- eyes
// ---------------------------------------------------------------------------
function TekkiSleepy({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="スリーピーTekki"
    >
      {/* Nightcap cone */}
      <path d="M70 32 L90 5 L110 32 Z" fill="#C4AAEE" />
      {/* Pompom */}
      <circle cx="90" cy="5" r="7" fill="#FAF7F1" />
      {/* Nightcap band */}
      <rect x="66" y="28" width="48" height="8" rx="4" fill="#B094DC" />
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#9884CC" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#9884CC" />
      {/* Sleeping eyes -- */}
      <rect x="44" y="90" width="36" height="7" rx="3.5" fill="#FAF7F1" />
      <rect x="100" y="90" width="36" height="7" rx="3.5" fill="#FAF7F1" />
      {/* Eyelashes */}
      <rect
        x="52"
        y="98"
        width="4"
        height="6"
        rx="2"
        fill="#FAF7F1"
        opacity="0.5"
      />
      <rect
        x="60"
        y="100"
        width="4"
        height="7"
        rx="2"
        fill="#FAF7F1"
        opacity="0.5"
      />
      <rect
        x="68"
        y="98"
        width="4"
        height="6"
        rx="2"
        fill="#FAF7F1"
        opacity="0.5"
      />
      <rect
        x="108"
        y="98"
        width="4"
        height="6"
        rx="2"
        fill="#FAF7F1"
        opacity="0.5"
      />
      <rect
        x="116"
        y="100"
        width="4"
        height="7"
        rx="2"
        fill="#FAF7F1"
        opacity="0.5"
      />
      <rect
        x="124"
        y="98"
        width="4"
        height="6"
        rx="2"
        fill="#FAF7F1"
        opacity="0.5"
      />
      {/* Small smile */}
      <path
        d="M80 116 Q90 124 100 116"
        stroke="#FAF7F1"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Zzz */}
      <text
        x="126"
        y="65"
        fontSize="16"
        fontWeight="700"
        fontFamily="ui-monospace,monospace"
        fill="#FAF7F1"
        opacity="0.8"
      >
        z
      </text>
      <text
        x="134"
        y="49"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace,monospace"
        fill="#FAF7F1"
        opacity="0.55"
      >
        z
      </text>
      <text
        x="140"
        y="37"
        fontSize="10"
        fontWeight="700"
        fontFamily="ui-monospace,monospace"
        fill="#FAF7F1"
        opacity="0.35"
      >
        z
      </text>
      {/* Soft blush */}
      <circle cx="46" cy="102" r="7" fill="#C4AAEE" opacity="0.55" />
      <circle cx="134" cy="102" r="7" fill="#C4AAEE" opacity="0.55" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// cat (R) — Orange body with cat ears, ^ ^ eyes and whiskers
// ---------------------------------------------------------------------------
function TekkiCat({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="キャットTekki"
    >
      {/* Left ear outer (same color as body, drawn before body) */}
      <path d="M44 32 L52 6 L76 32 Z" fill="#D97B2A" />
      {/* Right ear outer */}
      <path d="M104 32 L128 6 L136 32 Z" fill="#D97B2A" />
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#D97B2A" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#D97B2A" />
      {/* Left ear inner */}
      <path d="M50 30 L55 12 L70 30 Z" fill="#FFAAAA" opacity="0.75" />
      {/* Right ear inner */}
      <path d="M110 30 L125 12 L130 30 Z" fill="#FFAAAA" opacity="0.75" />
      {/* Eyes ^ ^ */}
      <path
        d="M44 100 Q62 80 80 100"
        stroke="#FAF7F1"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M100 100 Q118 80 136 100"
        stroke="#FAF7F1"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Nose */}
      <path d="M86 110 L90 116 L94 110 Z" fill="#FFAAAA" />
      {/* Mouth */}
      <path
        d="M82 116 Q90 124 98 116"
        stroke="#FAF7F1"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left whiskers */}
      <path
        d="M28 106 L76 109"
        stroke="#FAF7F1"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
      <path
        d="M28 114 L76 113"
        stroke="#FAF7F1"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
      <path
        d="M28 122 L76 117"
        stroke="#FAF7F1"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
      {/* Right whiskers */}
      <path
        d="M104 109 L152 106"
        stroke="#FAF7F1"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
      <path
        d="M104 113 L152 114"
        stroke="#FAF7F1"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
      <path
        d="M104 117 L152 122"
        stroke="#FAF7F1"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// samurai (SR) — Dark crimson body with kabuto helmet and stern = = eyes
// ---------------------------------------------------------------------------
function TekkiSamurai({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="サムライTekki"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#8B1A1A" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#8B1A1A" />
      {/* Helmet dome (semi-ellipse) */}
      <path d="M38 46 A52 46 0 0 0 142 46 Z" fill="#2A0808" />
      {/* Helmet brim */}
      <rect x="32" y="38" width="116" height="12" rx="6" fill="#1A0404" />
      {/* Gold finial */}
      <circle cx="90" cy="5" r="5" fill="#C99412" />
      {/* Gold trim on brim */}
      <rect
        x="34"
        y="47"
        width="112"
        height="2"
        rx="1"
        fill="#C99412"
        opacity="0.7"
      />
      {/* Stern eyes = = */}
      <rect x="44" y="88" width="38" height="8" rx="4" fill="#FAF7F1" />
      <rect x="98" y="88" width="38" height="8" rx="4" fill="#FAF7F1" />
      {/* Stern mouth */}
      <rect x="76" y="116" width="28" height="4" rx="2" fill="#FAF7F1" />
      {/* Armor plate details */}
      <rect
        x="50"
        y="106"
        width="80"
        height="3"
        rx="1.5"
        fill="#6A0A0A"
        opacity="0.5"
      />
      <rect
        x="50"
        y="113"
        width="80"
        height="3"
        rx="1.5"
        fill="#6A0A0A"
        opacity="0.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// idol (SR) — Pastel pink body with bow, heart eyes and microphone
// ---------------------------------------------------------------------------
function TekkiIdol({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="アイドルTekki"
    >
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#E080AA" />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#E080AA" />
      {/* Bow ribbon: left wing */}
      <path d="M52 30 L38 12 L82 26 L90 30 Z" fill="#FF9EC8" />
      {/* Bow ribbon: right wing */}
      <path d="M128 30 L142 12 L98 26 L90 30 Z" fill="#FF9EC8" />
      {/* Bow ribbon: center knot */}
      <circle cx="90" cy="28" r="7" fill="#E060A0" />
      <circle cx="88" cy="26" r="2.5" fill="#FFFFFF" opacity="0.35" />
      {/* Heart eyes ♥ ♥ */}
      <text
        x="62"
        y="108"
        fontSize="38"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fill="#FAF7F1"
      >
        ♥
      </text>
      <text
        x="118"
        y="108"
        fontSize="38"
        textAnchor="middle"
        fontFamily="ui-monospace,monospace"
        fill="#FAF7F1"
      >
        ♥
      </text>
      {/* Big smile */}
      <path
        d="M68 122 Q90 140 112 122"
        stroke="#FAF7F1"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Microphone */}
      <circle cx="144" cy="76" r="9" fill="#E8E8E8" />
      <circle cx="144" cy="76" r="6" fill="#C8C8C8" />
      <rect x="141" y="84" width="6" height="20" rx="3" fill="#D0D0D0" />
      {/* Sparkle decorations */}
      <path
        d="M38 60 L39.5 56 L41 60 L45 61.5 L41 63 L39.5 67 L38 63 L34 61.5 Z"
        fill="#FAF7F1"
        opacity="0.6"
      />
      <path
        d="M140 56 L141.5 52 L143 56 L147 57.5 L143 59 L141.5 63 L140 59 L136 57.5 Z"
        fill="#FAF7F1"
        opacity="0.6"
      />
      <circle cx="50" cy="78" r="2" fill="#FAF7F1" opacity="0.45" />
      <circle cx="130" cy="72" r="2" fill="#FAF7F1" opacity="0.45" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// angel (SSR) — Cream body with golden halo, wings and gentle ^ ^ eyes
// ---------------------------------------------------------------------------
function TekkiAngel({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      aria-label="エンジェルTekki"
    >
      {/* Wings behind body */}
      <path
        d="M26 70 Q4 56 6 106 Q10 132 26 120 Z"
        fill="#F8F5E4"
        opacity="0.9"
      />
      <path d="M26 82 Q10 78 12 112 L26 106 Z" fill="#F0EDD8" opacity="0.5" />
      <path
        d="M154 70 Q176 56 174 106 Q170 132 154 120 Z"
        fill="#F8F5E4"
        opacity="0.9"
      />
      <path
        d="M154 82 Q170 78 168 112 L154 106 Z"
        fill="#F0EDD8"
        opacity="0.5"
      />
      {/* Body */}
      <rect x="26" y="32" width="128" height="110" rx="28" fill="#F0EDD8" />
      {/* Body highlight */}
      <rect
        x="38"
        y="44"
        width="104"
        height="18"
        rx="9"
        fill="#FFFFFF"
        opacity="0.38"
      />
      {/* Tail */}
      <path d="M66 142 L72 166 L92 142 Z" fill="#F0EDD8" />
      {/* Halo glow */}
      <circle
        cx="90"
        cy="22"
        r="20"
        fill="none"
        stroke="#FFE066"
        strokeWidth="9"
        opacity="0.22"
      />
      {/* Halo ring */}
      <circle
        cx="90"
        cy="22"
        r="20"
        fill="none"
        stroke="#C99412"
        strokeWidth="3.5"
      />
      {/* Gentle arc eyes ^ ^ */}
      <path
        d="M44 90 Q62 72 80 90"
        stroke="#8B7455"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M100 90 Q118 72 136 90"
        stroke="#8B7455"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Soft blush */}
      <circle cx="46" cy="102" r="7" fill="#F0C8A8" opacity="0.42" />
      <circle cx="134" cy="102" r="7" fill="#F0C8A8" opacity="0.42" />
      {/* Gentle smile */}
      <path
        d="M76 118 Q90 128 104 118"
        stroke="#8B7455"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Gold sparkles */}
      <path
        d="M44 52 L45 48 L46 52 L50 53 L46 54 L45 58 L44 54 L40 53 Z"
        fill="#C99412"
        opacity="0.5"
      />
      <path
        d="M130 58 L131 54 L132 58 L136 59 L132 60 L131 64 L130 60 L126 59 Z"
        fill="#C99412"
        opacity="0.5"
      />
      <circle cx="58" cy="44" r="2" fill="#C99412" opacity="0.4" />
      <circle cx="122" cy="46" r="2" fill="#C99412" opacity="0.4" />
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
      aria-label="コスモスTekki"
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
      <circle cx="90" cy="80" r="48" fill="#1A2A6C" opacity="0.3" />
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
