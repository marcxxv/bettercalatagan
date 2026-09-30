/**
 * Short-lived, signed session tokens.
 *
 * A visitor gets one from POST /session (after a Turnstile check, when a
 * Turnstile secret is configured) and presents it with every question. The
 * token carries only a random id and an expiry; nothing about the visitor.
 */
import type { Env } from './env';

const TTL_SECONDS = 2 * 60 * 60;
const encoder = new TextEncoder();

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function key(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function issue(secret: string, now = Date.now()): Promise<{ token: string; expiresIn: number }> {
  const payload = b64url(
    encoder.encode(JSON.stringify({ sid: crypto.randomUUID(), exp: Math.floor(now / 1000) + TTL_SECONDS })),
  );
  const signature = b64url(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload)));
  return { token: `${payload}.${signature}`, expiresIn: TTL_SECONDS };
}

/** The session id if the token is genuine and unexpired, else null. */
export async function verify(secret: string, token: string | null, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await key(secret),
      fromB64url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const { sid, exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { sid: string; exp: number };
    return typeof sid === 'string' && exp * 1000 > now ? sid : null;
  } catch {
    return null;
  }
}

/** Cloudflare Turnstile: required only when a secret is configured. */
export async function turnstileOk(env: Env, token: unknown, ip: string | null): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (typeof token !== 'string' || !token) return false;
  const body = new FormData();
  body.set('secret', env.TURNSTILE_SECRET);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const outcome = (await res.json().catch(() => ({}))) as { success?: boolean };
  return outcome.success === true;
}

/** A stable, non-reversible reference for this model's canary and the day's IP salt. */
export async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
