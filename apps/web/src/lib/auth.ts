import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/auth-provider";
import { hasPlacementResult } from "@/lib/api";

export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
}

export function useRedirectIfAuth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function redirectAuthenticatedUser() {
      if (isLoading || !user) return;

      try {
        const hasResult = await hasPlacementResult();
        if (!cancelled) {
          navigate(hasResult ? "/dashboard" : "/placement", {
            replace: true,
          });
        }
      } catch {
        if (!cancelled) {
          navigate("/dashboard", { replace: true });
        }
      }
    }

    redirectAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, navigate]);

  return { user, isLoading };
}
