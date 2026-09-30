/**
 * The BetterCalatagan assistant.
 *
 *   GET  /health        corpus version and passage count
 *   POST /session       { turnstileToken? } → { token, expiresIn }
 *   POST /chat          Bearer <session>; { messages } → NDJSON answer stream
 *   POST /admin/sync    Bearer <ADMIN_TOKEN>; re-index the site's corpus now
 *
 * The corpus is also re-checked every 30 minutes by the cron trigger, so a
 * redeployed site is reflected without anyone touching the Worker.
 */
import { answer, badRequest, parseChat } from './chat';
import { meta, sync } from './corpus';
import type { Env } from './env';
import { corsHeaders, json, ndjson, originAllowed } from './http';
import { checkLimits, cleanup } from './limits';
import { digest, issue, turnstileOk, verify } from './session';

const MESSAGES: Record<string, string> = {
  rate_limited: 'You’ve asked a lot of questions in a short time. Please wait a moment and try again.',
  session_limit: 'This conversation has reached its limit. Start a new conversation to keep asking.',
  busy: 'The assistant is busy right now. Please try again in a minute.',
  budget: 'The assistant has reached its limit for today. Search still works, and the assistant will be back tomorrow.',
};

const bearer = (request: Request) => request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null;

async function health(env: Env, cors: Record<string, string>) {
  const [version, syncedAt, count] = await Promise.all([
    meta(env, 'corpus_version'),
    meta(env, 'synced_at'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM chunks').first<{ n: number }>(),
  ]);
  return json({ ok: Boolean(version), corpus: { version, passages: count?.n ?? 0, syncedAt } }, 200, cors);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: Object.keys(cors).length ? 204 : 403, headers: cors });
    }
    if (url.pathname === '/health' && request.method === 'GET') return health(env, cors);

    if (url.pathname === '/admin/sync' && request.method === 'POST') {
      if (!env.ADMIN_TOKEN || bearer(request) !== env.ADMIN_TOKEN) return json({ error: 'unauthorized' }, 401);
      try {
        return json(await sync(env, { force: url.searchParams.get('force') === '1' }));
      } catch (error) {
        return json({ error: String(error) }, 502);
      }
    }

    if (request.method !== 'POST' || (url.pathname !== '/session' && url.pathname !== '/chat')) {
      return json({ error: { code: 'not_found', message: 'Not found' } }, 404, cors);
    }
    if (!originAllowed(origin, env.ALLOWED_ORIGINS)) {
      return json({ error: { code: 'forbidden', message: 'Origin not allowed' } }, 403);
    }
    const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
    const body = await request.json().catch(() => null);

    if (url.pathname === '/session') {
      const token = (body as { turnstileToken?: unknown } | null)?.turnstileToken;
      if (!(await turnstileOk(env, token, ip))) {
        return json({ error: { code: 'challenge_failed', message: 'Verification failed. Reload the page and try again.' } }, 403, cors);
      }
      return json(await issue(env.SESSION_SECRET), 200, cors);
    }

    // /chat
    const sid = await verify(env.SESSION_SECRET, bearer(request));
    if (!sid) return json({ error: { code: 'session', message: 'Session expired.' } }, 401, cors);
    const chat = parseChat(body);
    if (!chat) return badRequest(cors);

    const limited = await checkLimits(env, ip, sid);
    if (!limited.ok) {
      return json({ error: { code: limited.code, message: MESSAGES[limited.code] } }, 429, {
        ...cors,
        'Retry-After': String(limited.retryAfter),
      });
    }

    const stream = ndjson(cors);
    const canary = `BC-${(await digest(`canary:${env.SESSION_SECRET}`)).slice(0, 10)}`;
    const abort = new AbortController();
    request.signal?.addEventListener('abort', () => abort.abort());
    ctx.waitUntil(
      answer(env, chat, stream, canary, abort.signal)
        .catch(async (error) => {
          console.error('chat failed', String(error));
          await stream.send({ t: 'error', code: 'failed', message: 'Something went wrong. Please try again.' });
        })
        .finally(() => stream.close()),
    );
    return stream.response;
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      Promise.allSettled([
        sync(env).then((r) => r.changed && console.log('corpus synced', JSON.stringify(r))),
        cleanup(env),
      ]).then((results) => {
        for (const r of results) if (r.status === 'rejected') console.error('scheduled task failed', String(r.reason));
      }),
    );
  },
} satisfies ExportedHandler<Env>;
