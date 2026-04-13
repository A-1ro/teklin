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
