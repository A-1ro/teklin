import type { LLMAdapter, LLMAdapterOptions, LLMResponse } from "../types";
import { LLMError } from "../types";

const DEFAULT_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";

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

function resolveModel(options: LLMAdapterOptions): string {
  return options.model ?? DEFAULT_MODEL;
}

function buildRequestBody(
  prompt: string,
  options: LLMAdapterOptions,
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

function buildAiOptions(gatewayId?: string): { gateway: { id: string } } | undefined {
  if (!gatewayId) {
    return undefined;
  }
  return { gateway: { id: gatewayId } };
}

function shouldFallbackToDirectWorkersAi(
  _err: unknown,
  attemptedModel: string,
  gatewayId?: string
): boolean {
  // Gateway 経由の外部モデル（Claude 等）が失敗した場合、
  // ネイティブ Workers AI モデル（Llama）で再試行する。
  // 既にデフォルトモデルで失敗している場合はリトライしない。
  if (!gatewayId) return false;
  if (attemptedModel === DEFAULT_MODEL) return false;
  return true;
}

/**
 * Convert request body for native Workers AI models.
 * Moves top-level `system` into the messages array because
 * native Workers AI models expect system role in messages,
 * not as a top-level parameter (which is the Anthropic format).
 */
function toNativeWorkersAiBody(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (typeof body.system !== "string" || !body.system) return body;
  const { system, ...rest } = body;
  const messages = Array.isArray(rest.messages) ? rest.messages : [];
  return {
    ...rest,
    messages: [{ role: "system", content: system }, ...messages],
  };
}

async function runModel(
  ai: Ai,
  model: string,
  body: Record<string, unknown>,
  gatewayId?: string
): Promise<unknown> {
  const aiOptions = buildAiOptions(gatewayId);

  try {
    return await ai.run(model, body, aiOptions);
  } catch (err) {
    if (!shouldFallbackToDirectWorkersAi(err, model, gatewayId)) {
      throw err;
    }
    console.warn(
      `[WorkersAI] Falling back from ${model} to ${DEFAULT_MODEL}:`,
      String(err)
    );
    return ai.run(DEFAULT_MODEL, toNativeWorkersAiBody(body));
  }
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

export function createWorkersAiAdapter(
  ai: Ai,
  gatewayId?: string
): LLMAdapter {
  return {
    provider: "workers-ai",

    async generate(
      prompt: string,
      options: LLMAdapterOptions = {}
    ): Promise<LLMResponse> {
      const model = resolveModel(options);

      let result: WorkersAiTextResponse;
      try {
        result = (await runModel(
          ai,
          model,
          buildRequestBody(prompt, options),
          gatewayId
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

    stream(prompt: string, options: LLMAdapterOptions = {}): ReadableStream<string> {
      const model = resolveModel(options);

      const { readable, writable } = new TransformStream<string, string>();
      const writer = writable.getWriter();

      (async () => {
        try {
          const stream = (await runModel(
            ai,
            model,
            buildRequestBody(prompt, options, { stream: true }),
            gatewayId
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
