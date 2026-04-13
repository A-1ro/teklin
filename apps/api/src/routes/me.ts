import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, users } from "../db";
import { authMiddleware, type AuthVariables } from "../middleware/auth";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

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
