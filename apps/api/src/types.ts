export interface LessonGenerationMessage {
  userId: string;
  /** YYYY-MM-DD Teklin day to generate the lesson for */
  today: string;
}

export type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  SRS_KV: KVNamespace;
  STREAK_KV: KVNamespace;
  USAGE_KV: KVNamespace;
  CONTENT_BUCKET: R2Bucket;
  AI: Ai;
  ASSETS: Fetcher;
  LESSON_QUEUE: Queue<LessonGenerationMessage>;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APP_URL: string;
  /** Daily token limit per user. Defaults to "100000" if not set. */
  LLM_DAILY_TOKEN_LIMIT?: string;
  AI_GATEWAY_ID?: string;
  WORKERS_AI_LIGHTWEIGHT_MODEL?: string;
  WORKERS_AI_QUALITY_MODEL?: string;
  /** VAPID public key (base64url-encoded uncompressed P-256 point) */
  VAPID_PUBLIC_KEY: string;
  /** VAPID private key (base64url-encoded P-256 scalar) */
  VAPID_PRIVATE_KEY: string;
};
