/**
 * The language models, tried in order until one answers.
 *
 * MODELS lists `provider:model` pairs. `nyo` is the NYO router
 * (OpenAI-compatible, key in the NYO_API_KEY secret, skipped when the secret is
 * absent); `workers-ai` runs on Cloudflare's own inference through the AI
 * binding and needs no key, so the assistant still answers if NYO is down,
 * rate-limited or out of credit.
 *
 * A model is abandoned for the next one only before it has produced any text;
 * once an answer has started it is finished or withdrawn, never spliced.
 */
import type { Env } from './env';
import type { Turn } from './prompt';

export interface ModelSpec {
  provider: 'nyo' | 'workers-ai';
  model: string;
}

export type ModelEvent = { type: 'text'; text: string } | { type: 'usage'; tokens: number };

export class ModelError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    /** A refusal from the NYO key's guardrail, safe to show to the reader. */
    readonly refusal?: string,
  ) {
    super(message);
  }
}

const MAX_TOKENS = 2400;
const FIRST_TOKEN_TIMEOUT = 45_000;

export function parseModels(env: Env): ModelSpec[] {
  return env.MODELS.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const at = entry.indexOf(':');
      return { provider: entry.slice(0, at), model: entry.slice(at + 1) } as ModelSpec;
    })
    .filter((spec) => (spec.provider === 'nyo' ? Boolean(env.NYO_API_KEY) : spec.provider === 'workers-ai'));
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

/** Parse a server-sent-events body of OpenAI-style chunks (or Workers AI's older { response }). */
async function* sse(body: ReadableStream<Uint8Array>): AsyncGenerator<ModelEvent> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      let chunk: {
        choices?: { delta?: { content?: string | null } }[];
        response?: string;
        usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
        error?: { message?: string };
      };
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }
      if (chunk.error) throw new ModelError(chunk.error.message ?? 'model error');
      const text = chunk.choices?.[0]?.delta?.content ?? chunk.response;
      if (text) yield { type: 'text', text };
      const usage = chunk.usage;
      if (usage) {
        const total = usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
        if (total) yield { type: 'usage', tokens: total };
      }
    }
  }
}

/**
 * Retrieval-grounded answers need careful reading more than long deliberation,
 * so reasoning models are asked for their lightest reasoning pass.
 */
function reasoning(model: string): Record<string, unknown> {
  if (/glm|qwen3/i.test(model)) return { chat_template_kwargs: { enable_thinking: false } };
  if (/gpt-oss/i.test(model)) return { reasoning_effort: 'low' };
  return {};
}

async function open(env: Env, spec: ModelSpec, messages: Message[], signal: AbortSignal) {
  const params = { messages, stream: true, max_tokens: MAX_TOKENS, temperature: 0.2 };
  if (spec.provider === 'nyo') {
    const res = await fetch(`${env.NYO_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { Authorization: `Bearer ${env.NYO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: spec.model, ...params, stream_options: { include_usage: true } }),
    });
    if (!res.ok || !res.body) {
      const detail = (await res.json().catch(() => ({}))) as { error?: { message?: string; type?: string } };
      const refusal = res.status === 422 && detail.error?.type === 'guardrail_rejected' ? detail.error.message : undefined;
      throw new ModelError(`nyo ${spec.model}: ${res.status} ${detail.error?.message ?? ''}`.trim(), res.status, refusal);
    }
    return res.body;
  }
  const stream = await env.AI.run(spec.model as keyof AiModels, { ...params, ...reasoning(spec.model) } as never);
  if (!(stream instanceof ReadableStream)) throw new ModelError(`workers-ai ${spec.model}: not a stream`);
  return stream as ReadableStream<Uint8Array>;
}

/**
 * Stream an answer from the first model that starts one. Yields the model's
 * name first, then text and usage events.
 */
export async function* complete(
  env: Env,
  system: string,
  history: readonly Turn[],
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<ModelEvent | { type: 'model'; name: string }> {
  const messages: Message[] = [{ role: 'system', content: system }, ...history, { role: 'user', content: prompt }];
  const specs = parseModels(env);
  if (!specs.length) throw new ModelError('no model configured');

  let lastError: unknown;
  for (const spec of specs) {
    const attempt = new AbortController();
    const abort = () => attempt.abort();
    signal.addEventListener('abort', abort);
    const timer = setTimeout(abort, FIRST_TOKEN_TIMEOUT);
    let started = false;
    try {
      const events = sse(await open(env, spec, messages, attempt.signal));
      for await (const event of events) {
        if (event.type === 'text' && !started) {
          started = true;
          clearTimeout(timer);
          yield { type: 'model', name: `${spec.provider}:${spec.model}` };
        }
        yield event;
      }
      if (started) return;
      lastError = new ModelError(`${spec.provider}:${spec.model}: empty answer`);
    } catch (error) {
      if (started) throw error;
      if (error instanceof ModelError && error.refusal) throw error;
      lastError = error;
      console.warn('model failed, trying the next', `${spec.provider}:${spec.model}`, String(error));
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
    if (signal.aborted) break;
  }
  throw lastError instanceof Error ? lastError : new ModelError('all models failed');
}
