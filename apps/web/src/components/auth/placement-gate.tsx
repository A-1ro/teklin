import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasPlacementResult as fetchHasPlacementResult } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

const PLACEMENT_ALLOWED_PATHS = new Set([
  "/placement",
  "/placement/test",
  "/placement/result",
]);

export function PlacementGate() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const location = useLocation();
  const [hasPlacementResult, setHasPlacementResult] = useState<boolean | null>(
    null
  );
  const prevPathnameRef = useRef<string>(location.pathname);

  useEffect(() => {
    if (authLoading || !user) return;

    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;

    // プレースメント完了後に別ページへ遷移する場合のみ再取得する
    const isTransitioningFromPlacement =
      PLACEMENT_ALLOWED_PATHS.has(prevPathname) &&
      !PLACEMENT_ALLOWED_PATHS.has(location.pathname);

    if (hasPlacementResult !== null && !isTransitioningFromPlacement) return;

    setHasPlacementResult(null);
    let cancelled = false;

    fetchHasPlacementResult()
      .then((hasResult) => {
        if (!cancelled) {
          setHasPlacementResult(hasResult);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setHasPlacementResult(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, location.pathname]);

  if (authLoading || hasPlacementResult === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-teal"
          role="status"
          aria-label="Loading placement status"
        />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const isPlacementPath = PLACEMENT_ALLOWED_PATHS.has(location.pathname);

  if (!hasPlacementResult && !isPlacementPath) {
    return <Navigate to="/placement" replace />;
  }

  return <Outlet />;
}
