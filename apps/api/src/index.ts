import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";

export type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  SRS_KV: KVNamespace;
  STREAK_KV: KVNamespace;
  CONTENT_BUCKET: R2Bucket;
  AI: Ai;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APP_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      return c.env.CORS_ORIGIN || "http://localhost:3000";
    },
    credentials: true,
  })
);

// Routes
app.route("/auth", authRoutes);
app.route("/api", meRoutes);

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
