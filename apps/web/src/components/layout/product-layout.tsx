import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/ui/wordmark";
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
          height: 68,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "0 28px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* Wordmark */}
          <Wordmark size={18} />

          {/* Nav tabs */}
          <nav
            style={{
              marginLeft: 20,
              display: "flex",
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

      {/* Main content */}
      <main
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "40px 28px",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
