import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/ui/wordmark";
import { TekkiIdle } from "@/components/mascot/Tekki";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch } from "@/lib/api";
import {
  isPushSupported,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  getIOSPushState,
  type IOSPushState,
} from "@/lib/notifications";
import type { TodayLessonResponse } from "@teklin/shared";

const NAV_TABS = [
  { num: "01", label: "ホーム", path: "/dashboard" },
  { num: "02", label: "レッスン", path: "/lesson" },
  { num: "03", label: "カード", path: "/cards" },
  { num: "04", label: "Rewrite", path: "/rewrite" },
] as const;

export function ProductLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<TodayLessonResponse>("/api/lessons/today")
      .then((res) => setStreak(res.streak.currentStreak))
      .catch(() => {});
  }, []);

  const initials = user
    ? user.name
        .split(" ")
        .map((p) => p[0] ?? "")
        .join("")
        .toLowerCase()
        .slice(0, 2)
    : "";

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--color-paper)",
        color: "var(--color-ink)",
      }}
    >
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,247,241,0.9)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-rule)",
          height: 56,
          display: "flex",
          alignItems: "center",
        }}
        className="md:!h-[68px]"
      >
        <div
          className="px-4 md:px-7"
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* Wordmark + Tekki */}
          <Wordmark size={18} />
          <span style={{ marginLeft: -4, display: "inline-flex" }}>
            <TekkiIdle size={32} />
          </span>

          {/* Nav tabs — hidden on mobile */}
          <nav
            className="hidden md:flex"
            style={{
              marginLeft: 20,
              alignItems: "stretch",
              gap: 4,
              height: "100%",
            }}
          >
            {NAV_TABS.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => navigate(tab.path)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 14px",
                    paddingBottom: isActive ? 6 : 0,
                    background: "none",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid var(--color-teal)"
                      : "2px solid transparent",
                    borderRadius: 0,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? "var(--color-ink)"
                      : "var(--color-ink-2)",
                    transition: "color 120ms",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-3)",
                    }}
                  >
                    {tab.num}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Streak chip */}
            {streak !== null && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "var(--color-mustard-50)",
                  border: "1px solid #e6d49a",
                }}
              >
                <span style={{ fontSize: 12, color: "#7d5e0a" }}>◉</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#7d5e0a",
                  }}
                >
                  {streak}
                </span>
                <span
                  className="hidden sm:inline"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#7d5e0a",
                  }}
                >
                  days
                </span>
              </span>
            )}

            {/* Avatar + menu */}
            {user && <AvatarMenu initials={initials} />}
          </div>
        </div>
      </header>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <main
        className="px-4 py-6 pb-24 md:px-7 md:py-10 md:pb-10"
        style={{
          maxWidth: 1160,
          margin: "0 auto",
        }}
      >
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
        style={{
          background: "rgba(250,247,241,0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderTop: "1px solid var(--color-rule)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV_TABS.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "10px 0 12px",
                background: "none",
                border: "none",
                borderTop: isActive
                  ? "2px solid var(--color-teal)"
                  : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                color: isActive
                  ? "var(--color-ink)"
                  : "var(--color-ink-3)",
                transition: "color 120ms",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: isActive
                    ? "var(--color-teal)"
                    : "var(--color-ink-3)",
                }}
              >
                {tab.num}
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function AvatarMenu({ initials }: { initials: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pushSupported] = useState(() => isPushSupported());
  const [iosPushState] = useState<IOSPushState>(() => getIOSPushState());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToggling, setPushToggling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pushSupported) {
      isPushSubscribed().then(setPushEnabled).catch(() => {});
    }
  }, [pushSupported]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleTogglePush = useCallback(async () => {
    if (pushToggling) return;
    setPushToggling(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        const ok = await subscribeToPush();
        setPushEnabled(ok);
      }
    } catch {
      // Permission denied or subscription failed
    } finally {
      setPushToggling(false);
    }
  }, [pushEnabled, pushToggling]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="ユーザーメニュー"
        aria-expanded={open}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--color-teal-50)",
          color: "var(--color-teal-dark)",
          fontWeight: 600,
          fontSize: 12,
          border: "1px solid #bfdedd",
          fontFamily: "var(--font-mono)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 220,
            background: "#fff",
            border: "1px solid var(--color-rule)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 200,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {user && (
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px dashed var(--color-rule)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  marginBottom: 2,
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-3)",
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
          )}
          {/* Notification toggle — push supported (Android / desktop / iOS PWA) */}
          {pushSupported && (
            <div
              style={{
                padding: "8px 16px",
                borderBottom: "1px dashed var(--color-rule)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-ink-2)",
                }}
              >
                通知
              </span>
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushToggling}
                aria-label={pushEnabled ? "通知をオフにする" : "通知をオンにする"}
                style={{
                  position: "relative",
                  width: 40,
                  height: 22,
                  borderRadius: 999,
                  border: "none",
                  cursor: pushToggling ? "default" : "pointer",
                  background: pushEnabled
                    ? "var(--color-teal)"
                    : "var(--color-rule)",
                  transition: "background 200ms",
                  opacity: pushToggling ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: pushEnabled ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 200ms",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
              </button>
            </div>
          )}
          {/* iOS: not installed as PWA — show "Add to Home Screen" guide */}
          {!pushSupported && iosPushState === "needs-install" && (
            <div
              style={{
                borderBottom: "1px dashed var(--color-rule)",
              }}
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-ink-2)",
                  }}
                >
                  通知
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-ink-3)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {showIOSGuide ? "▲" : "設定方法 ▼"}
                </span>
              </button>
              {showIOSGuide && (
                <div
                  style={{
                    padding: "0 16px 12px",
                    fontSize: 12,
                    lineHeight: 1.65,
                    color: "var(--color-ink-2)",
                  }}
                >
                  <p style={{ margin: "0 0 8px", fontWeight: 500, color: "var(--color-ink)" }}>
                    ホーム画面に追加してね
                  </p>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <li>
                      画面下の{" "}
                      <span style={{ fontWeight: 600 }}>
                        共有ボタン
                      </span>
                      {" "}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline" }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                      {" "}をタップ
                    </li>
                    <li>
                      <span style={{ fontWeight: 600 }}>
                        「ホーム画面に追加」
                      </span>
                      を選択
                    </li>
                    <li>追加後、アプリから通知をオンにできます</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          <div style={{ padding: "6px 8px" }}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 10px",
                background: "none",
                border: "none",
                borderRadius: 8,
                cursor: loggingOut ? "default" : "pointer",
                fontSize: 13,
                color: "var(--color-coral)",
                fontFamily: "inherit",
                fontWeight: 500,
                opacity: loggingOut ? 0.5 : 1,
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget.style.background) = "var(--color-coral-50, #fef2f2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.background) = "none";
              }}
            >
              {loggingOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
