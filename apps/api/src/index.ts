import { Hono } from "hono";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { placementRoutes } from "./routes/placement";
import { lessonRoutes } from "./routes/lessons";
import { cardRoutes } from "./routes/cards";
import { rewriteRoutes } from "./routes/rewrite";
import type { Bindings } from "./types";

export type { Bindings };

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());

// API Routes
app.route("/auth", authRoutes);
app.route("/api", meRoutes);
app.route("/api/placement", placementRoutes);
app.route("/api/lessons", lessonRoutes);
app.route("/api/cards", cardRoutes);
app.route("/api/rewrite", rewriteRoutes);

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// SPA fallback — serve index.html for all non-API/auth routes
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(new Request(new URL("/index.html", c.req.url)));
});

export default app;
