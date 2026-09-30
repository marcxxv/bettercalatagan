# Data pipelines — runbook

How every figure on the site gets from a government source into `src/data/generated/`, how it
is checked, and how to refresh it. The *why* lives in the ADRs; this is the *how*.

## The shape of every pipeline

```
source  ──fetch──▶  scripts/*.mjs  ──write──▶  src/data/generated/*.json   (committed)
                                                     │
                                  src/data/schemas/*.ts (Zod) parse at import
                                                     │
                                  src/data/*.ts  ──▶  pages, /data/*.json, /search.json, /llms.txt
                                                     │
                                  src/data/*.test.ts gate: provenance, reconciliation, never-shrink
```

Rules that hold for every pipeline:

1. **Output is committed.** The build never fetches. CI fails if a build changes
   `src/data/generated` (`git diff --exit-code`).
2. **Deterministic output.** Keys sorted, stable ordering, so a diff shows only real change.
3. **Schemas parse at import.** A malformed record fails the build, not a reader.
4. **Never shrink.** Tests assert the FDP, SRE and archive record counts are at least the
   committed snapshot (`SNAPSHOT` in `fdp`, `financials` and `documents.test.ts`); the census must
   cover all 25 barangays and reconcile to the municipal total. A source outage cannot delete data.
5. **A human verifies.** Scripts set retrieval times (`retrievedAt`, `generatedAt`); only a person
   sets `lastVerified` in `src/data/*.ts`, after reading the source.

## The pipelines

| Command | Script | Source | Output | ADR |
| --- | --- | --- | --- | --- |
| `npm run fdp:stage` | `scripts/fdp.mjs stage` | DILG Full Disclosure Policy Portal listing + each download | `data/staging/fdp-staged.json` | 0004 |
| `npm run fdp:promote` | `scripts/fdp.mjs promote` | the staging file | `src/data/generated/fdp-filings.json` | 0004 |
| `npm run fdp:extract` | `scripts/sre.mjs extract` | the SRE spreadsheets named in the FDP index | `src/data/generated/sre-financials.json` | — |
| `npm run psa:fetch` | `scripts/psa.mjs fetch` | PSA OpenSTAT (PxWeb API) | `src/data/generated/psa-population.json` | 0001, 0003 |
| `npm run archive:index` | `scripts/documents.mjs build` | Internet Archive CDX for calatagan.gov.ph | `src/data/generated/archived-documents.json` | — |
| `npm run dpwh:fetch` | `scripts/dpwh.mjs fetch` | BetterGov.ph DPWH API (DPWH's contract records) | `src/data/generated/dpwh-projects.json` | 0009 |
| `npm run cmci:fetch` | `scripts/cmci.mjs fetch` | DTI CMCI ranking tables and LGU profile (indicators) | `src/data/generated/cmci.json` | 0009 |
| `npm run data:refresh` | all of the above, in order | | | |
| `npm run data:report` | `scripts/data-report.mjs` | working tree vs `HEAD` | Markdown on stdout | |

Hand-maintained data (not generated) lives in `src/data/*.ts`: municipal identity, income
classification, `WITHHELD`, history, source registry (`sources.ts`). Hand-entered notes on archived
documents (`INSPECTED`) live in `scripts/documents.mjs` so a rebuild keeps them.

### DILG FDP: stage → review → promote

- `stage` pages through the portal listing, maps each row to one of the 14 statutory forms, and
  downloads every file with retries (5xx is common: ~15% of downloads fail at the portal).
- File type comes from **magic bytes**, not `content-type` (the portal labels XLSX as
  `application/vnd.ms-excel`).
- The fingerprint hashes the zip central directory (name, CRC-32, size), because the portal
  regenerates each XLSX per request and the raw bytes change every fetch.
- `promote` merges: never deletes a filing (marks `missing-from-source`), never overwrites a good
  checksum with a failure (keeps `lastKnownGoodAt`), records resubmissions in
  `supersededFdppIds`.
- The DILG server omits an intermediate TLS certificate; scripts pass
  `NODE_EXTRA_CA_CERTS=certs/geotrust-tls-rsa-ca-g1.pem`. **Never disable TLS verification.**

### SRE extraction

Rows are located by **label**, never row number; every value records its sheet and cell; each
filing's own identities (totals = sum of parts) must reconcile or the filing is marked unverified
and not published. Unmatched labels are reported, not guessed.

### PSA OpenSTAT

PSA's web pages sit behind a bot challenge; OpenSTAT's API does not. Geo keys are PSGC codes;
Calatagan's 25 barangay codes are non-contiguous (012, 024, 025 unassigned). Tests assert the
barangays sum to the municipal total.

### DPWH projects

The API is searched for "Calatagan"; each hit is classified by `scripts/lib/dpwh-location.mjs`
from its own description: `calatagan` (counted), `road` (the Nasugbu–Lian–Calatagan national road,
kilometre posts only), `shared` (a package across towns) or `elsewhere` (dropped). Barangays are
read from DPWH's spellings ("BRGY. 1, 2, 3 AND 4", "STA. ANA", "QULITISAN"). The rule's tests use
real descriptions; add a failing description to them before changing it. Refuses to write if the
Calatagan count falls.

### DTI CMCI

Reads the ranking table for each year DTI offers, in the category Calatagan was ranked in.
DTI's server wants a browser user agent. A year whose table prints every score as 0.0000 (2018)
is stored with `score: null`. Never read the LGU profile's contact block (stale, withheld).

### Internet Archive index

One CDX query; filters out plugin assets and cPanel files; de-duplicates by content digest;
classifies by the filename the municipality chose (unmatched → `other`, never guessed).

## Scheduled refresh

`.github/workflows/refresh-data.yml` runs every Monday 09:17 PHT and on demand
(Actions → Refresh data → Run workflow):

1. Runs each pipeline independently (`continue-on-error`), so one portal outage does not block
   the others.
2. Runs `npm run check` — the same gate as any pull request.
3. Writes the change report (ignores retrieval timestamps) plus a table of each source's outcome.
4. **Only if something substantive changed**, opens or updates the pull request on branch
   `data/refresh`. That pull request is the review step. Merging publishes.

Repository setting required once: *Settings → Actions → General → Workflow permissions →
"Allow GitHub Actions to create and approve pull requests".*

### Reviewing a refresh pull request

- **Added filings:** expected each quarter. Spot-check one against the portal.
- **Changed `availability`:** portal flakiness is normal; a filing going `missing-from-source` is
  worth a look at the portal listing.
- **Changed `contentSha256`:** the municipality revised a file. Check the SRE figures moved for a
  reason, and add a CHANGELOG line naming the filing.
- **Anything under "Removed":** should never happen. Do not merge; investigate the script.
- After checking, bump `lastVerified` in the matching `src/data/*.ts` source and add a CHANGELOG
  entry under *Unreleased* saying which source prompted the change.

## Running locally

```bash
npm ci
npm run data:refresh     # needs network access to the four sources
npm run data:report      # what changed, in words
npm run check            # the gate
```

Sandboxed environments (including Claude Code on the web) often cannot reach `*.gov.ph` or
`archive.org`. Then do not fabricate data: leave the datasets as committed and let the scheduled
workflow refresh them.

## Adding a new source

1. Rank it on the evidence hierarchy (CONTRIBUTING.md). Add a `SourceReference` in
   `src/data/sources.ts` (or the dataset module) with a URL you actually opened.
2. Write `scripts/<name>.mjs` following the rules above: deterministic, sorted keys, user agent,
   timeouts, retries, and a staging step if the source can fail partially.
3. Add a Zod schema in `src/data/schemas/`, a module in `src/data/` that parses the generated file,
   and tests with a `SNAPSHOT` never-shrink guard and whatever internal identities the data has.
4. Add an `npm run` script, a step in `refresh-data.yml`, and an entry in `DATASETS` in
   `scripts/data-report.mjs`.
5. Export it under `src/pages/data/` and list it in `src/pages/data/index.json.ts`,
   `src/pages/data/index.astro` and `src/pages/llms.txt.ts`.
6. Write an ADR if it changes a decision; update SOURCES.md, CHANGELOG.md and AGENTS.md.
