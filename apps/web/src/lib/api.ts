const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
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

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}

export function getLoginUrl(provider: "github" | "google"): string {
  return `${API_URL}/auth/${provider}`;
}
