"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * Silently redirects authenticated users to /dashboard.
 *
 * Unlike `useRedirectIfAuth`, this renders nothing visible while the auth
 * state is loading, so the server-rendered landing page content stays
 * immediately visible to first-time visitors and search engine crawlers.
 */
export function AuthRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  return null;
}
