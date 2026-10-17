# 0014 — Explicit light and dark themes

**Status:** Accepted · 2026-10-17 · Amends [0006](0006-editorial-redesign.md).

## Context

The site followed `prefers-color-scheme` until a reader chose a theme, so it had three
states: system, light and dark. The switch cycled all three and the theme was stored only
when the reader picked one. Every dark colour therefore had to be written twice — once under
`@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` for readers who
never chose, and once under `:root[data-theme='dark']` for readers who did.

Maintainer decision: the site should have exactly two modes. Light is the default for
everyone; dark is opt-in and remembered. Visitors whose system is dark should still land on
the editorial light canvas shown in the design reference.

## Decision

- **Two explicit themes.** `ThemeChoice` is `'light' | 'dark'`. The toggle switches between
  them and nothing else. The `system` state, its label and its icon are removed.
- **Light is the default.** `readTheme()` returns `'dark'` only when `localStorage['bc-theme']`
  is exactly `'dark'`; every other case (including unavailable storage) is light.
- **The attribute is always set.** `Base.astro` writes `data-theme` before first paint, and
  `ui.ts` keeps it in step, so dark is applied only by `:root[data-theme='dark']`.
- **No `prefers-color-scheme`.** The duplicated dark block is deleted from `tokens.css`, the
  map's `prefers-color-scheme` listener is removed (its `data-theme` observer already
  rethemes), and the one page-level media override in `transparency.astro` goes with it.
  A theme colour is now defined in exactly two places: light `:root` and dark
  `:root[data-theme='dark']`.
- **`theme-color` follows the choice.** One meta tag, updated by the same pre-paint script and
  by `applyTheme()`, so the browser chrome matches the page rather than the operating system.

## Consequences

- A visitor on a dark system now sees light until they choose dark; the choice then persists.
  This is deliberate for a public civic site, and it is the behaviour the maintainer asked for.
- No-JavaScript readers always get light, because there is no other way to express a choice.
  The dark theme remains fully styled and measured to WCAG 2.2 AA (0006).
- Halves the dark token surface: one block instead of two keeps future colour additions in step
  and removes the class of bug where a colour is defined for one dark path and not the other.
- The favicon's own `prefers-color-scheme` rule is left alone: it styles a browser tab, not the
  page, and the tab chrome follows the operating system.
