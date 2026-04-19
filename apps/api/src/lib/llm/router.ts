import type { LLMTaskType, LLMProvider } from "@teklin/shared";
import type { LLMAdapter, LLMOptions, LLMResponse } from "./types";
import { LLMError } from "./types";

export interface TaskRouteConfig {
  provider: LLMProvider;
  model?: string;
}

export interface RouterConfig {
  fallbackOrder: LLMProvider[];
  taskRouting: Record<LLMTaskType, TaskRouteConfig>;
}

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  fallbackOrder: ["workers-ai"],
  taskRouting: {
    lightweight: {
      provider: "workers-ai",
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    },
    quality: {
      provider: "workers-ai",
      model: "anthropic/claude-sonnet-4.6",
    },
  },
};

export interface LLMRouter {
  generate(
    prompt: string,
    options?: LLMOptions,
    taskType?: LLMTaskType
  ): Promise<LLMResponse>;
  stream(
    prompt: string,
    options?: LLMOptions,
    taskType?: LLMTaskType
  ): ReadableStream<string>;
}

export function createLLMRouter(
  adapters: LLMAdapter[],
  config: RouterConfig = DEFAULT_ROUTER_CONFIG
): LLMRouter {
  const adapterMap = new Map<LLMProvider, LLMAdapter>(
    adapters.map((a) => [a.provider, a])
  );

  function resolveAdapter(taskType?: LLMTaskType): LLMAdapter[] {
    // Build ordered list: preferred provider first, then fallback order
    const preferred =
      taskType != null
        ? config.taskRouting[taskType].provider
        : config.fallbackOrder[0];

    const order: LLMProvider[] = [
      preferred,
      ...config.fallbackOrder.filter((p) => p !== preferred),
    ];

    return order
      .map((p) => adapterMap.get(p))
      .filter((a): a is LLMAdapter => a != null);
  }

  return {
    async generate(
      prompt: string,
      options: LLMOptions = {},
      taskType?: LLMTaskType
    ): Promise<LLMResponse> {
      const candidates = resolveAdapter(taskType);
      if (candidates.length === 0) {
        throw new LLMError("No LLM adapters available", null);
      }

      let lastError: unknown;
      for (const adapter of candidates) {
        try {
          const route = taskType != null ? config.taskRouting[taskType] : null;
          const mergedOptions =
            route?.provider === adapter.provider && route.model
              ? { ...options, model: route.model }
              : options;
          return await adapter.generate(prompt, mergedOptions);
        } catch (err) {
          lastError = err;
          // Continue to next adapter
        }
      }

      throw new LLMError(
        `All LLM adapters failed. Last error: ${String(lastError)}`,
        candidates[candidates.length - 1].provider,
        lastError
      );
    },

    stream(
      prompt: string,
      options: LLMOptions = {},
      taskType?: LLMTaskType
    ): ReadableStream<string> {
      const candidates = resolveAdapter(taskType);
      if (candidates.length === 0) {
        const { readable, writable } = new TransformStream<string, string>();
        const writer = writable.getWriter();
        writer.abort(new LLMError("No LLM adapters available", null));
        return readable;
      }

      // Streaming fallback is not supported: once a stream begins, switching
      // providers mid-stream is not feasible. If the preferred adapter fails
      // before streaming starts (e.g., network error), the error propagates
      // to the caller. Consider retrying with generate() as a fallback
      // strategy at the call site if stream reliability is critical.
      const route = taskType != null ? config.taskRouting[taskType] : null;
      const mergedOptions =
        route?.provider === candidates[0].provider && route.model
          ? { ...options, model: route.model }
          : options;
      return candidates[0].stream(prompt, mergedOptions);
    },
  };
}
