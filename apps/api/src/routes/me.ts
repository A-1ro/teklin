import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, users } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";
import type { Bindings } from "../types";

const VALID_DOMAINS = ["web", "infra", "ml", "mobile"] as const;

export const meRoutes = new Hono<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>();

meRoutes.use("/me", authMiddleware);

meRoutes.get("/me", async (c) => {
  const { userId } = c.get("user");
  const db = createDb(c.env.DB);

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    oauthProvider: user.oauthProvider,
    level: user.level,
    domain: user.domain,
  });
});

meRoutes.patch("/me", async (c) => {
  const { userId } = c.get("user");

  let body: { domain?: string };
  try {
    body = await c.req.json<{ domain?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.domain || !(VALID_DOMAINS as readonly string[]).includes(body.domain)) {
    return c.json(
      { error: `domain must be one of: ${VALID_DOMAINS.join(", ")}` },
      400
    );
  }

  const db = createDb(c.env.DB);
  await db
    .update(users)
    .set({ domain: body.domain, updatedAt: Date.now() })
    .where(eq(users.id, userId));

  return c.json({ domain: body.domain });
});
