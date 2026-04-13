import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyToken } from "../lib/jwt";

export type AuthVariables = {
  user: {
    userId: string;
    email: string;
    name: string;
  };
};

type AuthEnv = {
  Bindings: {
    JWT_SECRET: string;
  };
  Variables: AuthVariables;
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  let token: string | undefined;

  // 1. Try cookie first
  token = getCookie(c, "access_token");

  // 2. Fall back to Authorization header
  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set("user", {
      userId: payload.sub,
      email: payload.email ?? "",
      name: payload.name ?? "",
    });
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
