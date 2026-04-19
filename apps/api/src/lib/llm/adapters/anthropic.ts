import type { LLMAdapter, LLMOptions, LLMResponse } from "../types";
import { LLMError } from "../types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicConfig {
  accountId: string;
  gatewayId: string;
  apiKey: string;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

function buildUrl(accountId: string, gatewayId: string): string {
  return (
    `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}` +
    `/anthropic/v1/messages`
  );
}

export function createAnthropicAdapter(config: AnthropicConfig): LLMAdapter {
  const url = buildUrl(config.accountId, config.gatewayId);

  return {
    provider: "anthropic",

    async generate(
      prompt: string,
      options: LLMOptions = {}
    ): Promise<LLMResponse> {
      const messages: AnthropicMessage[] = [
        { role: "user", content: prompt },
      ];

      const body: Record<string, unknown> = {
        model: options.model ?? DEFAULT_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
      };
      if (options.system) {
        body.system = options.system;
      }

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        throw new LLMError(
          `Anthropic request failed: ${String(err)}`,
          "anthropic",
          err
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LLMError(
          `Anthropic request failed with status ${res.status}`,
          "anthropic",
          { status: res.status, body }
        );
      }

      const data = (await res.json()) as AnthropicResponse;
      const textBlock = data.content.find((b) => b.type === "text");
      const text = textBlock?.text ?? "";

      return {
        text,
        provider: "anthropic",
        model: data.model ?? (options.model ?? DEFAULT_MODEL),
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      };
    },

    stream(prompt: string, options: LLMOptions = {}): ReadableStream<string> {
      const messages: AnthropicMessage[] = [
        { role: "user", content: prompt },
      ];

      const body: Record<string, unknown> = {
        model: options.model ?? DEFAULT_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
        stream: true,
      };
      if (options.system) {
        body.system = options.system;
      }

      const { readable, writable } = new TransformStream<string, string>();
      const writer = writable.getWriter();

      (async () => {
        let res: Response;
        try {
          res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": config.apiKey,
              "anthropic-version": ANTHROPIC_VERSION,
            },
            body: JSON.stringify(body),
          });
        } catch (err) {
          await writer.abort(
            new LLMError(
              `Anthropic stream request failed: ${String(err)}`,
              "anthropic",
              err
            )
          );
          return;
        }

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          await writer.abort(
            new LLMError(
              `Anthropic stream request failed with status ${res.status}`,
              "anthropic",
              { status: res.status, body }
            )
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        try {
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
                  type?: string;
                  delta?: { type?: string; text?: string };
                };
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.type === "text_delta" &&
                  parsed.delta.text
                ) {
                  await writer.write(parsed.delta.text);
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          await writer.abort(
            new LLMError(
              `Anthropic stream read failed: ${String(err)}`,
              "anthropic",
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
