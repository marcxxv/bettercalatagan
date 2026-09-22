# 0001 — Provenance travels with every civic fact

**Status:** Accepted · 2026-09-22

## Context

Better Calatagan publishes information about a real municipality. The usual civic-portal pattern —
a JSON file of values with a "last updated" date on the footer — cannot answer the two questions a
resident actually has: *where did this come from* and *how current is it*.

A survey of five Better LGU implementations found provenance to be the ecosystem's weakest area.
One project (Better Calapan) had a genuine `DataSource` type and tests over it; most had a
scattering of `sourceUrl` fields; the ecosystem's default starter kit had essentially none, and
shipped template prose that invents biography for whoever is pasted into a `{MAYOR}` placeholder.

We also had a concrete demonstration of the failure mode. During reconciliation of an independent
audit, a per-barangay population table presented with confidence turned out to sum to 60,929
against a stated municipal total of 58,719 — a fabrication that a single reconciliation rule
catches instantly.

## Decision

Every civic record is a `Sourced<T>`: data plus a `DataSource` envelope carrying sources,
`asOf`, `lastVerified`, `verification`, `status`, `tier`, and `expectedRefresh`.

The rules are enforced by Zod schemas and by `civic-data.test.ts`, which includes negative tests
asserting that the guardrails fail when they should. Provenance is a build-time constraint, not a
convention.

Distinctions we hold deliberately:

- `asOf` (what period the data describes) is **not** `lastVerified` (when a human last checked).
- **No global age-based staleness rule.** `status` says what a record *is*. A census two years
  past its reference date is `latest-official`, not stale; a contact number checked last month may
  already be wrong.
- Readiness **tiers** gate publication. Tier 1 must be `verified`; tier 2 must carry a reader-facing
  `caveat`; tiers 3 and 4 never render or export.

## Consequences

Adding a fact is more work, deliberately. Some true facts stay unpublished — the 2024 population
count sits at tier 3 because its only citation is a social-media post. That is the system working.

The upside is auditability: a reviewer can trace any published number to a document, and can see
the shape of what is missing.
