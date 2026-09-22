# 0002 — Astro, static output, no backend

**Status:** Accepted · 2026-09-22

## Context

The datasets here are small — 25 barangays, a few hundred document records at full build-out. The
audience is largely on mobile connections. The maintainer count is one. The project must remain
auditable by a stranger years from now.

Ecosystem precedent is mixed: the default starter kit is React + Vite + Tailwind + Meilisearch;
one mature portal (Better Los Baños) runs Cloudflare D1 with SQL migrations, a scraping pipeline
and a 850 MB repository.

## Decision

**Astro, TypeScript, static output.** No backend, database, CMS, authentication, analytics,
search service or AI.

Astro ships zero JavaScript by default, which suits a document-heavy, near-static site and keeps
payloads small on poor connections. Data lives in typed TypeScript modules validated by Zod at
build time, so a malformed record fails the build rather than reaching a reader.

Tailwind was considered and **not** adopted: the shell is small enough that plain CSS with custom
properties is less machinery for the same result, and one fewer dependency to audit.

Client-side search (fuse.js over a prebuilt index) is the intended approach when search is needed.
Not yet, because there is not yet enough to search.

## Consequences

We forgo Kapwa, the BetterGov React design system — a real cost in visual consistency with the
wider ecosystem, accepted in exchange for the above. Machine consumers are served by static JSON
exports rather than a live API, which also means published data cannot silently change beneath a
citation.

If the project later needs genuinely dynamic behaviour, this decision should be revisited in a new
ADR rather than eroded.
