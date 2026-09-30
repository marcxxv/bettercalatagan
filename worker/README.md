# The Better Calatagan assistant (Cloudflare Worker)

Answers questions from the site’s own published pages, with citations. Design and reasoning:
[ADR 0007](../docs/adr/0008-grounded-assistant.md).

```
Browser ──POST /session──▶ Worker ──▶ signed session token (Turnstile first, if configured)
        ──POST /chat─────▶ Worker: screen → retrieve (D1 FTS5 + Vectorize) → model → guard → NDJSON
Cron (every 30 min) ─────▶ fetch SITE_URL/ask/corpus.json → re-embed changed passages
```

| File | Purpose |
| --- | --- |
| `src/index.ts` | Routes: `GET /health`, `POST /session`, `POST /chat`, `POST /admin/sync`; cron |
| `src/chat.ts` | One question, end to end; withdraws answers the guard rejects |
| `src/retrieve.ts` | Hybrid retrieval and reciprocal-rank fusion; Filipino glosses |
| `src/corpus.ts` | Syncing the index with the published corpus |
| `src/prompt.ts` | The instructions (no backticks inside the prompt text) |
| `src/model.ts` | Model chain: NYO first, Workers AI fallback |
| `src/guard.ts`, `src/numbers.ts` | Input screening, fixed answers, the streaming output guard, numeric grounding |
| `src/limits.ts`, `src/session.ts` | Rate limits, token budget, session tokens, Turnstile |
| `schema.sql` | D1 tables (no questions or answers are stored) |
| `eval/` | Regression questions and the runner |

## Resources (account “Primary”)

- Worker `bettercalatagan-ask`, D1 `bettercalatagan-ask`, Vectorize `bettercalatagan-ask`
  (1024 dimensions, cosine). Separate from every other project on the account.
- Secrets: `SESSION_SECRET`, `ADMIN_TOKEN` (set), `NYO_API_KEY` (set it yourself, below),
  optionally `TURNSTILE_SECRET`.

## Operations

```bash
cd worker && npm install
npx wrangler secret put NYO_API_KEY          # paste the rk_live_ key at the prompt
npx wrangler deploy                          # after changing code or wrangler.toml
npx wrangler tail                            # live logs (no question text is logged)
curl https://bettercalatagan-ask.<subdomain>.workers.dev/health
```

Force a re-index now instead of waiting for the cron (the token is in `worker/.secrets.local`):

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" https://…workers.dev/admin/sync
```

Run the evaluation set (Turnstile must be off, or use Cloudflare’s test keys):

```bash
node eval/run.mjs --url https://…workers.dev --origin https://bettercalatagan.vercel.app
node eval/run.mjs --ask "Ilan ang barangay sa Calatagan?"
```

Local development: `npx wrangler dev --port 8787` (Vectorize and Workers AI are always remote),
the site with `PUBLIC_ASK_ENDPOINT=http://localhost:8787` in `.env`, and `.dev.vars` holding
`SESSION_SECRET`, `ADMIN_TOKEN`, `SITE_URL=http://localhost:4321` and
`ALLOWED_ORIGINS=http://localhost:4321`. The first time, apply the schema with
`npx wrangler d1 execute bettercalatagan-ask --local --file schema.sql`.

## Emergencies

- **Switch the assistant off:** set `MODELS = ""` in `wrangler.toml` and `npx wrangler deploy`.
  Every question then gets the "can't answer right now" reply with the closest pages; search is
  unaffected. For a full stop, unset `PUBLIC_ASK_ENDPOINT` in Vercel and redeploy the site.
- **Abuse:** lower `LIMIT_GLOBAL_PER_MIN`, or rotate `SESSION_SECRET`
  (`npx wrangler secret put SESSION_SECRET`), which ends every open session.
- **A leaked secret:** rotate it with `wrangler secret put`; `ADMIN_TOKEN`, `SESSION_SECRET`,
  `NYO_API_KEY` and `TURNSTILE_SECRET` are independent of one another.
- **A bad answer:** add it to `eval/cases.json`, tighten `guard.ts` or `prompt.ts`, redeploy, and
  re-run the eval.

## Tuning

`wrangler.toml` `[vars]`: `MODELS` (order of `provider:model`), `DAILY_TOKEN_CAP`,
`LIMIT_IP_PER_MIN`, `LIMIT_IP_PER_DAY`, `LIMIT_SESSION_MESSAGES`, `LIMIT_GLOBAL_PER_MIN` (NYO allows
100 requests a minute per account, shared across keys), `ALLOWED_ORIGINS` (add a custom domain
here when one is bought).

## Turnstile (optional)

Cloudflare dashboard → Turnstile → Add widget, mode **Managed**, hostname
`bettercalatagan.vercel.app` (and any custom domain). Then `npx wrangler secret put TURNSTILE_SECRET`
and set `PUBLIC_TURNSTILE_SITE_KEY` in Vercel, and redeploy the site. Automated browsers fail
Turnstile, so check it in a normal browser.
