# 0008 — A grounded assistant behind the ask boxes

**Status:** Accepted · 2026-09-30 · Revisits [0002](0002-static-astro-no-backend.md) (no backend, no AI)
and extends [0006](0006-editorial-redesign.md) (answer-first search)

## Context

ADR 0002 ruled out a backend and AI, and said that genuinely dynamic behaviour should be decided
in a new ADR rather than eroded. The “Ask anything” boxes from 0006 invite questions the
deterministic index cannot answer: phrased questions, follow-ups, Filipino and Taglish. Residents
ask the way they speak.

The risk is the one this project exists to avoid: a confident answer that is not in the record.
A general chatbot will state a mayor’s name, a land area or a budget total from its training data.

## Decision

**An assistant that can only repeat the site, and is checked in code before it is shown.**

- **Knowledge is the built site.** An Astro integration (`scripts/lib/ask-corpus.mjs`) splits every
  rendered page into passages at its sections, with deep links, and adds the sourced one-line
  answers from `/search.json`. It writes `/ask/corpus.json`. Nothing is written a second time for
  the assistant, so it cannot know more than a reader can see. Hidden regions a reader reveals
  (one quarter’s statement) are included when marked `data-ask-label`; decoration is not.
- **Retrieval-augmented generation**, in a Cloudflare Worker (`worker/`): full-text search (D1
  FTS5, BM25) and multilingual embeddings (bge-m3 in Vectorize), fused by reciprocal rank, at most
  two passages per section. The Worker re-reads the corpus every 30 minutes and re-embeds only
  what changed, so a redeployed site is reflected without anyone touching the Worker. A corpus
  that suddenly loses half its passages is refused as a broken build.
- **Models:** NYO’s `glm-5.3` (then `glm-5.3-flash`), with Cloudflare Workers AI as a keyless
  fallback: AI Singapore’s SEA-LION v4 (tuned for Southeast Asian languages, which is why
  Filipino questions get Filipino answers), then `gpt-oss-120b`. Chosen by running the evaluation
  set against each; `glm-5.3` on Workers AI needs a paid plan this project does not have.
- **Checks in code, not in the prompt alone.** Every figure in an answer must round from a figure
  in the passages it was given (`worker/src/numbers.ts`). Answers naming an official whose
  incumbency is unverified, a withheld value, a phone number, an e-mail address or the prompt’s
  canary are withdrawn and replaced. The names and withheld values are the same lists the CI leak
  checks use, and a test fails if they drift apart. Questions about who holds office and
  emergencies never reach the model.
- **Streaming, but never unchecked.** The guard holds back the last words of the stream (and any
  number until its scale word arrives), so nothing is shown before it is checked.
- **Private by construction.** No questions or answers are stored. Rate limits count a daily-salted
  hash of the IP address; rows expire. The conversation lives in the reader’s tab
  (`sessionStorage`) and nowhere else. Turnstile is supported but off unless configured.
- **Off unless configured.** The site renders the assistant only when `PUBLIC_ASK_ENDPOINT` is set
  at build time. Without it, the ask boxes are the instant search they were, and search stays
  beneath the “Ask” option either way.

## Consequences

- The site now has a backend, a database and a model provider. They sit beside the static site,
  not under it: every page still builds, renders and works without them, and the published data
  still cannot change beneath a citation.
- The privacy page no longer says typed text is never sent anywhere: a question *asked* of the
  assistant goes to the Worker and the model provider. Search typing still stays in the browser.
- Cost is bounded by per-IP, per-session and global limits and a daily token cap; beyond them the
  assistant says it is resting and search keeps working.
- `worker/eval/cases.json` is the regression set (facts, finance, history, withheld items,
  officials, contacts, prompt injection, off-topic, fabrication bait, Filipino, follow-ups). Run it
  after changing the prompt, the models or the guard.
