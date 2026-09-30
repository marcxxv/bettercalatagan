/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** The assistant's Worker, e.g. https://bettercalatagan-ask.<account>.workers.dev. Unset: no assistant. */
  readonly PUBLIC_ASK_ENDPOINT?: string;
  /** Cloudflare Turnstile site key, if the Worker requires a Turnstile check. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
