import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { placementRoutes } from "./routes/placement";
import { lessonRoutes } from "./routes/lessons";
import type { Bindings } from "./types";

export type { Bindings };

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ORIGIN || "http://localhost:3000";
      return origin === allowed ? allowed : "";
    },
    credentials: true,
  })
);

// Routes
app.route("/auth", authRoutes);
app.route("/api", meRoutes);
app.route("/api/placement", placementRoutes);
app.route("/api/lessons", lessonRoutes);

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// Root
app.get("/", (c) => {
  return c.json({
    name: "Teklin API",
    version: "0.1.0",
  });
});

export default app;
