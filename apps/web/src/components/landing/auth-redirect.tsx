"use client";

import { useRedirectIfAuth } from "@/lib/auth";

/**
 * Silently redirects authenticated users to /dashboard.
 *
 * A thin wrapper around `useRedirectIfAuth` that renders nothing,
 * so the server-rendered landing page content stays immediately
 * visible to first-time visitors and search engine crawlers.
 *
 * Use the `useRedirectIfAuth` hook directly when you need access
 * to `isLoading` / `user` state (e.g. to show a loading spinner).
 */
export function AuthRedirect() {
  useRedirectIfAuth();
  return null;
}
