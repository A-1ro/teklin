import { useCallback, useEffect, useRef, useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { TekIcon } from "@/components/icons/tek-icon";
import { GachaTekkiSvg } from "@/components/mascot/GachaTekkis";
import { TEKKI_CATALOG_ITEMS, TEKKI_CATALOG_LENGTH } from "@/lib/gacha-catalog";
import type {
  TekBalanceResponse,
  GachaPullResponse,
  GachaCollectionResponse,
  GachaResultItem,
  GachaCollectionItem,
  GachaRarity,
  TekkiId,
} from "@teklin/shared";

const RARITY_COLORS: Record<
  GachaRarity,
  { bg: string; text: string; label: string }
> = {
  N: { bg: "#F3F2EE", text: "#6B6960", label: "N" },
  R: { bg: "#D8EDEC", text: "#0E7C7B", label: "R" },
  SR: { bg: "#EDE8F5", text: "#6B4E8C", label: "SR" },
  SSR: { bg: "#FBF3D5", text: "#8B6B00", label: "SSR" },
};

export function GachaPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [results, setResults] = useState<GachaResultItem[] | null>(null);
  const [collection, setCollection] = useState<GachaCollectionItem[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTekki, setSelectedTekki] = useState<TekkiId | null>(null);
  const [showGatherAnim, setShowGatherAnim] = useState(false);
  const pendingResultsRef = useRef<GachaPullResponse | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    apiFetch<TekBalanceResponse>("/api/tek")
      .then((r) => setBalance(r.balance))
      .catch(() => {});
    apiFetch<GachaCollectionResponse>("/api/gacha/collection")
      .then((r) => setCollection(r.items))
      .catch(() => {})
      .finally(() => setCollectionLoading(false));
  }, [authLoading, user]);

  const handlePull = useCallback(
    async (count: 1 | 10) => {
      if (isPulling) return;
      setError(null);
      setIsPulling(true);
      setShowGatherAnim(true);
      pendingResultsRef.current = null;

      try {
        // Run API call and minimum animation duration in parallel
        const [res] = await Promise.all([
          apiFetch<GachaPullResponse>("/api/gacha/pull", {
            method: "POST",
            body: JSON.stringify({ count }),
          }),
          new Promise((r) => setTimeout(r, 1400)),
        ]);
        pendingResultsRef.current = res;
        // Transition: gather animation ends → flash → results
        setShowGatherAnim(false);
        // Small gap so the flash frame renders before results overlay
        await new Promise((r) => setTimeout(r, 350));
        setResults(res.results);
        setBalance(res.newBalance);
        window.dispatchEvent(
          new CustomEvent("tek-balance-updated", {
            detail: { balance: res.newBalance },
          })
        );
        apiFetch<GachaCollectionResponse>("/api/gacha/collection")
          .then((r) => setCollection(r.items))
          .catch(() => {});
      } catch (err: unknown) {
        setShowGatherAnim(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("tekが不足")) {
          setError(
            "tekが不足しています。レッスンやカード復習でtekを貯めましょう！"
          );
        } else {
          setError("ガチャの実行に失敗しました。");
        }
      } finally {
        setIsPulling(false);
      }
    },
    [isPulling]
  );

  const handleCloseResults = useCallback(() => setResults(null), []);

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid var(--color-rule)",
            borderTopColor: "var(--color-teal)",
            animation: "spin 0.8s linear infinite",
          }}
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-ink-3)",
            marginBottom: 8,
          }}
        >
          TEKKI GACHA
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--color-ink)",
            marginBottom: 16,
          }}
        >
          Tekkiガチャ
        </h1>
        {/* Tek balance display */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 999,
            background: "var(--color-teal-50)",
            border: "1px solid #bfdedd",
          }}
        >
          <TekIcon size={16} style={{ color: "var(--color-teal)" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-teal-dark)",
            }}
          >
            {balance ?? "—"}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--color-teal)",
            }}
          >
            tek
          </span>
        </div>
      </div>

      {/* Pull buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Single pull */}
        <button
          type="button"
          onClick={() => handlePull(1)}
          disabled={isPulling || (balance !== null && balance < 100)}
          style={{
            padding: "20px 16px",
            borderRadius: 16,
            border: "1.5px solid var(--color-rule)",
            background: "var(--color-paper-2, #F3F2EE)",
            cursor:
              isPulling || (balance !== null && balance < 100)
                ? "not-allowed"
                : "pointer",
            opacity: isPulling || (balance !== null && balance < 100) ? 0.5 : 1,
            transition: "all 120ms",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-ink-2)",
              marginBottom: 6,
            }}
          >
            1回引く
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <TekIcon size={14} style={{ color: "var(--color-teal)" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-teal-dark)",
              }}
            >
              100
            </span>
          </div>
        </button>

        {/* 10-pull */}
        <button
          type="button"
          onClick={() => handlePull(10)}
          disabled={isPulling || (balance !== null && balance < 1000)}
          style={{
            padding: "20px 16px",
            borderRadius: 16,
            border: "1.5px solid #bfdedd",
            background: "var(--color-teal-50)",
            cursor:
              isPulling || (balance !== null && balance < 1000)
                ? "not-allowed"
                : "pointer",
            opacity:
              isPulling || (balance !== null && balance < 1000) ? 0.5 : 1,
            transition: "all 120ms",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              fontSize: 10,
              fontWeight: 700,
              background: "var(--color-teal)",
              borderRadius: 4,
              padding: "2px 6px",
              color: "white",
            }}
          >
            +おまけ
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-teal-dark)",
              marginBottom: 6,
            }}
          >
            10連
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <TekIcon size={14} style={{ color: "var(--color-teal)" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-teal-dark)",
              }}
            >
              1000
            </span>
          </div>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            marginBottom: 16,
            fontSize: 13,
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}

      {/* Probability table */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "var(--color-paper-2, #F3F2EE)",
          border: "1px solid var(--color-rule)",
          marginBottom: 32,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-3)",
            marginBottom: 10,
          }}
        >
          排出率
        </p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {(["N", "R", "SR", "SSR"] as GachaRarity[]).map((rarity) => {
            const colors = RARITY_COLORS[rarity];
            const prob =
              rarity === "N"
                ? 60
                : rarity === "R"
                  ? 30
                  : rarity === "SR"
                    ? 8
                    : 2;
            return (
              <div
                key={rarity}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {rarity}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-ink-2)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {prob}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collection section */}
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-ink-3)",
            marginBottom: 16,
          }}
        >
          コレクション ({collection.length} / {TEKKI_CATALOG_LENGTH})
        </p>
        {collectionLoading ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--color-ink-3)",
              fontSize: 13,
            }}
          >
            読み込み中...
          </div>
        ) : (
          <CollectionGrid
            collection={collection}
            onSelect={setSelectedTekki}
          />
        )}
      </div>

      {/* Tek gather animation */}
      {showGatherAnim && <TekGatherAnimation />}

      {/* Tekki profile overlay */}
      {selectedTekki && (
        <TekkiProfileOverlay
          tekkiId={selectedTekki}
          collection={collection}
          onClose={() => setSelectedTekki(null)}
        />
      )}

      {/* Result overlay */}
      {results && (
        <ResultOverlay
          results={results}
          onClose={handleCloseResults}
          onPullAgain1={() => {
            handleCloseResults();
            handlePull(1);
          }}
          onPullAgain10={() => {
            handleCloseResults();
            handlePull(10);
          }}
          balance={balance ?? 0}
          isPulling={isPulling}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TekGatherAnimation — tek icons fly from all directions to center then flash
// ---------------------------------------------------------------------------
const PARTICLE_COUNT = 28;

function TekGatherAnimation() {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      // Distribute start positions around the screen edges and beyond
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 300 + Math.random() * 200;
      const startX = Math.cos(angle) * dist;
      const startY = Math.sin(angle) * dist;
      const size = 14 + Math.random() * 14;
      const delay = Math.random() * 0.35;
      const duration = 0.7 + Math.random() * 0.4;
      const rotation = Math.random() * 360;
      return { startX, startY, size, delay, duration, rotation };
    })
  );

  const [phase, setPhase] = useState<"gather" | "flash">("gather");

  useEffect(() => {
    const t = setTimeout(() => setPhase("flash"), 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 280,
        background:
          phase === "flash"
            ? "rgba(255,255,255,0.95)"
            : "rgba(10, 10, 15, 0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "background 0.3s ease",
      }}
    >
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            color: "var(--color-teal)",
            opacity: phase === "flash" ? 0 : 1,
            transform:
              phase === "gather"
                ? `translate(${p.startX}px, ${p.startY}px) rotate(${p.rotation}deg)`
                : "translate(0, 0) rotate(0deg) scale(0.5)",
            transition: `transform ${p.duration}s cubic-bezier(0.23, 1, 0.32, 1) ${p.delay}s, opacity 0.25s ease ${phase === "flash" ? "0s" : "0.3s"}`,
            pointerEvents: "none",
          }}
        >
          <TekIcon size={p.size} />
        </div>
      ))}

      {/* Center glow that intensifies as particles arrive */}
      <div
        style={{
          position: "absolute",
          width: phase === "flash" ? 600 : 40,
          height: phase === "flash" ? 600 : 40,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(14,124,123,0.5) 0%, transparent 70%)",
          opacity: phase === "flash" ? 0 : 1,
          transition:
            "width 0.3s ease, height 0.3s ease, opacity 0.25s ease 0.1s",
          pointerEvents: "none",
        }}
      />

      {/* Flash burst */}
      {phase === "flash" && (
        <div
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--color-teal)",
            animation: "tekBurst 0.35s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}

      <style>{`
        @keyframes tekBurst {
          0%   { transform: scale(1); opacity: 0.9; }
          50%  { transform: scale(30); opacity: 0.4; }
          100% { transform: scale(50); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CollectionGrid
// ---------------------------------------------------------------------------
function CollectionGrid({
  collection,
  onSelect,
}: {
  collection: GachaCollectionItem[];
  onSelect: (id: TekkiId) => void;
}) {
  const ownedMap = new Map(collection.map((c) => [c.tekkiId, c]));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 12,
      }}
    >
      {TEKKI_CATALOG_ITEMS.map((item) => {
        const owned = ownedMap.get(item.id);
        const colors = RARITY_COLORS[item.rarity];
        return (
          <div
            key={item.id}
            role={owned ? "button" : undefined}
            tabIndex={owned ? 0 : undefined}
            onClick={owned ? () => onSelect(item.id) : undefined}
            onKeyDown={
              owned
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(item.id);
                    }
                  }
                : undefined
            }
            style={{
              borderRadius: 14,
              border: `1.5px solid ${owned ? colors.bg : "var(--color-rule)"}`,
              background: owned ? colors.bg : "var(--color-paper-2, #F3F2EE)",
              padding: "12px 8px 10px",
              textAlign: "center",
              opacity: owned ? 1 : 0.45,
              position: "relative",
              cursor: owned ? "pointer" : "default",
              transition: "transform 120ms, box-shadow 120ms",
            }}
            onMouseEnter={
              owned
                ? (e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.08)";
                  }
                : undefined
            }
            onMouseLeave={
              owned
                ? (e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                  }
                : undefined
            }
          >
            {owned && owned.count > 1 && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--color-ink-3)",
                }}
              >
                &times;{owned.count}
              </span>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 6,
                minHeight: 72,
              }}
            >
              {owned ? (
                <GachaTekkiSvg tekkiId={item.id} size={72} />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    background: "var(--color-rule)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 24,
                      color: "var(--color-ink-3)",
                    }}
                  >
                    ?
                  </span>
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: owned ? colors.text : "var(--color-ink-3)",
                marginBottom: 4,
              }}
            >
              {owned ? item.nameJa : "???"}
            </div>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: 4,
                background: owned ? colors.text : "var(--color-rule)",
                color: owned ? "#fff" : "var(--color-ink-3)",
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {item.rarity}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TekkiProfileOverlay
// ---------------------------------------------------------------------------
interface TekkiProfileOverlayProps {
  tekkiId: TekkiId;
  collection: GachaCollectionItem[];
  onClose: () => void;
}

function TekkiProfileOverlay({
  tekkiId,
  collection,
  onClose,
}: TekkiProfileOverlayProps) {
  const catalog = TEKKI_CATALOG_ITEMS.find((c) => c.id === tekkiId);
  const owned = collection.find((c) => c.tekkiId === tekkiId);
  if (!catalog || !owned) return null;

  const colors = RARITY_COLORS[catalog.rarity];
  const firstPulled = new Date(owned.firstPulledAt);
  const dateStr = `${firstPulled.getFullYear()}/${String(firstPulled.getMonth() + 1).padStart(2, "0")}/${String(firstPulled.getDate()).padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          borderRadius: 20,
          background: "#fff",
          overflow: "hidden",
          animation: "profileFadeIn 0.25s ease",
        }}
      >
        {/* Card top: colored background with Tekki */}
        <div
          style={{
            background: colors.bg,
            padding: "28px 24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Rarity badge */}
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 14,
              padding: "3px 10px",
              borderRadius: 6,
              background: colors.text,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {catalog.rarity}
          </span>

          {/* Count badge */}
          {owned.count > 1 && (
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 14,
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(0,0,0,0.12)",
                color: colors.text,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}
            >
              &times;{owned.count}
            </span>
          )}

          <GachaTekkiSvg tekkiId={tekkiId} size={120} />

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: colors.text,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            {catalog.nameJa}
          </h2>
        </div>

        {/* Card body: profile info */}
        <div style={{ padding: "20px 24px 24px" }}>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--color-ink-2, #4A473F)",
              marginBottom: 16,
            }}
          >
            {catalog.description}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--color-ink-3, #8A8780)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="1"
                y="3"
                width="14"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M1 7h14"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5 1v4M11 1v4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>初回獲得: {dateStr}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: "1.5px solid var(--color-rule, #E0DED8)",
              background: "transparent",
              color: "var(--color-ink-2, #4A473F)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            閉じる
          </button>
        </div>
      </div>

      <style>{`
        @keyframes profileFadeIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResultOverlay
// ---------------------------------------------------------------------------
interface ResultOverlayProps {
  results: GachaResultItem[];
  onClose: () => void;
  onPullAgain1: () => void;
  onPullAgain10: () => void;
  balance: number;
  isPulling: boolean;
}

function ResultOverlay({
  results,
  onClose,
  onPullAgain1,
  onPullAgain10,
  balance,
  isPulling,
}: ResultOverlayProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= results.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [results.length]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(10, 10, 15, 0.88)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        ガチャ結果
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          maxWidth: 560,
          marginBottom: 28,
        }}
      >
        {results.map((result, i) => {
          const colors = RARITY_COLORS[result.rarity];
          const visible = i < visibleCount;
          return (
            <div
              key={i}
              style={{
                width: 100,
                borderRadius: 14,
                border: result.isBonus
                  ? "2px solid #C99412"
                  : `1.5px solid ${colors.bg}`,
                background: result.isBonus
                  ? "rgba(201,148,18,0.15)"
                  : "rgba(255,255,255,0.95)",
                padding: "10px 6px 8px",
                textAlign: "center",
                position: "relative",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.85)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
              {result.isNew && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--color-coral)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  NEW!
                </span>
              )}
              {result.isBonus && (
                <span
                  style={{
                    position: "absolute",
                    top: -8,
                    right: 6,
                    background: "#C99412",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 999,
                    pointerEvents: "none",
                  }}
                >
                  おまけ
                </span>
              )}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <GachaTekkiSvg tekkiId={result.tekkiId} size={72} />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: colors.text,
                  marginTop: 4,
                  marginBottom: 3,
                }}
              >
                {result.nameJa}
              </div>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {result.rarity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          閉じる
        </button>
        <button
          type="button"
          onClick={onPullAgain1}
          disabled={isPulling || balance < 100}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: isPulling || balance < 100 ? "not-allowed" : "pointer",
            opacity: isPulling || balance < 100 ? 0.4 : 1,
            fontFamily: "inherit",
          }}
        >
          もう1回 (100)
        </button>
        <button
          type="button"
          onClick={onPullAgain10}
          disabled={isPulling || balance < 1000}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: "var(--color-teal)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: isPulling || balance < 1000 ? "not-allowed" : "pointer",
            opacity: isPulling || balance < 1000 ? 0.4 : 1,
            fontFamily: "inherit",
          }}
        >
          10連 (1000)
        </button>
      </div>
    </div>
  );
}
