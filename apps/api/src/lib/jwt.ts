import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";

export interface JwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  name?: string;
  jti?: string;
  exp: number;
  iat: number;
}

const ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

export async function generateAccessToken(
  payload: { sub: string; email: string; name: string },
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SEC,
    },
    secret,
    "HS256"
  );
}

export async function generateRefreshToken(
  payload: { sub: string; jti: string },
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: payload.sub,
      jti: payload.jti,
      iat: now,
      exp: now + REFRESH_TOKEN_TTL_SEC,
    },
    secret,
    "HS256"
  );
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JwtPayload> {
  const payload = await verify(token, secret, "HS256");
  return payload as unknown as JwtPayload;
}

export function generateTokenId(): string {
  return crypto.randomUUID();
}
