import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/auth-provider";

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
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
}
