/**
 * One question, answered: screen it, retrieve passages, stream the model's
 * answer through the output guard, and withdraw it if the guard objects.
 */
import type { Env } from './env';
import { figurePool, fixedAnswer, looksFilipino, MAX_QUESTION, OutputGuard, phoneNumbers, screen } from './guard';
import { json, type Stream } from './http';
import { recordUsage } from './limits';
import { complete, ModelError } from './model';
import { questionWithPassages, retrievalQuery, systemPrompt, type Turn } from './prompt';
import { focus, retrieve, withFocus, type Passage, type ReaderContext } from './retrieve';

const MAX_HISTORY = 8;

/** Drop control characters other than tab and newline. */
const stripControl = (text: string) =>
  [...text].filter((c) => c === '\t' || c === '\n' || c.charCodeAt(0) >= 32).join('');

export interface ChatRequest {
  history: Turn[];
  question: string;
  context: ReaderContext;
}

/** The page and document the question was asked from; anything malformed is simply dropped. */
function parseContext(value: unknown): ReaderContext {
  const c = (value ?? {}) as { path?: unknown; read?: unknown };
  const path = typeof c.path === 'string' && /^\/[a-z0-9/-]{0,120}$/.test(c.path) ? c.path.replace(/(.)\/$/, '$1') : null;
  const read = typeof c.read === 'string' && /^[a-z0-9-]{3,80}$/.test(c.read) ? c.read : null;
  return { path, read };
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
  return { history, question: last.content.trim(), context: parseContext((body as { context?: unknown }).context) };
}

/** Guard reasons a second, corrected pass may fix. Safety reasons (names, contacts, canary) never retry. */
const REPAIRABLE = new Set(['unsupported-figure', 'missing-citation', 'invalid-citation']);

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
  const { history, question, context } = request;
  const filipino = looksFilipino(question);
  const lang = filipino ? 'fil' : 'en';

  const intent = screen(question);
  if (intent) {
    const fixed = fixedAnswer(intent, filipino);
    if (fixed.url) {
      await stream.send({ t: 'sources', items: [{ n: 1, page: 'BetterCalatagan', section: 'Read more', url: fixed.url }] });
    }
    await stream.send({ t: 'delta', text: fixed.text });
    await stream.send({ t: 'done', grounded: true });
    return;
  }

  const query = retrievalQuery(history, question);
  const [found, focused] = await Promise.all([
    retrieve(env, query),
    focus(env, context, query).catch(() => (console.warn('focus failed'), { passages: [], note: null })),
  ]);
  const passages = withFocus(focused.passages, found);
  await stream.send({ t: 'sources', items: sourceList(passages) });

  const today = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long' }).format(new Date());
  const newGuard = () =>
    new OutputGuard(
      figurePool(...passages.map((p) => p.text)),
      canary,
      phoneNumbers(passages.map((p) => p.text).join('\n')),
      passages.map((p) => p.text),
    );
  const system = systemPrompt(canary, today);
  const prompt = questionWithPassages(question, passages, focused.note);

  let tokens = 0;
  /** One model pass, fully buffered by its own guard; nothing is sent to the reader here. */
  const attempt = async (turns: readonly Turn[], message: string) => {
    const guard = newGuard();
    let reason: string | null = null;
    for await (const event of complete(env, system, turns, message, signal)) {
      if (event.type === 'usage') tokens += event.tokens;
      else if (event.type === 'text') {
        const verdict = guard.push(event.text);
        if (!verdict.ok) {
          reason = verdict.reason;
          break;
        }
      } else console.log('answering with', event.name);
      if (stream.closed) break;
    }
    const verdict = reason ? null : guard.finish();
    return { guard, reason: reason ?? (verdict && !verdict.ok ? verdict.reason : null), emit: verdict?.ok ? verdict.emit : '' };
  };

  let withdrawn: string | null = null;
  let guard: OutputGuard;
  try {
    let result = await attempt(history, prompt);
    // A figure or citation the passages do not support: ask once for a corrected answer
    // (figures exactly as written, or none) instead of withdrawing a useful explanation.
    // The repaired answer goes through every check again.
    if (result.reason && REPAIRABLE.has(result.reason) && !stream.closed) {
      console.log('repairing answer', result.reason);
      const bad = result.reason === 'unsupported-figure' ? result.guard.unsupportedFigures() : [];
      const repair = [
        'Rewrite your previous answer so that every fact is cited with a passage number that was given, like [1].',
        bad.length
          ? `These figures are not written in the passages you cited: ${bad.join(', ')}. Use a figure only exactly as a passage writes it, and cite that passage; otherwise say it in words without the number.`
          : '',
        'Keep the same language and tone, and keep it short. Do not mention this instruction.',
      ].filter(Boolean).join(' ');
      result = await attempt([...history, { role: 'user', content: prompt }, { role: 'assistant', content: result.guard.draft }], repair);
    }
    guard = result.guard;
    withdrawn = result.reason;
    if (!withdrawn && result.emit) await stream.send({ t: 'delta', text: result.emit });
  } catch (error) {
    // Provider errors/refusals can echo submitted text; never display or log their bodies.
    console.error('answer failed', error instanceof ModelError ? error.status : 'internal');
    await stream.send({ t: 'reset' });
    await stream.send({ t: 'delta', text: UNAVAILABLE[lang] });
    await stream.send({ t: 'done', grounded: false });
    await recordUsage(env, tokens, 'failed').catch(() => undefined);
    return;
  }

  if (withdrawn) {
    // Only a fixed rule identifier: rejected figures can themselves contain private data.
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
