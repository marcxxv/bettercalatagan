/**
 * Bindings, variables and secrets, and the numeric settings read from them.
 *
 * Variables live in wrangler.toml; secrets are set with `wrangler secret put`
 * and never committed. See worker/README.md.
 */
export interface Env {
  AI: Ai;
  DB: D1Database;
  VECTORS: VectorizeIndex;

  /** The published site, whose /ask/corpus.json is the assistant's knowledge. */
  SITE_URL: string;
  /** Comma-separated origins allowed to call the Worker; `*` matches one DNS label run. */
  ALLOWED_ORIGINS: string;
  /** Comma-separated `provider:model` list, tried in order. */
  MODELS: string;
  EMBEDDING_MODEL: string;
  NYO_BASE_URL: string;

  DAILY_TOKEN_CAP?: string;
  LIMIT_IP_PER_MIN?: string;
  LIMIT_IP_PER_DAY?: string;
  LIMIT_SESSION_MESSAGES?: string;
  LIMIT_GLOBAL_PER_MIN?: string;

  /** Secrets */
  SESSION_SECRET: string;
  NYO_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  ADMIN_TOKEN?: string;
}

const int = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function limits(env: Env) {
  return {
    dailyTokens: int(env.DAILY_TOKEN_CAP, 1_500_000),
    ipPerMinute: int(env.LIMIT_IP_PER_MIN, 8),
    ipPerDay: int(env.LIMIT_IP_PER_DAY, 80),
    sessionMessages: int(env.LIMIT_SESSION_MESSAGES, 40),
    globalPerMinute: int(env.LIMIT_GLOBAL_PER_MIN, 60),
  };
}
