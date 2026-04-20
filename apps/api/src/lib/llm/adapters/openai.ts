import type { LLMAdapter, LLMAdapterOptions, LLMResponse } from "../types";
import { LLMError } from "../types";

const DEFAULT_MODEL = "gpt-4.1";

interface OpenAiConfig {
  accountId: string;
  gatewayId: string;
  apiKey: string;
}

interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAiResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

function buildUrl(accountId: string, gatewayId: string): string {
  return (
    `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}` +
    `/openai/chat/completions`
  );
}

function buildMessages(
  prompt: string,
  system?: string
): OpenAiMessage[] {
  const messages: OpenAiMessage[] = [];
  if (system) {
    messages.push({ role: "system", content: system });
  }
  messages.push({ role: "user", content: prompt });
  return messages;
}

export function createOpenAiAdapter(config: OpenAiConfig): LLMAdapter {
  const url = buildUrl(config.accountId, config.gatewayId);

  return {
    provider: "openai",

    async generate(
      prompt: string,
      options: LLMAdapterOptions = {}
    ): Promise<LLMResponse> {
      const body = {
        model: options.model ?? DEFAULT_MODEL,
        messages: buildMessages(prompt, options.system),
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
      };

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        throw new LLMError(
          `OpenAI request failed: ${String(err)}`,
          "openai",
          err
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LLMError(
          `OpenAI request failed with status ${res.status}`,
          "openai",
          { status: res.status, body }
        );
      }

      const data = (await res.json()) as OpenAiResponse;
      const text = data.choices[0]?.message.content ?? "";

      return {
        text,
        provider: "openai",
        model: data.model ?? (options.model ?? DEFAULT_MODEL),
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    },

    stream(prompt: string, options: LLMAdapterOptions = {}): ReadableStream<string> {
      const body = {
        model: options.model ?? DEFAULT_MODEL,
        messages: buildMessages(prompt, options.system),
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
        stream: true,
      };

      const { readable, writable } = new TransformStream<string, string>();
      const writer = writable.getWriter();

      (async () => {
        let res: Response;
        try {
          res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
          });
        } catch (err) {
          await writer.abort(
            new LLMError(
              `OpenAI stream request failed: ${String(err)}`,
              "openai",
              err
            )
          );
          return;
        }

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          await writer.abort(
            new LLMError(
              `OpenAI stream request failed with status ${res.status}`,
              "openai",
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
                  choices?: Array<{
                    delta?: { content?: string };
                  }>;
                };
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  await writer.write(content);
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err) {
          await writer.abort(
            new LLMError(
              `OpenAI stream read failed: ${String(err)}`,
              "openai",
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
