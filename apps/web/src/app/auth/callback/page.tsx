"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const user = await fetchCurrentUser();
        if (cancelled) return;
        if (user) {
          await refreshUser();
          router.replace("/dashboard");
        } else {
          router.replace("/login?error=auth_failed");
        }
      } catch {
        if (!cancelled) {
          router.replace("/login?error=auth_failed");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [router, refreshUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500" />
        <p className="text-sm text-gray-400">ログイン中...</p>
      </div>
    </main>
  );
}
