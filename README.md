# BetterCalatagan

> **BetterCalatagan is an independent civic project and is not the official website of the
> Municipality of Calatagan.**
>
> It is not affiliated with, endorsed by, or operated by the municipal government of Calatagan,
> the Provincial Government of Batangas, or any national government agency. It does not use the
> municipal seal or coat of arms as its identity.

A civic-information portal for the **Municipality of Calatagan, Batangas, Philippines** that
collects public information from government sources and shows, for every figure, where it came
from and how well it has been checked.

Part of the [BetterGov.ph](https://bettergov.ph) / Better LGU community.
Directory entry: [Calatagan, Batangas](https://lgu.bettergov.ph).

---

## What makes this project different

Most civic portals publish a number. This one publishes a number **and** the evidence behind it.

Every civic record carries a provenance envelope — its sources, when a human last checked them,
what period the data describes, how strong the evidence is, and whether it is fit to publish. The
rules are enforced by the test suite, not by good intentions:

- A record with no source **fails the build**.
- A record verified on a future date **fails the build**.
- A record marked `unverified` that is placed in a published tier **fails the build**.
- A published record resting only on an encyclopaedia or a social post **fails the build**.
- Barangay populations that do not reconcile to the census total **fail the build**.

Facts we cannot yet stand behind are **not published** — and the reason is shown on the
[Sources](src/pages/sources.astro) page. An absence you can see is more useful than a number you
cannot check.

## Current status

Pages grouped as the Better LGU portals group theirs (Services, Government,
Statistics, Transparency), including a profile for each of the 25 barangays; machine-readable
datasets are guarded by tests that run on every push. Every page
has an "Ask anything" box: instant search as you type, and, on Enter, an assistant that answers
in English, Filipino or Taglish from the site's own pages only, citing each one. Its figures are
checked against the pages in code before they are shown (see
[ADR 0006](docs/adr/0006-editorial-redesign.md) and [ADR 0007](docs/adr/0008-grounded-assistant.md)).

| Dataset | Tier | Basis |
| --- | --- | --- |
| Identity, PSGC, 25 barangays | 1 | PSA OpenSTAT — PSA's own statistical database |
| Population: 60,420 (2024), households 15,442, census series | 1 | PSA OpenSTAT; barangay counts reconcile exactly |
| Income classification: 1st class, from 2025-01-01 | 1 | BLGF MC No. 020.2024, Annex A, read directly |
| Municipal finances — 14 quarters, CY2023 Q1–CY2026 Q2 | 2 | Extracted from DILG filings; 838 reconciliation checks, all passing |
| Full Disclosure filings — 156 across 14 forms | 2 | DILG portal, every download endpoint exercised |
| Archived documents — 232 | 2 | Internet Archive of the municipality's dead website |
| DPWH projects — 179 located in Calatagan (plus 53 listed, not counted) | 2 | DPWH contract records via BetterGov.ph's open API, placed by their own descriptions |
| DTI competitiveness — 2015–2024 | 1 | DTI CMCI ranking tables |
| Municipal services — 119, from 18 offices | 2 | The offices' 2022 Citizen's Charters (archived) |
| Holidays 2026 and national hotlines | 1 | Presidential proclamations; executive orders |

The [resort booking-safety guide](src/pages/resorts.astro) lists four dated, resort-published
websites and social/booking links. Its [JSON export](src/pages/data/resorts.json.ts) carries each
entry’s evidence and review date but **does not** inherit the civic-data tiers above. The
September 30, 2026 DOT CALABARZON roster is a dated observation, not live accreditation or proof
that a booking or payment is safe. Valley O’Ville’s website is operator-confirmed; the entry
discloses that this project’s maintainer also operates the resort.

Every figure on the finances page records the spreadsheet cell it came from. Filings that do not
reconcile against their own internal arithmetic are withheld, not flagged.

**Not published, and why:** land area (PSA's own table reports a figure implying ten times its
neighbours' density), elected officials (an election result is not proof of present incumbency),
COA figures, and planning
documents that exist only on third-party hosts. Each appears on the Sources page with its reason.

See [SOURCES.md](SOURCES.md) for the full inventory and open items.

## Running it

```bash
npm install
npm run dev        # local dev server
npm run test       # civic-data guardrails
npm run check      # typecheck + lint + test + build
```

Refreshing the data (every source, then a plain-language report of what changed):

```bash
npm run data:refresh   # DILG filings (stage + promote), SRE extraction, PSA census, archive index
npm run data:report    # what changed, ignoring retrieval timestamps
```

A scheduled workflow does the same every Monday and opens a pull request only when a source
actually changed; merging it is the review step. See [docs/data-pipelines.md](docs/data-pipelines.md).

Regenerating the favicon, app icons and share images (only when the mark, fonts or a page title
change; the outputs are committed):

```bash
npm i --no-save playwright && node scripts/brand.mjs
```

The DILG server omits an intermediate TLS certificate, so the scripts supply it from `certs/`
rather than disabling verification.

The site builds to static HTML: no CMS, no authentication, no analytics, and search runs in the
browser against a prebuilt index. Documents open in an in-site reader through host-level
pass-through rewrites to the Internet Archive and DILG; nothing is stored. The one moving part is
the assistant, a Cloudflare Worker in [`worker/`](worker/README.md) that the site uses only when
built with `PUBLIC_ASK_ENDPOINT` (see [`.env.example`](.env.example)); without it every page works
exactly as before. The build writes the assistant's knowledge, `/ask/corpus.json`, from the
rendered pages, and the Worker re-indexes it after each deploy. See [docs/adr/](docs/adr/) for why.

## Contributing

Working with an AI coding agent? Start with [AGENTS.md](AGENTS.md) (also loaded by Claude Code via
[CLAUDE.md](CLAUDE.md)); the data runbook is [docs/data-pipelines.md](docs/data-pipelines.md).

Corrections are welcome, especially from people in Calatagan. The one firm rule: **every civic
fact needs a source.** An unsourced correction will be declined even if it is right, because the
project cannot tell the difference. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licensing

Three different things, three different answers — see [LICENSES.md](LICENSES.md).

- **Code** — MIT ([LICENSE](LICENSE)).
- **This project's own compilation** (our schemas, annotations, provenance records and written
  text) — CC BY 4.0 ([LICENSE-CONTENT](LICENSE-CONTENT)).
- **Cited government documents** — **not** licensed by us. They remain the works of their issuing
  agencies under Philippine law. We link to them and describe them; we do not relicense them.
