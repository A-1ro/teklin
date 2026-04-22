import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import { createDb, pushSubscriptions } from "../db";
import type { Bindings } from "../types";

type Env = {
  Bindings: Bindings;
  Variables: AuthVariables;
};

export const notificationRoutes = new Hono<Env>();

notificationRoutes.use("*", authMiddleware);

/** GET /vapid-public-key — return the VAPID public key for PushManager.subscribe */
notificationRoutes.get("/vapid-public-key", (c) => {
  return c.json({ publicKey: c.env.VAPID_PUBLIC_KEY });
});

/** GET /status — check whether the current user has any push subscription */
notificationRoutes.get("/status", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  const sub = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .get();

  return c.json({ subscribed: !!sub });
});

/** POST /subscribe — save a push subscription */
notificationRoutes.post("/subscribe", async (c) => {
  const { userId } = c.get("user");
  const body = await c.req.json<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }>();

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return c.json({ error: "Invalid subscription" }, 400);
  }

  const db = createDb(c.env.DB);

  // Remove any existing subscription for this endpoint (upsert)
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, body.endpoint));

  await db.insert(pushSubscriptions).values({
    id: crypto.randomUUID(),
    userId,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    createdAt: Date.now(),
  });

  return c.json({ ok: true });
});

/** DELETE /subscribe — remove all push subscriptions for the current user */
notificationRoutes.delete("/subscribe", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return c.json({ ok: true });
});
