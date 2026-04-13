export type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  SRS_KV: KVNamespace;
  STREAK_KV: KVNamespace;
  USAGE_KV: KVNamespace;
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
  AI_GATEWAY_ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  /** Daily token limit per user. Defaults to "100000" if not set. */
  LLM_DAILY_TOKEN_LIMIT?: string;
};
