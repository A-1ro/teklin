import type { LLMProvider } from "@teklin/shared";

export type { LLMProvider };

/** Options for plain-text generation (no structured output). */
export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
  model?: string;
}

/** Options for structured JSON generation — responseFormat is required. */
export interface LLMJsonOptions extends LLMOptions {
  responseFormat: Record<string, unknown>;
}

/**
 * Internal options passed to adapters.
 * Call-sites should use LLMOptions (text) or LLMJsonOptions (JSON) instead.
 */
export interface LLMAdapterOptions extends LLMOptions {
  responseFormat?: Record<string, unknown>;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  text: string;
  provider: LLMProvider;
  model: string;
  usage: LLMUsage;
}

export interface LLMAdapter {
  readonly provider: LLMProvider;
  generate(prompt: string, options?: LLMAdapterOptions): Promise<LLMResponse>;
  stream(prompt: string, options?: LLMAdapterOptions): ReadableStream<string>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: LLMProvider | null,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LLMError";
  }
}
