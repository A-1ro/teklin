import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/ui/wordmark";
import { TekkiIdle } from "@/components/mascot/Tekki";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch } from "@/lib/api";
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

            {/* Avatar */}
            {user && (
              <span
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
                }}
              >
                {initials}
              </span>
            )}
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
