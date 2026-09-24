# 0005 — A coastal, editorial design system

**Status:** Accepted · 2026-09-25

## Context

The launch design was a plain, functional stylesheet. It worked, but it said nothing about the
place, and it gave the most important thing on every page — where a figure came from and how well
it was checked — the same visual weight as a footnote.

The redesign had four constraints:

1. **It must not look like the government.** No seals, mastheads, crests, "official" blue, or
   anything that could make a reader think the Municipality runs this site.
2. **It must not look like tourism or SaaS.** Calatagan is known for resorts; a civic site that
   borrows resort styling would undercut its seriousness. No gradients, glassmorphism or hero
   photography.
3. **WCAG 2.2 AA everywhere**, in both light and dark schemes, measured rather than assumed.
4. **Static and light.** No framework, no client-side rendering, one self-hosted font.

## Decision

A palette drawn from the peninsula itself, used with restraint:

| Token | Role | Source of the idea |
| --- | --- | --- |
| `--c-bg` sand, `--c-surface` paper, `--c-sunk` limestone | Page, cards, recessed areas | Beach sand and coral limestone |
| `--c-navy` | Headings, the home-page band | Deep water off Cape Santiago |
| `--c-accent` teal | Links, controls, the "verified" rule | Shallow reef water |
| `--c-clay` | Sparing emphasis: eyebrows, rules, the attributed marker | The Calatagan earthenware |

Typography is **Source Serif 4** for headings and the history narrative (self-hosted, Latin subset,
one preloaded weight axis, SIL OFL) with the system sans stack for interface and data. Figures use
tabular numerals.

The mark is a lighthouse over water in a **rounded square**, deliberately not a circle or shield, so
it cannot be mistaken for a seal.

Provenance became a first-class component (`Source.astro`): status, publisher, "data as of" and
"verified" on one always-visible row, the caveat always visible, and the full method and source
list one click away.

### Measured contrast (WCAG 2.x relative luminance)

| Text on background | Light | Dark |
| --- | --- | --- |
| ink on bg | 14.7 | 15.5 |
| ink-2 on bg | 8.0 | 11.2 |
| muted on bg | 5.5 | 8.1 |
| muted on sunk (lowest text pairing) | 5.0 | 6.6 |
| accent (links) on bg | 6.5 | 8.7 |
| clay on bg | 6.3 | 7.9 |
| clay on clay-wash (chip) | 5.5 | 6.4 |
| band-muted on band | 9.1 | 9.1 |
| control borders on bg (non-text, 3:1) | 3.8 | 5.0 |

### Breakpoints

Mobile first; `30rem` (small phones), `40rem` (tables stop stacking), `48rem`, `64rem` (inline
navigation), `80rem`. The primary navigation is a native `<details>` menu below 64rem, so it works
without JavaScript.

## Consequences

- Charts are limited to proportional bars where they aid comprehension (income composition,
  sector spending, barangay sizes). Each is `aria-hidden` and duplicates a table or legend that
  carries the same numbers as text, and the composition bar is drawn only when its parts sum
  exactly to the reported total.
- Every table sits in a labelled, keyboard-focusable scroll region; record-like tables become
  stacked cards on narrow screens; wide numeric tables keep their row label pinned while scrolling.
- The site ships one inline script per filterable page and no other JavaScript.
