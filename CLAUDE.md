# CLAUDE.md

Project memory for Claude Code. The full guide is shared with every other agent and lives in
AGENTS.md; it is imported here so there is one source of truth.

@AGENTS.md

## Claude-specific notes

- **Before you finish any task:** `npm run check` must pass, and CHANGELOG.md *Unreleased* must
  describe the change. If you changed how the project works (a pipeline, a component contract, a
  convention), update AGENTS.md in the same commit.
- **The user's standing preferences for this project:** the bar is world-class, professional,
  authoritative UI (america.gov first, the Better LGU portals second); iterate and verify visually
  in light and dark, desktop and mobile, before reporting done; push finished work to `main`
  (it deploys) unless told otherwise.
- **Cloud sessions:** the network policy usually blocks `*.gov.ph`, `archive.org` and reference
  sites. Say so plainly and work from the committed data; never invent figures to get past it.
  Chromium is at `/opt/pw-browsers`; install Playwright in the scratchpad, not in the repo.
- **Data work:** read `docs/data-pipelines.md` first. Never hand-edit `src/data/generated/`.
- **Reporting:** state what you verified and how (test counts, axe results, screenshots), and what
  you could not verify (for example production-only rewrites).
