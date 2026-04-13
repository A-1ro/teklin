import type { LLMAdapter, LLMOptions, LLMResponse } from "../types";
import { LLMError } from "../types";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

interface WorkersAiTextResponse {
  response?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export function createWorkersAiAdapter(ai: Ai): LLMAdapter {
  return {
    provider: "workers-ai",

    async generate(
      prompt: string,
      options: LLMOptions = {}
    ): Promise<LLMResponse> {
      const messages: Array<{ role: string; content: string }> = [];
      if (options.system) {
        messages.push({ role: "system", content: options.system });
      }
      messages.push({ role: "user", content: prompt });

      let result: WorkersAiTextResponse;
      try {
        result = (await (ai as Ai).run(DEFAULT_MODEL, {
          messages,
          max_tokens: options.maxTokens ?? 1024,
          temperature: options.temperature ?? 0.7,
        })) as WorkersAiTextResponse;
      } catch (err) {
        throw new LLMError(
          `Workers AI request failed: ${String(err)}`,
          "workers-ai",
          err
        );
      }

      const text = result.response ?? "";
      const promptTokens = result.usage?.prompt_tokens ?? 0;
      const completionTokens = result.usage?.completion_tokens ?? 0;

      return {
        text,
        provider: "workers-ai",
        model: DEFAULT_MODEL,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    },

    stream(prompt: string, options: LLMOptions = {}): ReadableStream<string> {
      const messages: Array<{ role: string; content: string }> = [];
      if (options.system) {
        messages.push({ role: "system", content: options.system });
      }
      messages.push({ role: "user", content: prompt });

      const { readable, writable } = new TransformStream<string, string>();
      const writer = writable.getWriter();

      (async () => {
        try {
          const stream = (await (ai as Ai).run(DEFAULT_MODEL, {
            messages,
            max_tokens: options.maxTokens ?? 1024,
            temperature: options.temperature ?? 0.7,
            stream: true,
          })) as ReadableStream<Uint8Array>;

          const reader = stream.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Workers AI streams SSE lines: "data: {\"response\":\"...\"}"
            for (const line of chunk.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data) as { response?: string };
                if (parsed.response) {
                  await writer.write(parsed.response);
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
