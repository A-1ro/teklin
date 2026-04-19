import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (authLoading || !user) return;

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
  }, [authLoading, user]);

  if (authLoading || hasPlacementResult === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
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
