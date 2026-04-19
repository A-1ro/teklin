export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

let refreshPromise: Promise<boolean> | null = null;

function shouldTryRefresh(path: string, options?: RequestInit): boolean {
  const method = options?.method?.toUpperCase() ?? "GET";

  if (path === "/auth/refresh") return false;
  if (path === "/auth/logout") return false;

  return method !== "OPTIONS";
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        return res.ok;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  hasRetried = false,
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const message = await res.text();

    if (res.status === 401 && shouldTryRefresh(path, options) && !hasRetried) {
      const refreshed = await refreshSession();

      if (refreshed) {
        return apiFetch<T>(path, options, true);
      }
    }

    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  oauthProvider: "github" | "google";
  level: "L1" | "L2" | "L3" | "L4";
  domain: "web" | "infra" | "ml" | "mobile";
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>("/api/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function hasPlacementResult(): Promise<boolean> {
  try {
    await apiFetch("/api/placement/result");
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return false;
    }
    throw err;
  }
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}

export function getLoginUrl(provider: "github" | "google"): string {
  return `/auth/${provider}`;
}
