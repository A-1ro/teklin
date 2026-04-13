import { createMiddleware } from "hono/factory";

type RateLimitEnv = {
  Bindings: {
    SESSION_KV: KVNamespace;
  };
};

const RATE_LIMIT_WINDOW_SEC = 300; // 5 minutes
const RATE_LIMIT_MAX = 10; // 10 attempts per window

export const rateLimitMiddleware = createMiddleware<RateLimitEnv>(
  async (c, next) => {
    const ip =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const key = `rate:auth:${ip}`;

    const current = await c.env.SESSION_KV.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= RATE_LIMIT_MAX) {
      return c.json(
        { error: "Too many requests. Please try again later." },
        429
      );
    }

    await c.env.SESSION_KV.put(key, String(count + 1), {
      expirationTtl: RATE_LIMIT_WINDOW_SEC,
    });

    await next();
  }
);
