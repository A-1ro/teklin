import type { LLMProvider } from "@teklin/shared";

export type { LLMProvider };

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
  model?: string;
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
  generate(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
  stream(prompt: string, options?: LLMOptions): ReadableStream<string>;
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
