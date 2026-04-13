// Re-exports
export type { LLMOptions, LLMUsage, LLMResponse, LLMAdapter } from "./types";
export { LLMError } from "./types";
export type { RouterConfig, TaskRouteConfig, LLMRouter } from "./router";
export { createLLMRouter, DEFAULT_ROUTER_CONFIG } from "./router";
export type { PromptTemplate } from "./prompts";
export { renderPrompt, templates } from "./prompts";
export { trackUsage, getDailyUsage, checkDailyLimit } from "./usage";
export { createWorkersAiAdapter } from "./adapters/workers-ai";
export { createOpenAiAdapter } from "./adapters/openai";
export { createAnthropicAdapter } from "./adapters/anthropic";

import type { LLMAdapter } from "./types";
import type { LLMRouter } from "./router";
import type { UsageKvValue } from "../../kv/index";
import { createLLMRouter, DEFAULT_ROUTER_CONFIG } from "./router";
import { renderPrompt, templates } from "./prompts";
import { trackUsage, getDailyUsage, checkDailyLimit } from "./usage";
import { createWorkersAiAdapter } from "./adapters/workers-ai";
import { createOpenAiAdapter } from "./adapters/openai";
import { createAnthropicAdapter } from "./adapters/anthropic";
import type { LLMUsage } from "./types";
import type { Bindings } from "../../types";

type LLMServiceBindings = Pick<
  Bindings,
  | "AI"
  | "USAGE_KV"
  | "AI_GATEWAY_ACCOUNT_ID"
  | "AI_GATEWAY_ID"
  | "OPENAI_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "LLM_DAILY_TOKEN_LIMIT"
>;

export interface LLMService {
  router: LLMRouter;
  usage: {
    track(userId: string, usage: LLMUsage): Promise<void>;
    getDaily(userId: string): Promise<UsageKvValue>;
    checkLimit(userId: string): Promise<boolean>;
  };
  prompts: {
    render: typeof renderPrompt;
    templates: typeof templates;
  };
}

/**
 * Factory function that wires up all LLM adapters, router, and usage tracker
 * from Cloudflare Worker bindings.
 */
export function createLLMService(env: LLMServiceBindings): LLMService {
  const adapters: LLMAdapter[] = [];

  // Workers AI is always available
  adapters.push(createWorkersAiAdapter(env.AI));

  // OpenAI via AI Gateway — only if key is configured
  if (env.OPENAI_API_KEY && env.AI_GATEWAY_ACCOUNT_ID && env.AI_GATEWAY_ID) {
    adapters.push(
      createOpenAiAdapter({
        accountId: env.AI_GATEWAY_ACCOUNT_ID,
        gatewayId: env.AI_GATEWAY_ID,
        apiKey: env.OPENAI_API_KEY,
      })
    );
  }

  // Anthropic via AI Gateway — only if key is configured
  if (
    env.ANTHROPIC_API_KEY &&
    env.AI_GATEWAY_ACCOUNT_ID &&
    env.AI_GATEWAY_ID
  ) {
    adapters.push(
      createAnthropicAdapter({
        accountId: env.AI_GATEWAY_ACCOUNT_ID,
        gatewayId: env.AI_GATEWAY_ID,
        apiKey: env.ANTHROPIC_API_KEY,
      })
    );
  }

  const router = createLLMRouter(adapters, DEFAULT_ROUTER_CONFIG);
  const dailyLimit = parseInt(env.LLM_DAILY_TOKEN_LIMIT ?? "100000", 10);
  const kv = env.USAGE_KV;

  return {
    router,
    usage: {
      track: (userId, usage) => trackUsage(kv, userId, usage),
      getDaily: (userId) => getDailyUsage(kv, userId),
      checkLimit: (userId) => checkDailyLimit(kv, userId, dailyLimit),
    },
    prompts: {
      render: renderPrompt,
      templates,
    },
  };
}
