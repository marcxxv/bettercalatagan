# Changelog

Tracks **data** changes as well as code. When a civic figure changes, the entry says which source
prompted it.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — A grounded assistant behind "Ask anything"
See `docs/adr/0008-grounded-assistant.md`. **No data changed.**
- **Ask, then search:** the home page box, the floating ask bar and the ⌘K dialog offer "Ask" as
  the first option; Enter opens a conversation that grows out of the box it was asked from.
  Instant search results stay beneath it. Answers stream in English, Filipino or Taglish, with
  numbered citations linking to the passage's page, a list of sources, and a copy button.
- **Knowledge from the pages themselves:** the build writes `/ask/corpus.json` (every page section
  and every sourced answer); a Cloudflare Worker indexes it for full-text and multilingual semantic
  search and re-indexes changed passages every 30 minutes.
- **Checked before shown:** figures must match the cited passages; unverified officials, withheld
  values, contact details and prompt leaks withdraw the answer. Office-holder and emergency
  questions get fixed answers. The guard's lists are tested against the CI leak checks.
- **Privacy:** no questions or answers stored; daily-rotating hashed rate limits; conversation kept
  in the tab only. About and Privacy copy updated to say what is sent where.

### Added — Data pipelines and project memory
- **Scheduled refresh** (`.github/workflows/refresh-data.yml`): every Monday, each source is
  re-read independently, the full check gates the result, and a pull request opens only when
  something substantive changed. The pull request body is a plain-language change report
  (`scripts/data-report.mjs`, also `npm run data:report`) that ignores retrieval timestamps and
  lists records added, removed and changed, field by field, plus each source's outcome.
- `npm run data:refresh` and `npm run archive:index` scripts; `docs/data-pipelines.md` runbook.
- **AGENTS.md** (with **CLAUDE.md** importing it, and `.github/copilot-instructions.md`): the
  project's working memory for AI agents and new contributors — non-negotiables, stack, data flow,
  UI system, reader, SEO, verification steps, gotchas and recipes.

### Added — Search and answer-engine visibility
- Every page now declares a `WebPage` tied to one publisher `Organization` (with logo) and the
  `WebSite`; `/data` is a `DataCatalog` of all five datasets and `/documents` a `Dataset`, so each
  export can surface in Google Dataset Search.
- Robots directives allow large image previews and full snippets; the 404 page is `noindex`; the
  reader's pass-through paths are excluded from crawling.
- **`/llms.txt`**: a plain-text guide for AI answer engines, generated from the same data modules as
  the pages, including the list of withheld facts so assistants do not fill those gaps from elsewhere.
  CI's withheld-value check now scans `.txt` output too.

### Added — Read documents on the site
See `docs/adr/0007-in-site-document-reader.md`. **No data changed.**
- **Reader:** every archived PDF (227) and DOCX, and every retrievable DILG filing (132 XLSX),
  now opens in a full-screen reader instead of sending readers off-site. PDFs render page by page
  with selectable text, page jump, zoom and keyboard shortcuts; spreadsheets keep their sheets,
  merged headers and the filing's own number formats; Word files keep headings, lists, tables and
  images. Download and "open the original" stay one click away.
- **Where:** `/documents`, `/government` (office documents), `/transparency` (every filing) and
  `/finances` (the source filing behind each period and year). A `?read=<id>` link opens a document
  directly.
- **How:** same-origin pass-through rewrites to the Internet Archive and the DILG portal
  (`vercel.json`); nothing is stored here. The four legacy `.doc` forms keep a download link.

### Fixed
- **Government page:** a missing space in "they are Citizen's Charter service standards".
- **Withheld list:** the entry saying no Full Disclosure Policy amount had been extracted was out of
  date since `/finances` publishes Statement of Receipts and Expenditures figures. It now covers only
  the 13 other FDP forms (142 filings), which remain indexed on `/transparency` and unextracted.

### Changed — Editorial, answer-first redesign
See `docs/adr/0006-editorial-redesign.md`. Modelled on America.gov's professionalism and on the
patterns shared across the Better LGU portals. **No data changed.**
- **New look:** near-white canvas, rounded panels, a high-contrast display serif (Source Serif 4
  with its optical-size axis) and Public Sans for interface; one navy accent; full dark mode with a
  light / dark / system switch. Every text pairing measured at WCAG 2.2 AA; axe-core clean on every
  page in both themes; no horizontal scroll at 320 px.
- **New emblem:** the Cape Santiago lighthouse on the cape, before the Philippine sun, drawn in
  the BetterGov.ph family style (`public/logo.svg`, `public/logo-mark.svg`). New favicon, Apple touch and web-app icons, `site.webmanifest`, and one Open Graph share
  image per section, all rendered by `scripts/brand.mjs`.
- **Ask anything:** "Kumusta, Calatagan" home page with a question box; a floating ask bar on
  every page; a ⌘K / Ctrl K search dialog. Facts answer inline with their source, from a
  build-time index (`/search.json`); questions about withheld facts are answered with the reason.
- **Home:** a carousel of scenes drawn from the data (the lighthouse, the barangays at census size,
  the year's income, the filings mosaic); a scroll-lit manifesto; feature rows; "at a glance"
  figures; a census column chart; a sortable, searchable barangay table with share-of-total bars
  and persons per household.
- **Finances:** a period switcher across all 14 quarterly statements, an income donut, animated
  sector bars, full-year and year-to-date charts, with the tables kept one click away.
- **Disclosures and Archive:** a form × year coverage heatmap whose cells filter the list; filters
  mirrored into the URL so a filtered view can be shared; removable filter pills.
- **Government, Sources, About, History:** sticky "On this page" rails with scroll-spy; a reading
  progress bar on the history; withheld facts shown as cards; a new Privacy section.
- **New pages:** `/data` (the open-data front door) and a 404 page.

### Added — History
- **`/history`** — Calatagan from the fifteenth-century burials at Kay Tomas and Pulong Bakaw,
  through the Roxas hacienda and the Cape Santiago lighthouse, to the 1903 merger into Balayan and
  the 1912 restoration. Held to the civic-data standard: every sentence is a claim that cites its
  sources and is marked *documented*, *attributed* or *disputed*, and a test enforces that a
  documented claim rests on a primary-grade source or two independent ones.
- Primary sources include Sastrón's *Batangas y su provincia* (1895), Act No. 958 (1903),
  Executive Order No. 78 (1911), *Republic v. Ayala y Cía.* (G.R. No. L-20950, 1965), the NHCP
  Cape Santiago marker (2018) and peer-reviewed archaeology (Fox 1959; Barretto-Tesoro 2003).
- **Stated, not smoothed over:** the reading of the Calatagan Pot inscription is disputed; the
  common "founded in 1912" is a restoration of an earlier municipality; and six widely repeated
  claims we could not trace to a primary record (the name's etymology, the 1829 and 1931 land
  transfers, the 1934 barrio transfer, the 1957 land purchase, the National Cultural Treasure date)
  are listed separately rather than retold.

### Changed — Design and identity
- A new design system (see `docs/adr/0005-design-system.md`): sand, limestone, reef teal, deep
  navy and earthenware clay; Source Serif 4 for headings and narrative; a lighthouse mark in a
  rounded square that cannot be mistaken for a seal. Every text pairing measured ≥ 4.5:1 in light
  and dark schemes.
- Navigation relabelled for newcomers — *Disclosures* for the Full Disclosure filings, *Archive* for
  the former website's documents — with the independence statement in the header of every page
  and a new `/about` page. URLs unchanged.
- Provenance redesigned: status, publisher, "data as of" and "verified" always visible beside the
  figure; caveats always visible; method and full source list one click away.
- Tables are labelled, keyboard-scrollable regions; record tables stack on phones; wide numeric
  tables pin their row labels.

### Added — Search and sharing
- Unique titles and descriptions, canonical URLs, Open Graph and Twitter cards, `sitemap.xml`
  (with `lastmod` from each page's verification date, never the build date), `robots.txt`,
  favicons, and JSON-LD: `WebSite`, `BreadcrumbList`, `Article` (history) and `Dataset` (census,
  finances, filings).

### Changed — post-launch cleanup
- **Removed the raw research audit** (`Calatagan Civic Data Audit.md`) from the repository. Several
  of its claims were shown by primary-source verification to be incorrect or unsupported. Passages
  elsewhere that restated those claims in order to rebut them were rewritten to state only the
  verified findings.
- **Baha, 2024: 83 persons, 0 household population, 0 households** — re-checked directly against
  PSA OpenSTAT table `PO_2024/0041A6DTPH3.px` and retained exactly as PSA publishes it. PSA's own
  definitions of total, household and institutional population are now captured from the table's
  metadata by the pipeline, exported with the data, and shown beside the figure. Per those
  definitions the 83 persons were enumerated outside private households; they account for all of
  Calatagan's non-household population, which a test asserts. PSA does not say which institutional
  quarters were involved, and the site does not speculate.
- Removed a hardcoded test count from the README, which had already drifted.

### Added — Phase 3: structured financial data (SRE)
- `/finances` — income, expenditure by sector, and a full-year series built from
  **14 quarters** of the Statement of Receipts and Expenditures, CY2023 Q1 – CY2026 Q2.
- **Every figure records the cell it came from** (e.g. `G24`), and the original filing stays
  authoritative. Line items are located by their label, never by row number.
- **Reconciliation is a publication gate.** Each filing's own identities — fund columns summing to
  the total, tax and non-tax revenue summing to local sources, sectoral lines summing to total
  expenditure — are recomputed. 828 checks across 14 quarters; all passed. A filing that did not
  reconcile would be withheld, not shown with a warning.
- `scripts/lib/xlsx.mjs` — a small dependency-free XLSX reader, cross-validated cell-for-cell
  against openpyxl (485 cells, 0 mismatches).
- `/data/financials.json` export, with the same licence split as the filing index.

### Changed — PSA census data promoted to tier 1
PSA's editorial pages return a bot challenge, but **PSA OpenSTAT**, its own statistical database,
answers normally and serves the same releases as data. That is a primary government source, so:
- 2024 population **60,420**, household population 60,337, households **15,442** — tier 1.
- Census series 2015 / 2020 / 2024 — tier 1.
- Barangay-level 2024 figures, reconciling exactly to the municipal totals — tier 1.
- Barangay names and PSGC codes, now confirmed against PSA's own geography — tier 1.
- Corrects a widely repeated household count of 14,267; PSA reports 15,442.

### Fixed — integrity fingerprint for FDP filings
The DILG portal regenerates each spreadsheet at request time, stamping the current clock into the
zip. Byte checksums therefore changed on all 133 records between two runs with no real change.
Integrity now uses a zip **content** fingerprint (entry name, CRC-32, size), verified stable across
regeneration and across a full second pipeline run.

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
- **Land area.** Circulating figures could not be confirmed from a PSA source.
- **2024 POPCEN population (60,420).** Held at tier 3: the only available citation is a PSA
  social-media post, and the PSA page of record is unreachable.
- **Current elected officials.** Election results are available from a civic-tech derivative, but
  results are not incumbency and no primary source has been read.
- **Municipal contact details.** Their source record (DTI CMCI profile block) has demonstrably
  stale income-class, mayor and website fields.

### Corrected — after primary-source verification
- Income classification corrected from 2nd to **1st class**, verified against the primary issuance.
- The earlier statement that municipal planning ceased after the CLUP 2001–2010 is **withdrawn**;
  later plans appear to exist, though only on third-party document hosts, so none is cited.
