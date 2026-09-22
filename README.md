# Better Calatagan

> **Better Calatagan is an independent civic project and is not the official website of the
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

Six pages, four machine-readable datasets, 164 tests.

| Dataset | Tier | Basis |
| --- | --- | --- |
| Identity, PSGC, 25 barangays | 1 | PSA OpenSTAT — PSA's own statistical database |
| Population: 60,420 (2024), households 15,442, census series | 1 | PSA OpenSTAT; barangay counts reconcile exactly |
| Income classification: 1st class, from 2025-01-01 | 1 | BLGF MC No. 020.2024, Annex A, read directly |
| Municipal finances — 14 quarters, CY2023 Q1–CY2026 Q2 | 2 | Extracted from DILG filings; 838 reconciliation checks, all passing |
| Full Disclosure filings — 156 across 14 forms | 2 | DILG portal, every download endpoint exercised |
| Archived documents — 232 | 2 | Internet Archive of the municipality's dead website |

Every figure on the finances page records the spreadsheet cell it came from. Filings that do not
reconcile against their own internal arithmetic are withheld, not flagged.

**Not published, and why:** land area (PSA's own table reports a figure implying ten times its
neighbours' density), elected officials (an election result is not proof of present incumbency),
office contact details (their source record is demonstrably stale), COA figures, and planning
documents that exist only on third-party hosts. Each appears on the Sources page with its reason.

See [SOURCES.md](SOURCES.md) for the full inventory and open items.

## Running it

```bash
npm install
npm run dev        # local dev server
npm run test       # civic-data guardrails
npm run check      # typecheck + lint + test + build
```

Refreshing the DILG filing index (stage, review the diff, then promote):

```bash
npm run fdp:stage      # fetch the listing, probe every download, write data/staging/
npm run fdp:promote    # merge into src/data/generated/ without deleting anything
```

The DILG server omits an intermediate TLS certificate, so the scripts supply it from `certs/`
rather than disabling verification.

No backend, no database, no CMS, no authentication, no analytics, no AI. The site builds to static
HTML. See [docs/adr/](docs/adr/) for why.

## Contributing

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
