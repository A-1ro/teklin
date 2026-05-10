import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import { eq, and } from "drizzle-orm";
import { createDb, users } from "../db";
import { awardTek } from "../lib/tek";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenId,
  verifyToken,
} from "../lib/jwt";
import {
  getGitHubConfig,
  getGoogleConfig,
  exchangeCodeForToken,
  fetchGitHubUser,
  fetchGoogleUser,
} from "../lib/oauth";
import { sessionKey } from "../kv";
import type { SessionKvValue } from "../kv";
import type { Bindings } from "../types";
import { rateLimitMiddleware } from "../middleware/rate-limit";

const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60; // 7 days
const OAUTH_STATE_TTL_SEC = 600; // 10 minutes

function cookieOptions(env: string): CookieOptions {
  const isProduction = env === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
    ...(isProduction ? { domain: ".teklin.app" } : {}),
  };
}

export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.use("/*", rateLimitMiddleware);

// GET /auth/github — Start GitHub OAuth
authRoutes.get("/github", async (c) => {
  const state = crypto.randomUUID();
  await c.env.SESSION_KV.put(`oauth_state:${state}`, "1", {
    expirationTtl: OAUTH_STATE_TTL_SEC,
  });
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SEC,
  });

  const config = getGitHubConfig();
  const redirectUri = new URL(c.req.url).origin + "/auth/github/callback";
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: config.scopes.join(" "),
    state,
  });

  return c.redirect(`${config.authUrl}?${params.toString()}`);
});

// GET /auth/github/callback — Handle GitHub callback
authRoutes.get("/github/callback", async (c) => {
  const { code, state } = c.req.query();

  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  // Verify CSRF double-submit cookie
  const cookieState = getCookie(c, "oauth_state");
  if (!cookieState || cookieState !== state) {
    return c.json({ error: "State mismatch" }, 400);
  }
  deleteCookie(c, "oauth_state", { path: "/" });

  // Verify and consume state
  const storedState = await c.env.SESSION_KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return c.json({ error: "Invalid or expired state" }, 400);
  }
  await c.env.SESSION_KV.delete(`oauth_state:${state}`);

  try {
    const config = getGitHubConfig();
    const redirectUri = new URL(c.req.url).origin + "/auth/github/callback";
    const accessToken = await exchangeCodeForToken(
      config,
      code,
      c.env.GITHUB_CLIENT_ID,
      c.env.GITHUB_CLIENT_SECRET,
      redirectUri
    );
    const userInfo = await fetchGitHubUser(accessToken);

    const db = createDb(c.env.DB);
    let user = await db
      .select()
      .from(users)
      .where(
        and(eq(users.oauthProvider, "github"), eq(users.oauthId, userInfo.id))
      )
      .get();

    let isNewUser = false;
    const now = Date.now();
    if (!user) {
      isNewUser = true;
      const newId = crypto.randomUUID();
      await db.insert(users).values({
        id: newId,
        email: userInfo.email,
        name: userInfo.name,
        oauthProvider: "github",
        oauthId: userInfo.id,
        avatarUrl: userInfo.avatarUrl,
        level: "L1",
        domain: "web",
        createdAt: now,
        updatedAt: now,
      });
      user = await db.select().from(users).where(eq(users.id, newId)).get();
    }

    if (!user) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    if (isNewUser) {
      await awardTek(db, user.id, "registration_bonus");
    }

    const jti = generateTokenId();
    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateAccessToken(
        { sub: user.id, email: user.email, name: user.name },
        c.env.JWT_SECRET
      ),
      generateRefreshToken({ sub: user.id, jti }, c.env.JWT_SECRET),
    ]);

    const sessionValue: SessionKvValue = {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: now + REFRESH_TOKEN_TTL_SEC * 1000,
    };
    await c.env.SESSION_KV.put(sessionKey(jti), JSON.stringify(sessionValue), {
      expirationTtl: REFRESH_TOKEN_TTL_SEC,
    });

    const opts = cookieOptions(c.env.ENVIRONMENT);
    setCookie(c, "access_token", newAccessToken, {
      ...opts,
      maxAge: 15 * 60,
    });
    setCookie(c, "refresh_token", newRefreshToken, {
      ...opts,
      maxAge: REFRESH_TOKEN_TTL_SEC,
    });

    return c.redirect(`${c.env.APP_URL}/auth/callback`);
  } catch (err) {
    console.error("GitHub callback error:", err);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

// GET /auth/google — Start Google OAuth
authRoutes.get("/google", async (c) => {
  const state = crypto.randomUUID();
  await c.env.SESSION_KV.put(`oauth_state:${state}`, "1", {
    expirationTtl: OAUTH_STATE_TTL_SEC,
  });
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SEC,
  });

  const config = getGoogleConfig();
  const redirectUri = new URL(c.req.url).origin + "/auth/google/callback";
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: config.scopes.join(" "),
    state,
    response_type: "code",
    access_type: "offline",
  });

  return c.redirect(`${config.authUrl}?${params.toString()}`);
});

// GET /auth/google/callback — Handle Google callback
authRoutes.get("/google/callback", async (c) => {
  const { code, state } = c.req.query();

  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  // Verify CSRF double-submit cookie
  const cookieState = getCookie(c, "oauth_state");
  if (!cookieState || cookieState !== state) {
    return c.json({ error: "State mismatch" }, 400);
  }
  deleteCookie(c, "oauth_state", { path: "/" });

  // Verify and consume state
  const storedState = await c.env.SESSION_KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return c.json({ error: "Invalid or expired state" }, 400);
  }
  await c.env.SESSION_KV.delete(`oauth_state:${state}`);

  try {
    const config = getGoogleConfig();
    const redirectUri = new URL(c.req.url).origin + "/auth/google/callback";
    const accessToken = await exchangeCodeForToken(
      config,
      code,
      c.env.GOOGLE_CLIENT_ID,
      c.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const userInfo = await fetchGoogleUser(accessToken);

    const db = createDb(c.env.DB);
    let user = await db
      .select()
      .from(users)
      .where(
        and(eq(users.oauthProvider, "google"), eq(users.oauthId, userInfo.id))
      )
      .get();

    let isNewUser = false;
    const now = Date.now();
    if (!user) {
      isNewUser = true;
      const newId = crypto.randomUUID();
      await db.insert(users).values({
        id: newId,
        email: userInfo.email,
        name: userInfo.name,
        oauthProvider: "google",
        oauthId: userInfo.id,
        avatarUrl: userInfo.avatarUrl,
        level: "L1",
        domain: "web",
        createdAt: now,
        updatedAt: now,
      });
      user = await db.select().from(users).where(eq(users.id, newId)).get();
    }

    if (!user) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    if (isNewUser) {
      await awardTek(db, user.id, "registration_bonus");
    }

    const jti = generateTokenId();
    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateAccessToken(
        { sub: user.id, email: user.email, name: user.name },
        c.env.JWT_SECRET
      ),
      generateRefreshToken({ sub: user.id, jti }, c.env.JWT_SECRET),
    ]);

    const sessionValue: SessionKvValue = {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: now + REFRESH_TOKEN_TTL_SEC * 1000,
    };
    await c.env.SESSION_KV.put(sessionKey(jti), JSON.stringify(sessionValue), {
      expirationTtl: REFRESH_TOKEN_TTL_SEC,
    });

    const opts = cookieOptions(c.env.ENVIRONMENT);
    setCookie(c, "access_token", newAccessToken, {
      ...opts,
      maxAge: 15 * 60,
    });
    setCookie(c, "refresh_token", newRefreshToken, {
      ...opts,
      maxAge: REFRESH_TOKEN_TTL_SEC,
    });

    return c.redirect(`${c.env.APP_URL}/auth/callback`);
  } catch (err) {
    console.error("Google callback error:", err);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

// POST /auth/refresh — Refresh tokens
authRoutes.post("/refresh", async (c) => {
  const refreshToken = getCookie(c, "refresh_token");
  if (!refreshToken) {
    return c.json({ error: "No refresh token" }, 401);
  }

  let payload;
  try {
    payload = await verifyToken(refreshToken, c.env.JWT_SECRET);
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const { sub: userId, jti } = payload;
  if (!jti) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  const sessionRaw = await c.env.SESSION_KV.get(sessionKey(jti));
  if (!sessionRaw) {
    return c.json({ error: "Session not found or expired" }, 401);
  }

  const session = JSON.parse(sessionRaw) as SessionKvValue;

  if (session.userId !== userId) {
    return c.json({ error: "Session mismatch" }, 401);
  }

  // Delete old session
  await c.env.SESSION_KV.delete(sessionKey(jti));

  const now = Date.now();
  const newJti = generateTokenId();
  const [newAccessToken, newRefreshToken] = await Promise.all([
    generateAccessToken(
      { sub: userId, email: session.email, name: session.name },
      c.env.JWT_SECRET
    ),
    generateRefreshToken({ sub: userId, jti: newJti }, c.env.JWT_SECRET),
  ]);

  const newSession: SessionKvValue = {
    userId,
    email: session.email,
    name: session.name,
    expiresAt: now + REFRESH_TOKEN_TTL_SEC * 1000,
  };
  await c.env.SESSION_KV.put(sessionKey(newJti), JSON.stringify(newSession), {
    expirationTtl: REFRESH_TOKEN_TTL_SEC,
  });

  const opts = cookieOptions(c.env.ENVIRONMENT);
  setCookie(c, "access_token", newAccessToken, {
    ...opts,
    maxAge: 15 * 60,
  });
  setCookie(c, "refresh_token", newRefreshToken, {
    ...opts,
    maxAge: REFRESH_TOKEN_TTL_SEC,
  });

  return c.json({ ok: true });
});

// POST /auth/logout — Logout
authRoutes.post("/logout", async (c) => {
  const refreshToken = getCookie(c, "refresh_token");

  if (refreshToken) {
    try {
      const payload = await verifyToken(refreshToken, c.env.JWT_SECRET);
      if (payload.jti) {
        await c.env.SESSION_KV.delete(sessionKey(payload.jti));
      }
    } catch {
      // Token invalid — continue to clear cookies anyway
    }
  }

  const opts = cookieOptions(c.env.ENVIRONMENT);
  deleteCookie(c, "access_token", opts);
  deleteCookie(c, "refresh_token", opts);

  return c.json({ ok: true });
});
