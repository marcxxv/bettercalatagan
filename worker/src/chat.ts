/**
 * One question, answered: screen it, retrieve passages, stream the model's
 * answer through the output guard, and withdraw it if the guard objects.
 */
import type { Env } from './env';
import { figurePool, fixedAnswer, looksFilipino, MAX_QUESTION, OutputGuard, screen } from './guard';
import { json, type Stream } from './http';
import { recordUsage } from './limits';
import { complete, ModelError } from './model';
import { questionWithPassages, retrievalQuery, systemPrompt, type Turn } from './prompt';
import { retrieve, type Passage } from './retrieve';

const MAX_HISTORY = 8;

/** Drop control characters other than tab and newline. */
const stripControl = (text: string) =>
  [...text].filter((c) => c === '\t' || c === '\n' || c.charCodeAt(0) >= 32).join('');

export interface ChatRequest {
  history: Turn[];
  question: string;
}

/** Validate the body: an alternating conversation ending in the reader's question. */
export function parseChat(body: unknown): ChatRequest | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return null;
  const turns: Turn[] = [];
  for (const m of messages) {
    const role = (m as Turn)?.role;
    const content = (m as Turn)?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    turns.push({ role, content: stripControl(content).slice(0, 4000) });
  }
  const last = turns.at(-1)!;
  if (last.role !== 'user') return null;
  // Keep the most recent exchanges, starting on a question.
  let history = turns.slice(0, -1).slice(-MAX_HISTORY);
  while (history[0]?.role === 'assistant') history = history.slice(1);
  return { history, question: last.content.trim() };
}

const WITHDRAWN = {
  en: 'I couldn’t answer that reliably from the site’s published records, so I’ve withdrawn the answer rather than risk a wrong figure. The pages below are the closest matches.',
  fil: 'Hindi ko ito masagot nang may katiyakan mula sa mga nailathalang talaan ng site, kaya binawi ko ang sagot kaysa magbigay ng maling datos. Narito ang pinakamalapit na mga pahina.',
};
const UNAVAILABLE = {
  en: 'The assistant can’t answer right now. The pages below are the closest matches on the site.',
  fil: 'Hindi makasagot ang assistant sa ngayon. Narito ang pinakamalapit na mga pahina sa site.',
};

function sourceList(passages: readonly Passage[]) {
  return passages.map((p, i) => ({ n: i + 1, page: p.page, section: p.section, url: p.url }));
}

export async function answer(env: Env, request: ChatRequest, stream: Stream, canary: string, signal: AbortSignal) {
  const { history, question } = request;
  const filipino = looksFilipino(question);
  const lang = filipino ? 'fil' : 'en';

  const intent = screen(question);
  if (intent) {
    const fixed = fixedAnswer(intent, filipino);
    if (fixed.url) {
      await stream.send({ t: 'sources', items: [{ n: 1, page: 'Better Calatagan', section: 'Read more', url: fixed.url }] });
    }
    await stream.send({ t: 'delta', text: fixed.text });
    await stream.send({ t: 'done', grounded: true });
    return;
  }

  const passages = await retrieve(env, retrievalQuery(history, question));
  await stream.send({ t: 'sources', items: sourceList(passages) });

  const today = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long' }).format(new Date());
  const guard = new OutputGuard(
    figurePool(...passages.map((p) => p.text), question, ...history.map((t) => t.content), today),
    canary,
  );

  let tokens = 0;
  let withdrawn: string | null = null;
  try {
    const events = complete(env, systemPrompt(canary, today), history, questionWithPassages(question, passages), signal);
    for await (const event of events) {
      if (event.type === 'usage') tokens = event.tokens;
      else if (event.type === 'text') {
        const verdict = guard.push(event.text);
        if (!verdict.ok) {
          withdrawn = verdict.reason;
          break;
        }
        if (verdict.emit) await stream.send({ t: 'delta', text: verdict.emit });
      } else console.log('answering with', event.name);
      if (stream.closed) break;
    }
    if (!withdrawn) {
      const verdict = guard.finish();
      if (!verdict.ok) withdrawn = verdict.reason;
      else if (verdict.emit) await stream.send({ t: 'delta', text: verdict.emit });
    }
  } catch (error) {
    if (error instanceof ModelError && error.refusal) {
      await stream.send({ t: 'reset' });
      await stream.send({ t: 'delta', text: error.refusal });
      await stream.send({ t: 'done', grounded: true });
      return;
    }
    console.error('answer failed', String(error));
    await stream.send({ t: 'reset' });
    await stream.send({ t: 'delta', text: UNAVAILABLE[lang] });
    await stream.send({ t: 'done', grounded: false });
    await recordUsage(env, tokens, 'failed').catch(() => undefined);
    return;
  }

  if (withdrawn) {
    // Logged without the question or the answer: only which rule fired (and, for figures, which figure).
    console.warn('answer withdrawn', withdrawn);
    await stream.send({ t: 'reset' });
    await stream.send({ t: 'delta', text: WITHDRAWN[lang] });
  }
  await stream.send({ t: 'done', grounded: !withdrawn });
  await recordUsage(env, tokens || estimateTokens(passages, question, guard.output), withdrawn ? 'withdrawn' : 'answered').catch(
    () => undefined,
  );
}

/** When a provider reports no usage, count roughly four characters per token. */
function estimateTokens(passages: readonly Passage[], question: string, output: string) {
  const chars = passages.reduce((n, p) => n + p.text.length, 0) + question.length + output.length + 4000;
  return Math.ceil(chars / 4);
}

export const badRequest = (headers: Record<string, string>) =>
  json({ error: { code: 'bad_request', message: `Send { messages: [...] } ending with a question under ${MAX_QUESTION} characters.` } }, 400, headers);
