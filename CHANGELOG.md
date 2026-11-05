# Changelog

Tracks **data** changes as well as code. When a civic figure changes, the entry says which source
prompted it.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Ask about a document, beside the document
- The reader has “Ask about this document”: the assistant opens in a sidebar beside the document (a bottom
  sheet on narrow screens), with document-specific suggestions. Hiding it keeps the conversation and
  returns the full-width document; closing the reader returns the conversation to its usual panel. A
  citation of the open document turns the reader to that page, and a link to a page of another document
  (`?read=<id>#page=<n>`) opens it at that page.
- The assistant can now answer from what archived documents say: `scripts/document-text.mjs` extracted the
  text layer of 63 archived PDFs (678 pages) from the Internet Archive into `document-text.json`, published
  as page-linked passages. 127 are scanned images with no text and are described as such; 19 were withheld
  whole. Pages naming unverified officials or carrying contact details are dropped, and personal names
  are replaced with “[name withheld]” (`scripts/lib/withheld.mjs`, tested to match the guard's lists).
  With a document open, the assistant reads that document's matching pages first. See ADR 0015.

### Changed — Disclosure grid opens filings directly
- In “What was filed, and when”, a cell with one filing opens it in the reader; a cell with several opens a
  small menu of them (unavailable ones marked), each opening in the reader, with “Show in the list below”
  for the previous filter. The page no longer jumps to the list on every click.

### Changed — Charts: steady labels, toggleable series; agency marks back to circles
- Chart labels stay about 12–13 px on any screen; they had scaled with the chart, growing large on wide
  pages and tiny on phones. A year with no figure (DPWH 2026 budgets) shows a dash instead of a gap.
- Multi-series charts (income and spending, year-to-date lines) toggle a series from the legend, with a
  fade; at least one series always stays visible.
- Agency logos are plain white circles again everywhere; the documentation now says so.

### Changed — Flat colours instead of decorative gradients
- Removed decorative gradients: page header panels, home feature tiles and panels, the 404 panel,
  the header contour glow, and the bars on Finances and Documents now use flat theme colours. Several
  home tiles used fixed light colours and now follow dark mode. Gradients that carry meaning stay:
  the map's colour scale and the disclosure progress ring.

### Added — Interactive infrastructure map
- The infrastructure page has a 3D barangay map of DPWH projects: barangays rise by all projects, by
  total contract budget, or by one type of work (flood control, roads, bridges, water, buildings). The
  hover tip and the selected barangay's card follow the chosen type, each contract linking to its row.
  Without JavaScript the map is an outline shaded by project count, each barangay linking to its
  filtered list. (`BarangayMap mode="works"`; per-barangay `budget` and `k_<kind>` counts in
  `/data/barangays.geojson`.)
- Every project row that names a barangay has “Show on map”: the map flies to it, lights every
  barangay the contract names, and opens the card with that contract marked first. The 3 contracts
  whose DPWH description gives GPS coordinates show “Show exact spot” and drop a pin labelled
  “DPWH-reported location”.

### Fixed — Document reader and archived titles
- The reader now retries when the Internet Archive is slow or briefly fails (it can take over a minute
  to serve a file it has not served lately), says so while it waits, and loads PDFs through that same
  retrying download. Reader links use the host's single-slash form, saving a redirect before each fetch.
- After closing the reader with a mouse or touch, the link that opened it no longer shows a focus ring;
  after a keyboard close the ring stays, as keyboard users need it.
- Archived document titles are separated where the municipality's filenames ran words together
  (“OFFICE OFTHE MUNICIPAL AGRICULTURE” → “OFFICE OF THE MUNICIPAL AGRICULTURE”, “UlatSaBayan” →
  “Ulat Sa Bayan”, “Mar 272018” → “Mar 27 2018”) by `scripts/lib/doc-title.mjs` (tested); the original
  filenames are unchanged.

### Security — Dependencies patched and kept patched
- Cleared all 28 Dependabot advisories: in-range updates (undici, vite, fast-uri, @vitest/mocker), Zod 3 →
  4 (schema code adjusted for `z.record`), the linter's minimatch pinned to 11, and wrangler 4.157 in the
  assistant worker. `npm audit` reports 0 for the site and the worker.
- To stop them accumulating: a CI job fails on any advisory (every push, and weekly without one), and
  Dependabot opens grouped weekly update PRs for both packages and the GitHub Actions.
- Added `scripts/local-dilg-refresh.sh` for refreshing DILG from a Philippine connection.
- Applied the routine updates Dependabot proposed (Astro 7.4, MapLibre 6.16, PDF.js 6.5, GitHub Actions
  checkout/setup-node v7, create-pull-request v8). Dependabot no longer proposes major versions, which
  need a hand migration; security updates still arrive.

### Added — Offices of government
- The Government page lists Calatagan's offices as the Local Government Code (RA 7160, read from the
  Official Gazette's copy) creates them: Municipal Mayor, Vice-Mayor and the Sangguniang Bayan; and in each
  of the 25 barangays a Punong Barangay, seven Kagawad, the SK chair, a secretary and a treasurer (25,
  175, 25 and 50 seats), with each office's duties, section references and the three-term limit. No
  officeholder is named: incumbency is still withheld, and the page now says why campaign lists of
  barangay officials are not used as evidence.
- Barangay profiles show their DPWH projects by type of work (each a link to the filtered list), with
  type icons, status colours and progress bars, matching the infrastructure page.
- Added the Presidential Communications Office logo for holiday proclamations.
- The footer shows both “Sources re-read” (the latest automated retrieval) and “Last reviewed by a
  person”, so a reader can see the data is current without the review date being advanced.
- The five “at a glance” figures on the home page each open their detail (population, households by
  barangay, all barangays, income class, disclosures), lifting on hover.
- Holiday proclamation links fit on one line.
- “Contract details” and “View as a table” panels open and close smoothly (where the browser supports it).

### Changed — Source cards
- Source chips are now cards instead of pale pills: the publishing agency's logo, its name, the human
  review date and, when the pipeline has re-read the source since, “Re-read from source <date>”. The
  caveat always shows in full and wraps (it was cut to one line), and the card opens smoothly to the
  method and a list of references, each with its agency's mark.
- Added the DPWH, DTI and Supreme Court logos (Wikimedia Commons; origins in
  `public/agencies/README.md`); agency marks are plain white circles everywhere (corrected the same day after a brief switch to rounded squares). The home
  page's “Scattered records” cards show each agency's mark.
- PSA OpenSTAT references record the pipeline's retrieval date as `accessedOn` (the tables are opened on
  every refresh), so census cards show when PSA was last read. `lastVerified` is unchanged.

### Added — Infrastructure by type of work, and a richer map card
- Infrastructure: “What the contracts build” tiles (roads, buildings, flood control and drainage,
  bridges, water and sanitation) with counts, budgets and bars; selecting one filters the list. The
  list filters by type of work instead of DPWH's mixed category/funding labels, each row carries a type
  icon, and ongoing contracts show a progress bar. Types are read from each contract's description
  (`lib/project-kind.ts`, tested); DPWH's category stays on every row.
- Barangay map: selecting a barangay now shows its projects by type (each a link to that filtered list)
  and its newest contracts with status, budget and progress, each linking to the full contract.

### Data — Refresh of 5 November 2026 (DPWH, DILG)
- DPWH (via the DPWH infrastructure transparency data): two new Nasugbu–Lian–Calatagan Road
  contracts for procurement (26DB0221, ₱48.0M ABC; 26DB0475, ₱2.3M ABC); 26DB0036 awarded to LLEB
  Construction and Trading (₱15.3M, 5.3% complete, started 1 September 2026); 25DB0160, the Brgy.
  Talisay multi-purpose building, now completed (18 January 2026); 25DB0052 lists four bidders.
- DILG Full Disclosure Policy Portal: the 2023 Annual Procurement Plan, previously a source error,
  now downloads (XLSX). All 156 filings re-read; 14 SREs still reconcile. Other datasets unchanged.
- `lastVerified` dates are unchanged: they record a person's review, not a retrieval. What was re-read
  from primary sources on 5 November (census matched PSA OpenSTAT exactly; BLGF blocked automated
  access) is in `docs/audits/2026-11-05-data-check.md`.

### Fixed — Weekly data refresh
- The refresh now ends red when any source fails, so a failure is noticed, and when GitHub will not let
  it open the review pull request it opens a “Data refresh ready for review” issue with the report and a
  one-click link instead. The source table also lists PSA poverty.
- Found that the DILG portal now times out from outside the Philippines (GitHub's runners and a
  Singapore server), so the weekly run cannot refresh DILG filings; documented the local refresh in
  `docs/data-pipelines.md`. Connection retries now back off for up to about 75 seconds.
- DILG moved its certificate to GlobalSign GCC R46 OV TLS CA 2025, so every DILG step had failed
  since mid-October. Added that intermediate (from GlobalSign's published AIA URL, verified to chain
  to GlobalSign Root R46) beside the old one in `certs/dilg-intermediates.pem`; TLS verification
  stays on. The workflow also cannot open its review PR until the repository allows GitHub Actions
  to create pull requests (Settings → Actions → General).

### Changed — Seal as a turning 3D medallion
- The overview seal is now a real three-dimensional gold medallion (three.js) that turns on its
  own, slowly — one turn every 24 seconds — with no buttons. It can be dragged, and slows while the
  pointer rests on it so the lettering can be read. three.js (about 550 kB, ~140 kB compressed)
  loads only when the seal is about to scroll into view; without JavaScript or WebGL, and under
  reduced motion, the same seal shows as a still image. The face artwork is unchanged.

### Changed — Official agency marks
- The PSA, DILG, BLGF, DOF, NHCP and Internet Archive badges now show each agency's own logo
  instead of initials. The frame is a plain white circle with a hairline edge, so it presents
  the agency's artwork rather than imitating a seal — the old gold ring is gone. Files and where
  each came from are recorded in `public/agencies/README.md`; the home manifesto row no longer
  overlaps the marks, and the reader’s other-source chip uses the same circle.

### Added — Home hero scene dots and a history beam
- The home hero’s six scenes now carry a small position indicator: one dot per scene, the active
  one widening into an accent pill, and clicking a dot jumps to that scene (keyboard accessible,
  hidden without JavaScript). The history page’s header takes the same slow lighthouse-beam sweep
  the not-found page uses, which suits the Cape Santiago story.

### Changed — Explicit light and dark themes
- Removed the “system” theme option: the site now has two modes, light (the default) and dark,
  chosen with the header toggle and remembered in the browser. It no longer follows
  `prefers-color-scheme`, so dark styles live in one `:root[data-theme='dark']` block instead of
  two, the map retheme listener and one page-level media override are gone, and `theme-color`
  follows the chosen theme (ADR 0014, amending 0006).

### Fixed — Highlight colour on menus in dark mode
- Menu, dialog and popover highlights used the page-level accent wash, which is nearly the same
  value as the panel it sat on in dark mode, so hovering a navy Services ▾ item or the selected
  search result barely showed. Added `--c-wash-raised` and `--c-sunk-raised` for content on a
  raised surface and used them for the menu hover, the current-page item and its icon chip, the
  “how to tell” icon, the selected search result and the assistant’s mark and source cards. Light
  mode is unchanged.

### Changed — Resort directory naming
- Renamed the resort entry in the Services navigation, the page itself and the overview to
  “Resort directory” (from “Resorts & booking tips”), keeping the original safety shield in
  navigation, the overview shortcut and the page heading, so the label reads as a checked listing
  of resort-published links rather than booking advice. Aligned the page title, metadata,
  cross-references, the data catalogue and llms.txt; safety guidance and evidence are unchanged.

### Changed — Pre-publication hardening
- Aligned independence copy with the retained historical seal; corrected privacy descriptions
  for the separate assistant database, request counts, browser storage, providers and maps.
- Qualified DPWH/disclosure coverage and bidder interpretations; attributed extracted financial
  and DPWH compilations to BetterCalatagan while retaining original source-agency credits.
- Shared the Valley O’Ville operational-affiliation disclosure between the resort guide and JSON;
  documented the missing private reporting inbox without publishing a placeholder.
- Kept existing review dates as literals so automated retrieval never advances human verification.
- Buffered complete assistant answers before release; excluded user messages from numeric
  grounding, checked counts, signs, peso markers and citation numbers, screened accusation requests, and removed
  provider bodies and rejected values from answer/error logs. See ADR 0013 for limits.
- Corrected the narrow-screen menu label, source-chip wrapping and barangay-link target sizes; made the JSON example keyboard-scrollable
  and prevented hidden map controls from receiving focus while retaining accessible SVG links.
- Added a minimal page CSP and sandboxed FDP responses while retaining bounded reader rewrites.
- Applied compatible dependency security updates; remaining advisory findings and validation
  are recorded in `docs/audits/2026-10-11-report.md`.

### Changed — Seal depth and finish
- Kept the existing face artwork unchanged and gave the rotating seal a substantial gold body:
  a 64-panel sidewall, capped faces and metallic bevel lighting. Increased its display size and
  slowed its automatic turn to 24 seconds; reduced-motion still shows a static seal.

### Added — Calatagan seal illustration
- Added the maintainer-supplied seal as a captioned dimensional rendition beside the overview
  history section. It rotates automatically left to right with readable identical front and back
  faces and a static reduced-motion fallback. A self-contained SVG embeds optimised
  transparent raster artwork; no new runtime dependency or external request is required.


### Changed — Search and resort discovery
- Added an in-page search for resort names, barangays, domains and published channel types, with
  live counts, shareable query URLs, clear and no-results states. The existing dataset and barangay
  filters now match accents and punctuation consistently; results ease into view across filters and
  site-search suggestions, while reduced-motion preferences disable those effects.

### Changed — Resort links and overview map
- Facebook and Instagram resort links use the current complete logos from Meta’s brand asset packs;
  TikTok and Airbnb use the icon files supplied for this update. All four have screen-reader labels
  but no redundant visible platform names. Website actions and the Website heading align centrally.
- Removed standalone resort-row notes; material conflicts and scope limits remain inside each
  entry’s expandable evidence. The overview reuses the interactive barangay map in a collapsible
  panel beside the 25-barangay table, with the SVG fallback intact.

### Added — Resort-published channels and booking safety
- `/resorts` lists six Calatagan resorts with dated website/social-link observations, per-entry
  evidence and booking-scam precautions. Anam, Aquaria/Crusoe, Lago de Oro, Nawa and PlayaLolita are cross-referenced to DOT’s
  CALABARZON roster dated 30 September 2026; this is not a live accreditation check. Valley O’Ville
  is operator-confirmed, with its separately hosted listing corroborating name and town only.
- `/data/resorts.json` and the export catalogue expose the same sources and limitations without
  assigning a civic-data readiness tier. The guide is in Services navigation, search and the home
  exploration, and its links are validated at build time.
- Generic pictograms accompany other named channel links, the website action uses a globe, and the home
  overview includes a direct resort-finding task. Entries with no corroborated social link say so.

### Changed — Valley O’Ville directory wording
- Removed the Valley O’Ville row’s unrelated DOT and booking-configuration notes, as well as the
  redundant domain-ownership caveat. DOT roster observations remain limited to listed resorts.

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

### Added — Tourism recognition
- Statistics › Tourism: Calatagan ranked Top 9 in overnight tourist arrivals for 2025 at the
  CALABARZON Tourism Excellence Awards (16 September 2026). Source: the municipal tourism
  office's Facebook post, published at tier 2 on the maintainer's attestation (ADR 0010); DOT's
  own per-municipality statistics could not be read, so no arrival count is published.

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
- Every barangay profile has the map too, opening on that barangay, selected; click any other
  to compare.
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
- The assistant refused to give the published emergency hotlines because its instructions still
  forbade all telephone numbers; it now gives hotlines that appear on the site, exactly as written
  (the output guard already allowed only those). Live eval: 52/52 after fixing two eval patterns
  that flagged correct answers.
- Assistant re-indexing embedded every changed passage before saving any, so a run that hit the
  daily Workers AI allowance part-way lost all its work and the next cron run (every 30 minutes)
  started over, spending the allowance again. It now saves in batches of 32 and does at most 320
  passages a run; the next run continues where the last one stopped.
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
