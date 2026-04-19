import type { LLMAdapter, LLMOptions, LLMResponse } from "../types";
import { LLMError } from "../types";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

interface WorkersAiTextResponse {
  response?: unknown;
  content?: Array<{ type?: string; text?: string }>;
  model?: string;
  id?: string;
  type?: string;
  role?: string;
  stop_reason?: string | null;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

function resolveModel(options: LLMOptions): string {
  return options.model ?? DEFAULT_MODEL;
}

function buildRequestBody(
  prompt: string,
  options: LLMOptions,
  extras: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    messages: [{ role: "user", content: prompt }],
    max_tokens: options.maxTokens ?? 1024,
    temperature: options.temperature ?? 0.7,
    ...(options.system ? { system: options.system } : {}),
    ...(options.responseFormat
      ? { response_format: options.responseFormat }
      : {}),
    ...extras,
  };
}

function extractText(result: WorkersAiTextResponse): string {
  if (typeof result.response === "string") {
    return result.response;
  }

  if (result.response != null) {
    return JSON.stringify(result.response);
  }

  const text = result.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");

  return text ?? "";
}

function extractUsage(result: WorkersAiTextResponse): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const promptTokens =
    result.usage?.prompt_tokens ?? result.usage?.input_tokens ?? 0;
  const completionTokens =
    result.usage?.completion_tokens ?? result.usage?.output_tokens ?? 0;
  const totalTokens =
    result.usage?.total_tokens ?? promptTokens + completionTokens;

  return { promptTokens, completionTokens, totalTokens };
}

export function createWorkersAiAdapter(ai: Ai): LLMAdapter {
  return {
    provider: "workers-ai",

    async generate(
      prompt: string,
      options: LLMOptions = {}
    ): Promise<LLMResponse> {
      const model = resolveModel(options);

      let result: WorkersAiTextResponse;
      try {
        result = (await ai.run(
          model,
          buildRequestBody(prompt, options)
        )) as WorkersAiTextResponse;
      } catch (err) {
        throw new LLMError(
          `Workers AI request failed: ${String(err)}`,
          "workers-ai",
          err
        );
      }

      const text = extractText(result);
      const usage = extractUsage(result);

      return {
        text,
        provider: "workers-ai",
        model: result.model ?? model,
        usage,
      };
    },

    stream(prompt: string, options: LLMOptions = {}): ReadableStream<string> {
      const model = resolveModel(options);

      const { readable, writable } = new TransformStream<string, string>();
      const writer = writable.getWriter();

      (async () => {
        try {
          const stream = (await ai.run(
            model,
            buildRequestBody(prompt, options, { stream: true })
          )) as unknown as ReadableStream<Uint8Array>;

          const reader = stream.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data) as {
                  response?: string;
                  type?: string;
                  delta?: { type?: string; text?: string };
                  content_block?: { type?: string; text?: string };
                };
                if (typeof parsed.response === "string" && parsed.response) {
                  await writer.write(parsed.response);
                  continue;
                }
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.type === "text_delta" &&
                  parsed.delta.text
                ) {
                  await writer.write(parsed.delta.text);
                  continue;
                }
                if (
                  parsed.type === "content_block_start" &&
                  parsed.content_block?.type === "text" &&
                  parsed.content_block.text
                ) {
                  await writer.write(parsed.content_block.text);
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          await writer.abort(
            new LLMError(
              `Workers AI stream failed: ${String(err)}`,
              "workers-ai",
              err
            )
          );
          return;
        }
        await writer.close();
      })();

      return readable;
    },
  };
}
