# Changelog

Tracks **data** changes as well as code. When a civic figure changes, the entry says which source
prompted it.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Phase 2: DILG Full Disclosure Policy filing index
- `/transparency` — an index of **156 filings** across all **14 statutory forms**, CY2022–CY2026,
  filterable by year, quarter, form type and availability, with keyboard-accessible controls and a
  no-JavaScript fallback that lists everything. 133 filings download cleanly; 23 DILG endpoints
  return HTTP 500 and are listed with their metadata rather than dropped.
- `scripts/fdp.mjs` — a stage → review → promote pipeline. A failed download never overwrites a
  previously good checksum, a filing that vanishes from the listing is retained and flagged, and a
  resubmission is recorded under the same local id. Retries 5xx with exponential backoff.
- **Local canonical ids** (`fdp-2026-q2-bid-results`) derived from form type and document period,
  because the DILG portal reassigns its numeric ids when an LGU resubmits a filing.
- `/data/fdp-filings.json` — machine-readable export with an explicit licence split: our
  compilation is CC BY 4.0, the DILG documents it points at are **not** relicensed.
- `docs/adr/0004-fdp-stage-review-promote.md`.
- `certs/` — the intermediate certificate the DILG server omits, so the pipeline verifies TLS
  properly instead of skipping verification.

### Changed — readiness tiers lowered after review
PSA itself is unreachable to this project, so data that merely restates PSA is no longer treated
as verified:
- **Municipal identity / PSGC**: tier 1 → **tier 2**. Community mirrors are not PSA.
- **Barangay list and codes**: tier 1 → **tier 2**, same reason.
- **2020 CPH municipal population**: tier 1 → **tier 2**, same reason.
- **2020 CPH barangay populations**: tier 1 → **tier 3, no longer published**. The set reconciles
  exactly to the municipal total, but arithmetic consistency between two derived sources is not
  primary verification, and one value (Baha, 6 residents) is extreme enough that publishing it on
  secondary evidence would risk repeating an error rather than a fact.

### Added — project foundations
- Astro + TypeScript static scaffold; no backend, database, CMS, authentication or analytics.
- Provenance type system (`DataSource`, `SourceReference`, readiness tiers, verification status,
  `asOf` / `lastVerified` / `expectedRefresh` / `isLatestKnownOfficial`).
- Zod schemas enforcing the provenance and PSGC rules at build time.
- 77 civic-data tests, including negative tests that assert the guardrails actually fail.
- Independent-project disclaimer on every page; Sources page listing evidence, tiers and gaps.

### Added — civic data (Phase 1)
- **Municipal identity and PSGC** — `0401008000` / `041008000`, 25 barangays.
  Source: two independent PSA-derived PSGC mirrors, in exact agreement.
- **Income classification: 1st class, effective 2025-01-01** (from 2nd class).
  Source: BLGF Memorandum Circular No. 020.2024, Annex A, p.13 of 32, read directly; transmitting
  DOF Department Order No. 074.2024 under R.A. No. 11964.
- **25 barangays with PSGC codes**, preserving the real non-sequential codes (012, 024 and 025 are
  unassigned within Calatagan).
- **2020 CPH population: 58,719**, and the barangay-level breakdown, which reconciles to that
  total exactly.

### Withheld — deliberately not published
- **Land area.** 101.50 km² (PhilAtlas, 2013 figure) and 112.00 km² both circulate and cannot be
  reconciled; neither confirmed from a PSA page.
- **2024 POPCEN population (60,420).** Held at tier 3: the only available citation is a PSA
  social-media post, and the PSA page of record is unreachable.
- **Current elected officials.** Election results are available from a civic-tech derivative, but
  results are not incumbency and no primary source has been read.
- **Municipal contact details.** Their source record (DTI CMCI profile block) has demonstrably
  stale income-class, mayor and website fields.

### Corrected — from the September 2026 audit reconciliation
- Income classification corrected from 2nd to **1st class**, verified against the primary issuance.
- The earlier statement that municipal planning ceased after the CLUP 2001–2010 is **withdrawn**;
  later plans appear to exist, though only on third-party document hosts, so none is cited.
