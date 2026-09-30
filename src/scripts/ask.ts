/**
 * The assistant, in the browser.
 *
 * Loaded on first use. It asks the assistant's Worker for a short-lived
 * session (passing a Turnstile check first, if one is configured), sends the
 * conversation, and renders the NDJSON answer as it streams in: the sources
 * first, then the text, which the Worker may withdraw and replace if its
 * checks fail.
 *
 * The conversation is kept in sessionStorage, so it survives following a
 * source to another page in this tab and is gone when the tab closes. Nothing
 * is stored anywhere else.
 */
import { plainText, renderMarkdown, type CitationTarget } from './markdown';

interface Source {
  n: number;
  page: string;
  section: string;
  url: string;
}

interface Turn {
  question: string;
  answer: string;
  sources: Source[];
  state: 'waiting' | 'streaming' | 'done' | 'withdrawn' | 'failed';
}

type Event =
  | { t: 'sources'; items: Source[] }
  | { t: 'delta'; text: string }
  | { t: 'reset' }
  | { t: 'done'; grounded: boolean }
  | { t: 'error'; code: string; message: string };

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const COPY_ICON = svg('<rect x="8.5" y="8.5" width="12" height="12" rx="1.5"/><path d="M15.5 8.5V5A1.5 1.5 0 0 0 14 3.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>');
const CHECK_ICON = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>');

const STORE = 'bc-ask';
const SESSION = 'bc-ask-session';
const HISTORY_TURNS = 4;

const panel = document.querySelector<HTMLDialogElement>('#ask-panel')!;
const endpoint = panel.dataset.endpoint!.replace(/\/$/, '');
const turnstileKey = panel.dataset.turnstile;
const pageNames: Record<string, string> = JSON.parse(panel.dataset.pages ?? '{}');

const log = panel.querySelector<HTMLElement>('[data-ask-log]')!;
const empty = panel.querySelector<HTMLElement>('[data-ask-empty]')!;
const form = panel.querySelector<HTMLFormElement>('[data-ask-form]')!;
const input = form.querySelector<HTMLInputElement>('input')!;
const go = panel.querySelector<HTMLButtonElement>('[data-ask-go]')!;
const stop = panel.querySelector<HTMLButtonElement>('[data-ask-stop]')!;
const fresh = panel.querySelector<HTMLButtonElement>('[data-ask-new]')!;
const status = panel.querySelector<HTMLElement>('[data-ask-status]')!;

let turns: Turn[] = load();
let controller: AbortController | null = null;

/* ---------- Storage (this tab only) ---------- */

function load(): Turn[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as Turn[];
    return Array.isArray(saved) ? saved.filter((t) => t.state !== 'waiting' && t.state !== 'streaming') : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(turns.slice(-20)));
  } catch {
    /* storage unavailable: the conversation lasts for this page only */
  }
}

/* ---------- Rendering ---------- */

const MOTION = window.matchMedia('(prefers-reduced-motion: no-preference)');

/** "Finances", from the section a URL belongs to. */
function sectionName(source: Source): string {
  const path = new URL(source.url, location.origin).pathname.replace(/\/$/, '') || '/';
  return pageNames[path] ?? pageNames[`/${path.split('/')[1]}`] ?? source.page;
}

/**
 * Sources the answer cites, numbered 1, 2, 3… in the order the answer first
 * cites them (the Worker's own numbers follow retrieval rank, which means
 * nothing to a reader). If the answer cites none, the best three matches.
 */
function citations(turn: Turn): { byWorkerNumber: Map<number, CitationTarget>; shown: (Source & { shownAs: number })[] } {
  const order = [...new Set([...turn.answer.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])))];
  let cited = order.map((n) => turn.sources.find((s) => s.n === n)).filter((s): s is Source => Boolean(s));
  if (!cited.length) cited = turn.sources.slice(0, 3);
  const shown = cited.map((s, i) => ({ ...s, shownAs: i + 1 }));
  const byWorkerNumber = new Map(
    shown.map((s) => [s.n, { n: s.shownAs, url: s.url, label: `${sectionName(s)} — ${s.section}` }]),
  );
  return { byWorkerNumber, shown };
}

function element(turn: Turn, index: number): HTMLElement {
  let article = log.querySelector<HTMLElement>(`[data-turn="${index}"]`);
  if (!article) {
    article = document.createElement('article');
    article.className = 'ap-turn';
    article.dataset.turn = String(index);
    article.setAttribute('aria-labelledby', `ap-q-${index}`);
    article.innerHTML = `
      <h3 class="ap-q" id="ap-q-${index}"></h3>
      <p class="ap-working"><span class="ap-pulse" aria-hidden="true"><i></i><i></i><i></i></span><span data-working-text></span></p>
      <div class="ap-a" data-answer></div>
      <section class="ap-sources" data-sources hidden><h4>Sources on this site</h4><ol></ol></section>
      <div class="ap-actions" data-actions hidden>
        <button type="button" data-copy-answer aria-label="Copy answer" title="Copy answer">${COPY_ICON}</button>
      </div>`;
    article.querySelector('.ap-q')!.textContent = turn.question;
    article.querySelector('[data-copy-answer]')!.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const { byWorkerNumber } = citations(turn);
      let copied = true;
      try {
        await navigator.clipboard.writeText(
          `${turn.question}\n\n${plainText(turn.answer, (n) => byWorkerNumber.get(n), location.origin)}`,
        );
      } catch {
        copied = false;
      }
      button.innerHTML = copied ? CHECK_ICON : COPY_ICON;
      button.classList.toggle('copied', copied);
      button.setAttribute('aria-label', copied ? 'Copied' : 'Copy failed');
      status.textContent = copied ? 'Answer copied.' : 'Could not copy the answer.';
      setTimeout(() => {
        button.innerHTML = COPY_ICON;
        button.classList.remove('copied');
        button.setAttribute('aria-label', 'Copy answer');
      }, 1600);
    });
    log.append(article);
  }
  return article;
}

let frame = 0;
function paint(turn: Turn, index: number) {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    draw(turn, index);
  });
}

function draw(turn: Turn, index: number) {
  const article = element(turn, index);
  const working = article.querySelector<HTMLElement>('.ap-working')!;
  const answer = article.querySelector<HTMLElement>('[data-answer]')!;
  const sources = article.querySelector<HTMLElement>('[data-sources]')!;
  const actions = article.querySelector<HTMLElement>('[data-actions]')!;

  const waiting = turn.state === 'waiting' || (turn.state === 'streaming' && !turn.answer);
  working.hidden = !waiting;
  working.querySelector('[data-working-text]')!.textContent = turn.sources.length
    ? `Reading ${turn.sources.length} ${turn.sources.length === 1 ? 'record' : 'records'}…`
    : 'Searching the records…';

  const { byWorkerNumber, shown } = citations(turn);
  answer.innerHTML = turn.answer ? renderMarkdown(turn.answer, (n) => byWorkerNumber.get(n)) : '';
  answer.classList.toggle('streaming', turn.state === 'streaming' && Boolean(turn.answer));
  answer.classList.toggle('withdrawn', turn.state === 'withdrawn');
  answer.classList.toggle('failed', turn.state === 'failed');
  answer.setAttribute('aria-busy', String(turn.state === 'streaming' || turn.state === 'waiting'));

  const settled = turn.state !== 'waiting' && turn.state !== 'streaming';
  const list = settled ? shown : [];
  sources.hidden = list.length === 0;
  if (list.length) {
    sources.querySelector('h4')!.textContent =
      turn.state === 'done' ? 'Sources on this site' : 'Closest matches on this site';
    sources.querySelector('ol')!.innerHTML = list
      .map(
        (s) =>
          `<li><a href="${escapeAttr(s.url)}"><span class="src-n">${s.shownAs}</span><span class="src-page">${escapeText(sectionName(s))}</span><span class="src-section">${escapeText(s.section)}</span></a></li>`,
      )
      .join('');
  }
  actions.hidden = turn.state !== 'done';
}

const escapeText = (value: string) =>
  value.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
const escapeAttr = (value: string) => escapeText(value).replace(/"/g, '&quot;');

function renderAll() {
  log.querySelectorAll('.ap-turn').forEach((el) => el.remove());
  turns.forEach((turn, i) => draw(turn, i));
  empty.hidden = turns.length > 0;
  fresh.hidden = turns.length === 0;
}

function scrollToTurn(index: number) {
  const article = log.querySelector<HTMLElement>(`[data-turn="${index}"]`);
  if (!article) return;
  log.scrollTo({ top: article.offsetTop - 16, behavior: MOTION.matches ? 'smooth' : 'auto' });
}

function busy(on: boolean) {
  go.hidden = on;
  stop.hidden = !on;
  input.toggleAttribute('aria-disabled', on);
}

/* ---------- Session and bot check ---------- */

let turnstileScript: Promise<void> | null = null;

function turnstileToken(): Promise<string | undefined> {
  if (!turnstileKey) return Promise.resolve(undefined);
  const holder = panel.querySelector<HTMLElement>('[data-ask-challenge]')!;
  turnstileScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      turnstileScript = null;
      reject(new Error('turnstile'));
    };
    document.head.append(script);
  });
  return turnstileScript.then(
    () =>
      new Promise<string>((resolve, reject) => {
        type Turnstile = { render(el: HTMLElement, options: Record<string, unknown>): string; remove(id: string): void };
        const api = (window as unknown as { turnstile: Turnstile }).turnstile;
        holder.hidden = false;
        const id = api.render(holder, {
          sitekey: turnstileKey,
          appearance: 'interaction-only',
          callback: (token: string) => {
            holder.hidden = true;
            setTimeout(() => api.remove(id), 0);
            resolve(token);
          },
          'error-callback': () => reject(new Error('turnstile')),
        });
      }),
  );
}

async function sessionToken(renew = false): Promise<string> {
  if (!renew) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION) ?? 'null') as { token: string; until: number } | null;
      if (saved && saved.until > Date.now()) return saved.token;
    } catch {
      /* fall through to a new session */
    }
  }
  const res = await fetch(`${endpoint}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnstileToken: await turnstileToken() }),
  });
  const body = (await res.json().catch(() => ({}))) as { token?: string; expiresIn?: number; error?: { message?: string } };
  if (!res.ok || !body.token) throw new AskError(body.error?.message ?? 'The assistant is unavailable right now.');
  try {
    sessionStorage.setItem(SESSION, JSON.stringify({ token: body.token, until: Date.now() + (body.expiresIn ?? 3600) * 900 }));
  } catch {
    /* keep it in memory only */
  }
  return body.token;
}

class AskError extends Error {}

/* ---------- Asking ---------- */

function historyFor(index: number) {
  return turns
    .slice(0, index)
    .filter((t) => t.state === 'done')
    .slice(-HISTORY_TURNS)
    .flatMap((t) => [
      { role: 'user', content: t.question },
      { role: 'assistant', content: t.answer },
    ]);
}

async function send(question: string) {
  question = question.trim().slice(0, 600);
  if (!question || controller) return;
  const turn: Turn = { question, answer: '', sources: [], state: 'waiting' };
  turns.push(turn);
  const index = turns.length - 1;
  empty.hidden = true;
  fresh.hidden = false;
  draw(turn, index);
  scrollToTurn(index);
  input.value = '';
  busy(true);
  status.textContent = 'Looking up your question.';
  controller = new AbortController();

  try {
    const messages = [...historyFor(index), { role: 'user', content: question }];
    // Where the question was asked from, so "this page" and "this document" mean something.
    const readerContext = () => {
      const url = new URL(location.href);
      return { path: url.pathname, read: url.searchParams.get('read') };
    };
    let res: Response | null = null;
    for (const renew of [false, true]) {
      res = await fetch(`${endpoint}/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await sessionToken(renew)}` },
        body: JSON.stringify({ messages, context: readerContext() }),
      });
      if (res.status !== 401) break;
    }
    if (!res!.ok || !res!.body) {
      const body = (await res!.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new AskError(body.error?.message ?? 'The assistant can’t answer right now. Search still works.');
    }

    turn.state = 'streaming';
    const reader = res!.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline: number;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.trim()) handle(turn, JSON.parse(line) as Event);
      }
      paint(turn, index);
    }
    if (turn.state === 'streaming') turn.state = turn.answer ? 'done' : 'failed';
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      turn.state = turn.answer ? 'done' : 'failed';
      if (!turn.answer) turn.answer = 'Stopped.';
    } else {
      turn.state = 'failed';
      turn.answer =
        error instanceof AskError ? error.message : 'Couldn’t reach the assistant. Check your connection and try again.';
    }
  } finally {
    controller = null;
    busy(false);
    cancelAnimationFrame(frame);
    frame = 0;
    draw(turn, index);
    save();
    status.textContent =
      turn.state === 'done' ? `Answer: ${plainText(turn.answer, () => undefined, location.origin)}` : turn.answer;
    input.focus({ preventScroll: true });
  }
}

function handle(turn: Turn, event: Event) {
  switch (event.t) {
    case 'sources':
      turn.sources = event.items;
      break;
    case 'delta':
      turn.answer += event.text;
      break;
    case 'reset':
      turn.answer = '';
      turn.state = 'withdrawn';
      break;
    case 'done':
      if (turn.state === 'streaming') turn.state = 'done';
      break;
    case 'error':
      turn.state = 'failed';
      turn.answer = event.message;
      break;
  }
}

/* ---------- Wiring ---------- */

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void send(input.value);
});
stop.addEventListener('click', () => controller?.abort());
fresh.addEventListener('click', () => {
  controller?.abort();
  turns = [];
  save();
  renderAll();
  input.focus();
});
for (const chip of panel.querySelectorAll<HTMLButtonElement>('[data-ask-suggest]')) {
  chip.addEventListener('click', () => void send(chip.dataset.askSuggest ?? ''));
}
panel.addEventListener('click', (event) => {
  if (event.target === panel) void close();
});
panel.querySelector('[data-ask-close]')!.addEventListener('click', () => void close());
panel.addEventListener('cancel', (event) => {
  event.preventDefault();
  void close();
});
panel.addEventListener('close', () => {
  controller?.abort();
  document.body.classList.remove('ask-open');
});
// Following a source closes the panel; the conversation is still there when it reopens.
log.addEventListener('click', (event) => {
  const link = (event.target as Element).closest('a');
  if (link && link.origin === location.origin) panel.close();
});

/* ---------- The morph: the panel grows out of the box it was asked from, and back ---------- */

let origin: HTMLElement | null = null;
let morphing: Animation | null = null;
const PARTS = '.ap-head, .ap-log, .ap-compose';

/** The origin box's rectangle, if it is on screen to morph from or into. */
function originRect(): DOMRect | null {
  const rect = origin?.getBoundingClientRect();
  if (!rect || rect.width < 40 || rect.height < 20) return null;
  if (rect.bottom < 0 || rect.top > innerHeight) return null;
  return rect;
}

/** Keyframes that take the panel from `from` (a pill-shaped ask box) to where it sits. */
function morphFrames(from: DOMRect | null): Keyframe[] {
  const to = panel.getBoundingClientRect();
  const radius = getComputedStyle(panel).borderRadius;
  if (!from) {
    return [
      { transform: 'translateY(24px) scale(0.97)', opacity: 0, borderRadius: radius },
      { transform: 'none', opacity: 1, borderRadius: radius },
    ];
  }
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  // A pill of the origin's height, expressed in the panel's own (scaled) units.
  const pill = `${from.height / 2 / sx}px / ${from.height / 2 / sy}px`;
  return [
    { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`, borderRadius: pill, opacity: 0.4 },
    { opacity: 1, offset: 0.35 },
    { transform: 'none', borderRadius: radius, opacity: 1 },
  ];
}

function animateOpen() {
  if (!MOTION.matches || !panel.animate) return;
  morphing?.cancel();
  const timing = { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
  morphing = panel.animate(morphFrames(originRect()), timing);
  for (const part of panel.querySelectorAll<HTMLElement>(PARTS)) {
    part.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], timing);
  }
  try {
    panel.animate({ opacity: [0, 1] }, { duration: 300, pseudoElement: '::backdrop' });
  } catch {
    /* no backdrop animation in this browser */
  }
}

async function close() {
  if (!panel.open) return;
  controller?.abort();
  if (!MOTION.matches || !panel.animate) return panel.close();
  // Let the floating ask bar come back first, so there is somewhere to morph into.
  document.body.classList.remove('ask-open');
  morphing?.cancel();
  const timing = { duration: 380, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' as const };
  morphing = panel.animate(morphFrames(originRect()).reverse(), timing);
  for (const part of panel.querySelectorAll<HTMLElement>(PARTS)) {
    part.animate([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], timing);
  }
  try {
    panel.animate({ opacity: [1, 0] }, { ...timing, pseudoElement: '::backdrop' });
  } catch {
    /* no backdrop animation in this browser */
  }
  try {
    await morphing.finished;
  } catch {
    return; // reopened mid-close
  }
  panel.close();
  panel.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  morphing = null;
}

renderAll();

/**
 * Open the assistant, and ask `question` if there is one. `from` is the ask
 * box it was opened from: the panel grows out of it, and shrinks back into it.
 */
export function openAsk(question = '', from: HTMLElement | null = null) {
  if (from) origin = from;
  if (!panel.open) {
    panel.showModal();
    animateOpen();
    document.body.classList.add('ask-open');
  }
  if (question.trim()) void send(question);
  else {
    const last = turns.length - 1;
    if (last >= 0) scrollToTurn(last);
    input.focus();
  }
}
