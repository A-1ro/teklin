export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface OAuthProviderConfig {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export function getGitHubConfig(): OAuthProviderConfig {
  return {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scopes: ["read:user", "user:email"],
  };
}

export function getGoogleConfig(): OAuthProviderConfig {
  return {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scopes: ["openid", "email", "profile"],
  };
}

export async function exchangeCodeForToken(
  config: OAuthProviderConfig,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(
      `No access_token in response: ${data.error ?? "unknown error"}`
    );
  }
  return data.access_token;
}

export async function fetchGitHubUser(
  accessToken: string
): Promise<OAuthUserInfo> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "Teklin/1.0",
  };

  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/emails", { headers }),
  ]);

  if (!userRes.ok) {
    throw new Error(`GitHub user fetch failed: ${userRes.status}`);
  }

  const user = (await userRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };

  let email = user.email;
  if (!email && emailsRes.ok) {
    const emails = (await emailsRes.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = emails.find((e) => e.primary && e.verified);
    email = primary?.email ?? emails[0]?.email ?? null;
  }

  if (!email) {
    throw new Error("Could not retrieve email from GitHub");
  }

  return {
    id: String(user.id),
    email,
    name: user.name ?? user.login,
    avatarUrl: user.avatar_url ?? null,
  };
}

export async function fetchGoogleUser(
  accessToken: string
): Promise<OAuthUserInfo> {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Google user fetch failed: ${res.status}`);
  }

  const user = (await res.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string | null;
  };

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.picture ?? null,
  };
}
