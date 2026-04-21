import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, hasPlacementResult } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const user = await fetchCurrentUser();
        if (cancelled) return;
        if (user) {
          await refreshUser();
          const hasResult = await hasPlacementResult();
          if (cancelled) return;
          navigate(hasResult ? "/dashboard" : "/placement", {
            replace: true,
          });
        } else {
          navigate("/login?error=auth_failed", { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate("/login?error=auth_failed", { replace: true });
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-teal" />
        <p className="text-sm text-ink-2">ログイン中...</p>
      </div>
    </main>
  );
}
