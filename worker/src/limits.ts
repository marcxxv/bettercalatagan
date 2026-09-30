/**
 * Rate limits and the daily token budget, kept in D1.
 *
 * Visitors are counted by a salted hash of their IP address that changes
 * every day, so the table cannot be used to follow anyone over time, and rows
 * are deleted once their window has passed.
 */
import { limits, type Env } from './env';
import { digest } from './session';

export type Limited = { ok: true } | { ok: false; code: 'rate_limited' | 'busy' | 'session_limit' | 'budget'; retryAfter: number };

const today = (now: number) => new Date(now).toISOString().slice(0, 10);

export async function checkLimits(env: Env, ip: string, sid: string, now = Date.now()): Promise<Limited> {
  const cfg = limits(env);
  const day = today(now);
  const who = (await digest(`${env.SESSION_SECRET}:${day}:${ip}`)).slice(0, 24);
  const minuteEnd = Math.ceil((now + 1) / 60_000) * 60_000;
  const dayEnd = Date.parse(`${day}T00:00:00Z`) + 86_400_000;
  const sessionEnd = now + 2 * 60 * 60 * 1000;

  const windows = [
    { key: `ip:m:${who}`, reset: minuteEnd, max: cfg.ipPerMinute, code: 'rate_limited' as const },
    { key: `ip:d:${who}`, reset: dayEnd, max: cfg.ipPerDay, code: 'rate_limited' as const },
    { key: `s:${sid}`, reset: sessionEnd, max: cfg.sessionMessages, code: 'session_limit' as const },
    { key: `g:m`, reset: minuteEnd, max: cfg.globalPerMinute, code: 'busy' as const },
  ];

  const bump = env.DB.prepare(
    `INSERT INTO rl (key, count, reset) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rl.reset <= ?3 THEN 1 ELSE rl.count + 1 END,
       reset = CASE WHEN rl.reset <= ?3 THEN ?2 ELSE rl.reset END
     RETURNING count, reset`,
  );
  const results = await env.DB.batch<{ count: number; reset: number }>([
    ...windows.map((w) => bump.bind(w.key, w.reset, now)),
    env.DB.prepare('SELECT tokens FROM usage WHERE day = ?1').bind(day),
  ]);

  for (const [i, w] of windows.entries()) {
    const row = results[i].results[0];
    if (row && row.count > w.max) return { ok: false, code: w.code, retryAfter: Math.ceil((row.reset - now) / 1000) };
  }
  const used = (results[windows.length].results[0] as unknown as { tokens?: number } | undefined)?.tokens ?? 0;
  if (used >= cfg.dailyTokens) return { ok: false, code: 'budget', retryAfter: Math.ceil((dayEnd - now) / 1000) };
  return { ok: true };
}

export async function recordUsage(env: Env, tokens: number, outcome: 'answered' | 'withdrawn' | 'failed', now = Date.now()) {
  await env.DB.prepare(
    `INSERT INTO usage (day, tokens, requests, withdrawn, failed) VALUES (?1, ?2, 1, ?3, ?4)
     ON CONFLICT(day) DO UPDATE SET tokens = tokens + ?2, requests = requests + 1,
       withdrawn = withdrawn + ?3, failed = failed + ?4`,
  )
    .bind(today(now), Math.max(0, Math.round(tokens)), outcome === 'withdrawn' ? 1 : 0, outcome === 'failed' ? 1 : 0)
    .run();
}

/** Drop expired rate-limit rows and usage older than 90 days. */
export async function cleanup(env: Env, now = Date.now()) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM rl WHERE reset <= ?1').bind(now),
    env.DB.prepare('DELETE FROM usage WHERE day < ?1').bind(today(now - 90 * 86_400_000)),
  ]);
}
