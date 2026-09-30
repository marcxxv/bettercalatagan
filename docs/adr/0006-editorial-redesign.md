# 0006 — An editorial, answer-first redesign

**Status:** Accepted · 2026-09-30 · Supersedes parts of [0005](0005-design-system.md)

## Context

ADR 0005 gave the site a coastal palette and a provenance component, but it still read as a
competent document site rather than as the best civic site a resident could visit. Two references
set the bar:

- **America.gov** (launched 29 September 2026, National Design Studio): a near-white canvas, a
  high-contrast display serif set tight, one navy accent, generous rounded panels, a single
  question box at the centre of the home page, and a floating "Ask anything…" bar on every page.
- **The Better LGU portals** (BetterBacolod, BetterLB, BetterSolano, BetterTagaytay and others in
  the BetterGov.ph directory): a utility line with the time in Manila, quick-access tiles, "at a
  glance" figures, a history timeline, and a footer that states the cost to the public (₱0).

The live sites could not be fetched from the build environment, so the Better LGU portals were
built from their public repositories and inspected locally, and America.gov was studied from a
screen recording supplied by the maintainer.

## Decision

**Look.** Light and editorial. `--c-bg` near-white, rounded grey panels (`--c-panel`) that open
each page with the masthead floating over them, near-black navy ink, and a single interactive
accent (`--c-accent`, navy blue). Reef teal, harbour gold and earthenware clay are kept for data
and status only. Dark mode is fully supported and follows the system unless the reader chooses.

**Type.** Source Serif 4 with its **optical-size axis** (self-hosted, `opsz` + `wght`), so large
headings automatically use the high-contrast display cut; set at weight 400 with tight tracking.
**Public Sans** — the U.S. Web Design System's open typeface — for interface, sub-heads and data.
Both SIL OFL, both self-hosted, Latin subsets only (plus Public Sans Latin Extended, fetched only
when a page uses the peso sign).

**Answer-first.** The home page opens with "Kumusta, Calatagan" and a question box. Search is a
build-time index (`/search.json`, built from the same data the pages render) with a small
deterministic matcher — no dependency, no service, no AI. Facts answer inline *with their source*;
answers are only ever written from tier 1–2 records, and questions about what is withheld (who
the mayor is, the land area) are answered with the reason it is withheld. The same box floats at
the bottom of every page, and a ⌘K / Ctrl K dialog offers it anywhere.

**Imagery without photographs.** Where America.gov uses photos, the home carousel draws scenes
from the site's own data: the Cape Santiago light (from the history), the 25 barangays as circles
at census size, the latest full year's income split, and a mosaic of the actual filings. The
imagery can say nothing the records do not.

**Interaction.** Sortable, searchable barangay table; a period switcher across all 14 quarterly
statements; a form × year coverage heatmap on the disclosures page whose cells filter the list;
URL-synced filters with removable pills (a filtered view can be shared); scroll-spy "On this page"
rails; a reading-progress bar on the history. All of it is progressive enhancement: without
JavaScript every page is complete and every list is shown in full.

**Motion.** Slow, ambient and purposeful: drifting depth contours, a sweeping lighthouse beam,
columns and bars that grow into view, count-up figures, a manifesto that lights word by word.
Everything stops under `prefers-reduced-motion`, and the carousel never auto-advances then.

**Mark.** A stressed, serif-weighted "C" drawn as the curve of the bay, with a single gold point
at its southern tip for the Cape Santiago light, in a navy rounded square. Still never a circle,
shield, wreath or seal. `scripts/brand.mjs` renders the favicon, app icons and one Open Graph
image per section from the vector mark and the site's own fonts; share images carry titles only,
never figures, so they cannot drift out of date.

### What did not change

- The independence notice is the first line of every page, and says the opposite of the federal
  "official website" line, with a "how to tell" disclosure.
- No seal, coat of arms or `.gov.ph` styling; no analytics, cookies, accounts or third-party
  scripts.
- Provenance stays beside every figure (`Source.astro`), and every chart duplicates a table or
  legend that carries its numbers as text.

### Measured contrast (WCAG 2.x)

| Text on background | Light | Dark |
| --- | --- | --- |
| ink on bg | 18.1 | 17.0 |
| ink-2 on bg | 9.8 | 11.9 |
| muted on bg / on panel | 5.7 / 5.2 | 7.5 / 6.9 |
| muted on sunk (lowest text pairing) | 5.0 | 6.1 |
| accent (links) on bg | 9.8 | 9.6 |
| clay on bg | 6.7 | 9.2 |
| teal on teal-wash (chip) | 5.9 | — |
| form borders on panel (non-text, 3:1) | 3.6 | 3.9 |

axe-core (WCAG 2.2 AA + best practice) reports no violations on any page in either theme. No page
scrolls horizontally at 320 px.

## Consequences

- ADR 0005's "no gradients, no hero imagery" rule is relaxed: soft panel gradients and the drawn,
  data-derived scenes are allowed; stock or tourism photography still is not.
- The site now ships a little JavaScript on every page (theme, search, motion — about 4.5 KB
  gzipped) and a 1.4 KB module on the pages with filters. The search index (~15 KB gzipped)
  loads only when someone searches.
- ADR 0002's plan to use fuse.js for search is superseded: a deterministic matcher over a
  build-time index was enough, and never returns a "best guess" to a question it was not asked.
