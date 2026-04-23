import { Hono } from "hono";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { placementRoutes } from "./routes/placement";
import { lessonRoutes } from "./routes/lessons";
import { cardRoutes } from "./routes/cards";
import { rewriteRoutes } from "./routes/rewrite";
import { notificationRoutes } from "./routes/notifications";
import { tekRoutes } from "./routes/tek";
import { gachaRoutes } from "./routes/gacha";
import { handleScheduled, handleLessonQueue } from "./scheduled";
import type { Bindings, LessonGenerationMessage } from "./types";

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
app.route("/api/notifications", notificationRoutes);
app.route("/api/tek", tekRoutes);
app.route("/api/gacha", gachaRoutes);

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

export default {
  fetch: app.fetch,
  scheduled: async (
    event: ScheduledEvent,
    env: Bindings,
    ctx: ExecutionContext
  ) => {
    ctx.waitUntil(handleScheduled(event.cron, env));
  },
  queue: async (
    batch: MessageBatch<LessonGenerationMessage>,
    env: Bindings
  ) => {
    await handleLessonQueue(batch, env);
  },
};
