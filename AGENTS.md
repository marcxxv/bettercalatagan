# AGENTS.md — working on Better Calatagan

The single source of truth for any AI agent (Claude Code, Codex, Cursor, Copilot, …) or new
contributor. Read it before changing anything. When you change how the project works, **update
this file in the same commit**. It is the project's memory.

- **What this is:** an independent, static civic-information site for the Municipality of
  Calatagan, Batangas, Philippines. Every figure is traced to a government source.
- **Repo:** `marcxxv/bettercalatagan` · **Host:** Vercel · **Default branch:** `main`
  (pushing to `main` deploys).
- **Deeper reading:** `README.md` (overview) · `CONTRIBUTING.md` (evidence rules) ·
  `SOURCES.md` (source inventory) · `docs/adr/` (decisions) · `docs/data-pipelines.md` (data
  runbook) · `CHANGELOG.md` (data and code history).

---

## 1. Non-negotiables

Breaking any of these is a defect, whatever else improves.

1. **Every civic fact has a source.** A figure without a `SourceReference` does not ship. Never
   invent, estimate or "fill in" a number, name, date or contact detail. If a source is
   unreachable, say so; do not guess.
2. **Withheld means withheld.** `WITHHELD` in `src/data/municipality.ts` lists facts deliberately
   not published (land area, current officials, office contacts, …). CI greps the built site for
   the specific withheld values (`.github/workflows/ci.yml`). Never render them, not even in alt
   text, JSON-LD, search index, `llms.txt` or comments that ship.
3. **No unverified officials.** Election results ≠ incumbency. CI fails if certain surnames appear
   in HTML. No biographies, evaluations or characterisations of anyone.
4. **Independence is explicit.** Never imitate an official government site: no seals, crests or
   "official" claims. The banner "An independent civic project — not an official government
   website" stays.
5. **Provenance fields mean what they say.** `asOf` = period the data describes; `lastVerified` =
   when a *person* checked the source; `accessedOn` = when a URL was actually opened. Scripts
   never set `lastVerified`. Never set `accessedOn` for a URL you did not open.
6. **Publish disagreements; don't pick winners silently.** See CONTRIBUTING.md.
7. **Never disable TLS verification.** DILG's missing intermediate certificate is supplied from
   `certs/`.
8. **Archived ≠ current.** Documents from the former municipal site are historical records; label
   them so.

## 2. Stack and commands

Astro 7 (static output, no adapter), TypeScript, Zod, Vitest, ESLint. Node ≥ 22.12. No
framework runtime, no Tailwind, no analytics, and the site itself has no backend or database
(ADR 0002). Runtime deps: `astro`, `zod`, `pdfjs-dist`, `fflate`. The one piece of server code is
the assistant, a Cloudflare Worker in `worker/` with its own `package.json` (ADR 0008, §6).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (proxies `/wayback` and `/fdp-file`, see §7) |
| `npm run check` | **The gate:** `astro check` + ESLint + Vitest + build. Must pass before every commit. |
| `npm run test` | Vitest (`src/**/*.test.ts`), civic-data guardrails included |
| `npm run preview` | Serve `dist/` (also proxies reader paths) |
| `npm run data:refresh` | Re-run every data pipeline (needs network to `*.gov.ph`, `archive.org`) |
| `npm run data:report` | Human-readable diff of generated datasets vs `HEAD` |
| `npm i --no-save playwright && node scripts/brand.mjs` | Re-render favicon, app icons and OG images from `public/logo-mark.svg` |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests, data validation, build,
generated-data-unchanged, withheld-value leak check and officials check on every push and PR.
`.github/workflows/refresh-data.yml` refreshes data weekly and opens a review PR.

## 3. Repository map

```
src/
  pages/              one file per route; /data/*.json.ts, search.json.ts, sitemap.xml.ts,
                      robots.txt.ts, llms.txt.ts are generated endpoints
  layouts/Base.astro  html shell: theme bootstrap, Seo, header, footer, SearchDialog, AskBar, DocViewer
  components/         see §5
  data/               typed, sourced data modules + *.test.ts guardrails
    generated/        pipeline output (committed JSON) — never hand-edit
    schemas/          Zod schemas; provenance.ts is the envelope every record carries
  lib/                site.ts (name, nav), format.ts, export.ts (licence, API version),
                      search-index.ts, viewer.ts (reader links)
  scripts/            client-side TS: ui.ts (site-wide), search.ts, filter.ts, barangays.ts,
                      viewer.ts + office.ts (document reader)
  styles/             tokens.css (design tokens, light + dark), global.css
scripts/              Node pipelines (fdp, sre, psa, documents), data-report, brand
data/staging/         FDP staging file (committed)
docs/adr/             decisions 0001–0009; docs/data-pipelines.md runbook
worker/               the assistant: Cloudflare Worker, D1 + Vectorize, eval set (worker/README.md)
public/               logo*.svg, favicons, og/*.png, fonts/ (self-hosted), agencies/ (badges)
certs/                DILG intermediate certificate
```

## 4. Data model and flow

- Every published record is `Sourced<T>` = `{ data, source: DataSource }`
  (`src/data/schemas/provenance.ts`). `DataSource` holds `tier` (1 verified, 2 published with a
  shown caveat, 3 internal, 4 withheld), `verification`, `asOf`, `lastVerified`, `status`,
  `sources[]` (ranked by `authority`, see CONTRIBUTING.md).
- Generated datasets: `fdp-filings.json` (156 DILG filings, 14 forms), `sre-financials.json` (14
  reconciled quarterly SREs, cell-referenced), `psa-population.json` (2024 POPCEN, 25 barangays),
  `archived-documents.json` (232 files from calatagan.gov.ph via the Internet Archive).
- More generated datasets (ADR 0009): `dpwh-projects.json` (DPWH contracts mentioning Calatagan,
  each with a `scope`: calatagan / road / shared) and `cmci.json` (DTI competitiveness, by year).
- Hand-maintained: `municipality.ts` (identity, income class, `WITHHELD`), `history.ts`,
  `sources.ts`, `barangays.ts`, `services.ts` (2022 Citizen's Charter services, no fees or times),
  `calendar.ts` (holidays by proclamation; hotlines by executive order).
- Exports: `/data/index.json` (catalogue), `/data/{municipality,financials,fdp-filings,documents}.json`,
  `/search.json` (ask/search index), `/llms.txt`, `/sitemap.xml`.
- Pipelines, review flow and how to add a source: **`docs/data-pipelines.md`**.

When figures change: update data → tests → CHANGELOG (*Unreleased*, naming the source) →
SOURCES.md if a source was added.

## 5. UI system

**References.** Primary: america.gov (professional, editorial, answer-first; the "Ask anything" bar).
Secondary: the Better LGU portals (`github.com/marcxxv/better-lgu-directory`, e.g. betterbacolod.org)
for civic patterns. Adapt the level of craft; never copy their branding or text.

**Look.** Near-white canvas, rounded panels, Source Serif 4 (display, optical size axis) +
Public Sans (UI), self-hosted in `public/fonts/`. One navy accent. Generous whitespace. Motion is
purposeful and respects `prefers-reduced-motion`.

**Tokens** (`src/styles/tokens.css`). Always use tokens, never raw colours in components:
`--c-bg`, `--c-bg-alt`, `--c-surface`, `--c-raised`, `--c-sunk`, `--c-ink`, `--c-ink-2`,
`--c-muted`, `--c-line`, `--c-line-strong`, `--c-accent(-strong|-wash|-line)`, `--c-navy`,
`--c-clay(-wash)`, `--c-ok`, `--c-warn(-bg|-line)`, `--c-danger`, spacing `--sp-1…10`, type
`--fs-2xs…display`, `--radius-*`, `--shadow-*`, `--dur-1…3`, `--ease-out`, `--tap` (44px).
Component tokens exist for theme-sensitive parts (`--go-*` ask arrow, `--logo-ink/--logo-bg`,
`--hit-hover`, `--check-ink`).

**Dark mode** has three switches and every theme colour must be defined for all three:
light `:root`; `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`;
`:root[data-theme='dark']`. A colour set only under `[data-theme=dark]` is a bug (it misses
system dark). Theme choice is stored in `localStorage['bc-theme']` and applied pre-paint in
`Base.astro`. Light is the default.

**Avoid (rejected before):** coloured left-stripe panels ("AI-slop" border-left accents),
gradients-as-decoration, glassmorphism, stock hero photos, a back-to-top button, anything that
looks like an official government site.

**Navigation** (ADR 0009) follows the Better LGU portals: `NAV_GROUPS` in `site.ts` (Services ·
Government · Statistics · Transparency · About) drives the header dropdowns (native `<details>`,
hover-intent open and a shared `.nav-morph` surface that glides between groups with a mouse; click/keyboard otherwise), the mobile menu, the footer directory,
`sitemap.xml`, `/sitemap`, `llms.txt`, the search index and the assistant. `PAGES` is every page
once; `NAV` is the main sections. A new page goes in a group, not in a flat list.

**Lists are datasets** (`global.css`): `.dataset` (set `--cols`) › `.dataset-head` (sticky under
the masthead) › `ul.dataset-rows` › `li.dataset-row` with `.cell.main` (`.row-title` clamped to two
lines, `.row-sub`, `details.row-more`), `.cell` (with a `.cell-label`, visible on phones only),
`.num`, `.row-actions` (`.icon-action`, `.primary`). `.dataset-group` rows divide a list (months).
Never go back to tall per-item cards. `ArchiveList.astro` renders archived documents this way.
**Tables** never scroll vertically inside their frame; `ui.ts` adds `.fits` when a table fits its
width so its `thead` sticks to the page. Selects are `appearance: none` (Safari). Also shared:
`.section-block`, `.aside-card`, `.group-head`.

**Name:** the site is **BetterCalatagan**, one word, everywhere.

**Components** (`src/components/`): `SiteHeader`, `SiteFooter` (giant wordmark), `PageHeader`
(rounded panel with eyebrow, icon, lede, aside slot), `HeroCarousel` (home scenes, hero ask
`data-hero-ask`), `AskBar` (floating 448×56 ask bar; hides when the hero ask is visible or a
dialog is open; grows on hover), `SearchDialog` (⌘K), `DocViewer` (reader), `Source` (provenance
card), `Cites`, `Freshness`, `AgencyBadge` (PSA/DILG/BLGF/DOF/NHCP/IA marks), `Mark` (inline logo,
theme-aware), `Icon` (stroke icon set; add names to the `IconName` union), charts `ColumnChart`,
`LineChart`, `Donut`, `Contours` (decorative topography).

**Client behaviour** lives in `src/scripts/ui.ts` via data attributes: `data-tip` tooltips,
`data-spy` scrollspy, `data-copy`, `data-reveal`/`data-grow`/`data-animate`/`data-stagger`,
`data-count` count-up (all gated by `.js-motion`), `data-inline-search`, `data-voice` (speech
input), `data-open-search`, `data-theme-toggle`, `data-ph-clock` (Manila time). Filters: `form[data-filter]` + `data-item`
rows + `data-set-filter` chips, URL-synced (`src/scripts/filter.ts`).

**Accessibility** is measured, not assumed: WCAG 2.2 AA contrast in both themes, axe-core clean on
every page, no horizontal scroll at 320 px, visible focus, real links for navigation, dialogs
with labels, `visually-hidden` text for icon-only controls.

## 6. Search and "Ask anything"

`src/lib/search-index.ts` builds `/search.json` at build time from the data modules (facts with
answers and sources, pages, barangays, filings, documents, withheld facts with their reasons).
`src/scripts/search.ts` is a small deterministic matcher, with no external service. The
same matcher powers the hero ask, the floating AskBar and the ⌘K dialog (`attachSearch` in `ui.ts`,
90 ms debounce). If you add a dataset, add it to the index.

**The assistant** (ADR 0008) sits on top when the build has `PUBLIC_ASK_ENDPOINT`: the first
result row becomes "Ask", and Enter opens `AskPanel.astro` (`src/scripts/ask.ts`, loaded on first
use; `markdown.ts` renders answers safely). It morphs out of, and back into, the box it was asked
from.

- **Knowledge = the built pages.** `scripts/lib/ask-corpus.mjs` (an Astro integration) writes
  `/ask/corpus.json` after every build: each `<main>` split at h2 (deep-linked), tables as labelled
  rows, plus sourced answers from `/search.json`. It skips `aria-hidden`, `hidden`, nav, forms and
  `data-ask-skip`; a `hidden` region with `data-ask-label="…"` (e.g. one quarter's panel) is kept
  as its own passage. New pages are picked up automatically; mark decoration `aria-hidden`.
- **Worker** (`worker/`): hybrid retrieval (D1 FTS5 + bge-m3 in Vectorize, RRF), models NYO
  `glm-5.3` → Workers AI SEA-LION → `gpt-oss-120b`, re-indexes changed passages every 30 min.
- **Guard** (`worker/src/guard.ts`, `numbers.ts`): figures must round from the passages; the
  officials/withheld lists must equal the CI lists (a test enforces it). Change both together.
- **Never store** questions or answers. After changing the prompt, models or guard, run
  `node worker/eval/run.mjs` against a Worker.

## 7. Document reader

Any link carrying `readAttrs()` / `archiveReadAttrs()` / `fdpReadAttrs()` from
`src/lib/viewer.ts` opens the reader (`DocViewer.astro`, `src/scripts/viewer.ts`). The link's
`href` is the original URL, so middle-click and no-JS still work.

- PDF → PDF.js **legacy build** (`pdfjs-dist/legacy/build/pdf.mjs`). The modern build uses
  `Map.getOrInsertComputed` and breaks on current Safari and older Chromium, so do not switch back.
- XLSX/DOCX → `src/scripts/office.ts` (fflate + DOMParser; DOM built with `textContent` only).
- Legacy `.doc` cannot be rendered; it shows a "Get file" link.
- Bytes come through same-origin pass-through rewrites: `/wayback/*` → `web.archive.org/web/*`
  (with `id_` for raw captures) and `/fdp-file/:id` → DILG download (`vercel.json`; mirrored in
  `astro.config.mjs` for dev/preview). Nothing is stored. ADR 0007.
- `?read=<id>` deep-links a document. Renderers load only on first open.

## 8. SEO

`Seo.astro` emits title, description, canonical, robots, Open Graph/Twitter (per-section image
`public/og/<section>.png`), and JSON-LD: a `WebPage` on every page linked to one publisher
`Organization` (`/#publisher`) and `WebSite` (`/#website`), `BreadcrumbList`, plus page-specific
`Dataset` / `DataCatalog` / `Article` passed via `jsonLd`. `sitemap.xml` uses each page's
`lastVerified` as `lastmod` (never the build date). `robots.txt` disallows the reader proxy paths.
`/llms.txt` is generated from the data modules. Pass `noindex` to `Base` for pages that should not be
indexed. Keep titles ≤ 60 characters and descriptions ≤ 160 where possible.

## 9. Verifying a change

1. `npm run check` (must pass).
2. For UI: build, `npx astro preview --port 4399`, and drive it with Playwright (Chromium is
   preinstalled in cloud sessions at `/opt/pw-browsers`; install `playwright` in a scratch
   directory, not the repo). Screenshot light **and** dark, desktop **and** 390 px mobile. Run
   axe-core on changed pages. Check `document.documentElement.scrollWidth <= innerWidth` at 320 px.
3. Reader changes: sandboxes usually cannot reach archive.org or DILG, so intercept
   `**/wayback/**` and `**/fdp-file/**` with `page.route()` and serve local fixture files.
4. Re-read your diff for withheld values, invented facts, and colours missing a dark variant.

## 10. Conventions

- **Commits:** imperative subject; body explains why. Update `CHANGELOG.md` *Unreleased* for any
  user-visible or data change (it tracks data as well as code).
- **ADRs:** a change to a recorded decision gets a new ADR in `docs/adr/` (next number), and a
  one-line update note on the one it amends. Never silently erode a decision.
- **Code style:** match surrounding code; comments explain *why*; British/Philippine English in
  prose ("organisation", "centre" as already used); Philippine peso formatting via `lib/format.ts`.
- **Generated files:** never hand-edit `src/data/generated/*`; change the script and re-run it.
- **Dependencies:** justify each one; prefer none. No analytics, trackers or third-party embeds.
- **Licensing:** code MIT; compilation CC BY 4.0; cited government documents are **not**
  relicensed (LICENSES.md). Fonts are OFL (listed in LICENSES.md).

## 11. Known gotchas

- `compressHTML` is off on purpose: Astro's compressor dropped the space where a line of text
  breaks before an inline element ("on the\n<a>" → "on the<a>"). Don't turn it back on.
- The Supreme Court E-Library (proclamations, EOs) omits its intermediate certificate; use
  `certs/globalsign-gcc-r3-ev-tls-ca-2025.pem`. DTI's CMCI site wants a browser user agent.
- DPWH descriptions mention "Calatagan" for the national road and for places elsewhere
  (Makati, Virac). Never count a project by keyword; `scripts/lib/dpwh-location.mjs` decides.
- If the repo sits in an iCloud-synced folder, sync conflicts create untracked `name 2.ext`
  copies. Compare them to the originals, then delete them; never commit them.

- Sandboxed sessions: `*.gov.ph`, `archive.org`, `america.gov`, `bettergov.ph` and Wikimedia are
  often blocked by the network policy. Don't fake data around it; say what you could not reach.
- The DILG portal regenerates XLSX per request, so byte hashes are useless; the fingerprint hashes
  the zip central directory (ADR 0004). ~15% of DILG downloads return HTTP 500 at any time.
- `calatagan.gov.ph` is offline (no A record). The Internet Archive is the only copy.
- PSA's website has a bot wall; PSA OpenSTAT (PxWeb API) does not.
- The PSA land-area value is suspected wrong (10.50 vs 101.50 km²) and is withheld; never publish
  density.
- Brand assets are rendered from `public/logo-mark.svg`; `Mark.astro` swaps `#1a3aa8`/`#ffffff`
  for `--logo-ink`/`--logo-bg` so the emblem adapts to dark mode. Keep those two literal colours in
  the SVG.
- Astro `<style>` is scoped; styles for DOM created in scripts (reader, filters) must be
  `is:global` or live in `global.css`.

## 12. Recipes

- **New page:** `src/pages/<name>.astro` using `Base` (title, description, crumbs, optional
  `jsonLd`) and `PageHeader`; add to `NAV`/`SECONDARY_NAV` in `src/lib/site.ts` (drives header,
  footer, sitemap, llms.txt); add an OG image key in `Seo.astro` and `scripts/brand.mjs` if it is a
  section.
- **New dataset:** follow "Adding a new source" in `docs/data-pipelines.md`.
- **New document link:** use `archiveReadAttrs(doc)` or `fdpReadAttrs(filing, period)` so it opens
  in the reader; keep `href` pointing at the original.
- **New icon:** add to the `IconName` union and `PATHS` in `Icon.astro` (24px grid, stroke).
- **New theme colour:** define it in all three blocks of `tokens.css`.
