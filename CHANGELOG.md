# Changelog

Tracks **data** changes as well as code. When a civic figure changes, the entry says which source
prompted it.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed — Lighter source cards
- **Source cards** (`Source.astro`) are now one quiet attribution block at reading width
  (46rem) instead of a full-width table: publisher and status on one line, the dates as one
  sentence ("Reported 30 September 2026, not yet confirmed · Updated quarterly"), the caveat inline
  with a small warning icon instead of a filled box, and "Method and sources" as a small toggle
  that now also holds the note. Free-text `asOf` values ("Executive orders in force") read as
  written instead of "Data as of …". Tier-2 caveats stay visible.

### Added — Credits
- **About → Credits:** names the site's design references (the BetterGov.ph family of Better LGU
  portals, whose emblem style ours follows, and America.gov's editorial layout), states that
  nothing was copied and that there is no affiliation, and lists the typefaces and PDF.js.

### Added — Local emergency hotlines
See `docs/adr/0010-local-hotlines-by-attestation.md`. MDRRMO (0909 456 5818, (043) 419 7510), PNP,
BFP, RHU, Coast Guard, Medicare and BATELEC numbers, from the municipality's emergency hotlines
poster, published at tier 2 on the maintainer's attestation. 911 stays first. The assistant's
emergency answer now gives the MDRRMO lines.

### Changed — Lists, menus and the name
- **One list pattern everywhere** (Services, Infrastructure, Procurement, Legislation, Archive,
  Disclosures, Holidays, barangay projects): a framed dataset with aligned columns, a column
  header that stays in view while scrolling, dense rows with two-line titles and icon actions,
  details on expand. DPWH rows lead with the work itself, not the programme boilerplate.
- **Tables** show every row (no scroll inside a scroll); their header row sticks to the page.
- **Filters** look the same on every page and in every browser (Safari drew native selects).
- **Navigation** menus open on hover with intent, and one surface glides and resizes between
  groups with the content sliding in from the direction of travel; keyboard and touch unchanged.
- **Services** topics redesigned as larger cards with a distinct icon each.
- The name is written **BetterCalatagan**, as one word.
- **Feel**: one soft highlight glides between items in menus, lists, table rows, rails and search results;
  text selection uses the accent; theme changes cross-fade; buttons and cards respond to presses;
  pages ease in. All of it is off under reduced motion.
- **Overview**: "Explore the public record" reorganised into "I want to…" shortcuts and plain
  topic groups; two new hero scenes (national infrastructure, municipal services); filing tiles
  no longer clip their labels.
- The Accessibility statement covers the carousel controls, hover-only highlights, sticky headings and voice input.
- The home carousel steps with the ← and → keys while it is on screen (not while typing).
- Office contact numbers are no longer listed as unproven: the municipality supplied them.

### Changed — The assistant knows where you are and what each record says
- Every archived document, DPWH contract and DILG filing is now its own passage in the
  assistant's knowledge, with every field the site shows (kind, date, file, capture, status,
  amounts, office, and what a maintainer found inside, if opened). A question about one record
  finds that record, not just the list it sits in.
- Questions carry the page they were asked from and the document open in the reader, so "what is
  this document?" or "explain this page" are answered about that page. Only bound parameters and
  the corpus's own titles reach the model.

### Added — The barangays on a 3D map
- `/barangays` opens with an interactive map: the 25 barangays raised in 3D by population,
  households or DPWH projects over the terrain, with hover figures, a card for the selected
  barangay, and a link to its profile. It is drawn in the site's own colours, light and dark.
- Below it, every barangay in one ranked list (sortable by population, households, projects or
  name) that highlights its barangay on the map, replacing the grid of cards.
- Outlines come from an open PSGC-coded dataset via `scripts/boundaries.mjs` (checked against
  PSA's 25 codes, area fields dropped), published at tier 2 as approximate. New ADR 0011: MapLibre
  is bundled and lazy-loaded; basemap tiles (OpenFreeMap) and terrain (AWS) are the site's only
  third-party requests, on this page only, and the privacy notice says so. Without JavaScript or
  WebGL the page shows a server-drawn outline map instead. `/data/barangays.geojson` publishes
  the joined data.
- Source chips that sat together now share one chip, naming every publisher.

### Added — Poverty in Batangas (PSA)
- Statistics shows PSA's full-year poverty incidence and threshold for the province of Batangas,
  with PSA's 95% intervals and the Region IV-A figure, for 2018, 2021 and 2023
  (`scripts/poverty.mjs`, PSA OpenSTAT; new `npm run poverty:fetch`, in the weekly refresh).
  Calatagan's own poverty estimate is published only on psa.gov.ph, which is unreachable, so
  it stays withheld and the reason now says so.
- Checked and recorded in SOURCES.md, not added: DBM's per-LGU NTA (its report server refused
  connections; LBM No. 92B has regional totals only) and PhilGEPS (search needs a session; the
  open data API needs an account behind reCAPTCHA).

### Added — What each competitiveness pillar is made of
- Statistics now lists Calatagan's rank and score on all 50 CMCI indicators for 2024 (ten per
  pillar), from DTI's LGU profile page. `scripts/cmci.mjs` places the breakdown in the ranking year
  whose pillar totals it reproduces exactly, and drops a stray row DTI's page repeats under every
  pillar. The profile's contact block is still not read.

### Changed — Source cards
- Every source is now a small chip (publisher, verified date, status dot) that opens in place to
  the status, dates, note, method and every source. Tier 2 caveats stay visible on the chip as
  one line, in full once opened.

### Security and privacy
- The document reader's `/wayback/` pass-through now serves only captures of calatagan.gov.ph,
  and its responses carry a sandboxing Content-Security-Policy, so the site's address cannot be
  used to show arbitrary archived pages.
- Assistant Worker: the admin token is compared in constant time, sync errors are no longer
  echoed, and request bodies over 64 KB are refused before parsing.
- The privacy notice now says what actually happens: providers process questions outside the
  Philippines, the host and Cloudflare keep short-lived request logs, voice input uses the
  browser's speech service, and requests to remove personal information come down first.
- Wording: the officials section says this project could not obtain the records (not that
  agencies failed to publish them); the DTI profile note no longer calls its contact fields out
  of date. Five new assistant eval cases cover loaded questions (hiding, fraud, addresses).
- `worker/README.md` documents how to switch the assistant off and rotate secrets.

### Fixed
- History: the contents rail stuck under the masthead ("Chapters" hidden when scrolling).

### Added — The Better LGU structure, sourced
See `docs/adr/0009-better-lgu-information-architecture.md`. The hero is unchanged.
- **Navigation** grouped as the Better LGU portals group theirs: Services · Government ·
  Statistics · Transparency · About, as dropdowns that open on hover, click or keyboard; grouped
  mobile menu; footer directory with the BetterGov.ph network and national government sources.
- **Services** (`/services`): 119 services from 18 offices' 2022 Citizen's Charters (archived),
  by topic, each opening its dated charter. Fees and times are not restated.
- **Infrastructure** (`/infrastructure`): 179 DPWH projects located in Calatagan, 2016–2026,
  ₱1.83 billion in contract budgets, with contractor, bidders, ABC, dates and barangay; 51
  national-road segments and 2 multi-town packages listed but not counted. Source: DPWH via the
  BetterGov.ph DPWH API (`npm run dpwh:fetch`).
- **Statistics** (`/statistics`): census, income class and finances in one place, and DTI's
  Competitiveness Index 2015–2024 (340th of 509 1st–2nd class municipalities in 2024; source:
  DTI CMCI ranking tables, `npm run cmci:fetch`).
- **Barangays** (`/barangays`, 25 profiles), **Legislation** (`/legislation`), **Procurement**
  (`/procurement`), **Holidays** (`/holidays`: Proclamations 1006, 1189, 1264; Calatagan's own
  Cultural Day, Proclamation 1220, and founding anniversary, 1102 and 1050), **Hotlines**
  (`/hotlines`: 911 by EO 56 s. 2018, 8888 by EO 6 s. 2016), **Accessibility**, **Sitemap**.
- Open data: `infrastructure.json`, `competitiveness.json`, `services.json`, `holidays.json`.

### Fixed
- **Missing spaces site-wide** before links and emphasis ("on theFinances", "Sources" glued to
  the word before it on About, Finances, Government, Disclosures and the home page): Astro's HTML
  compression dropped them; it is now off.
- **Header on phones** overflowed the right edge by 17 px at 375 px wide.
- **`ordinal()`** printed "321th"; now correct for every number.
- **Duplicate search landmark label** on the home page (hero box and floating bar).

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
