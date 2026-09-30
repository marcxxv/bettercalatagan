/**
 * Responses, CORS and the NDJSON stream the site reads answers from.
 */
import type { Env } from './env';

/** True if `origin` is on the allowlist. A `*` matches characters other than a dot or slash. */
export function originAllowed(origin: string | null, allowed: string): boolean {
  if (!origin) return false;
  return allowed
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => {
      const pattern = entry.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^./]+');
      return new RegExp(`^${pattern}$`).test(origin);
    });
}

export function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  if (!originAllowed(origin, env.ALLOWED_ORIGINS)) return {};
  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY, ...headers },
  });
}

export type StreamEvent =
  | { t: 'sources'; items: { n: number; page: string; section: string; url: string }[] }
  | { t: 'delta'; text: string }
  | { t: 'reset' }
  | { t: 'done'; grounded: boolean }
  | { t: 'error'; code: string; message: string };

/** An NDJSON response whose events are written as the answer is produced. */
export function ndjson(headers: Record<string, string>) {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let closed = false;
  return {
    response: new Response(readable, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', ...SECURITY, ...headers },
    }),
    async send(event: StreamEvent) {
      if (closed) return;
      try {
        await writer.write(encoder.encode(`${JSON.stringify(event)}\n`));
      } catch {
        closed = true; // the reader went away
      }
    },
    get closed() {
      return closed;
    },
    async close() {
      if (closed) return;
      closed = true;
      await writer.close().catch(() => undefined);
    },
  };
}

export type Stream = ReturnType<typeof ndjson>;
