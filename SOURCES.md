# Source inventory

The evidence base for Better Calatagan. Maintained by hand; last reviewed **2026-09-22**.

Ranks refer to the evidence hierarchy in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## In use (published data rests on these)

| Source | Publisher | Rank | Covers | Format | Notes |
| --- | --- | --- | --- | --- | --- |
| [BLGF MC No. 020.2024](https://blgf.gov.ph/wp-content/uploads/2024/12/04.-BLGF-MC-No.-020.2024.pdf) | Bureau of Local Government Finance | 1 | Income reclassification, effective 2025-01-01 | PDF (OCR text layer) | Annex A, p.13 of 32 lists Calatagan: previous `2nd`, new `1st`. SHA-256 recorded in `src/data/sources.ts`. |
| [DOF DO No. 074.2024](https://blgf.gov.ph/wp-content/uploads/2025/01/DOF-DO-074.2024.pdf) | Department of Finance | 1 | The Order itself | PDF (scanned, **no** text layer) | 36 pp. Transmitted by the circular above. |
| [PSA OpenSTAT — 2024 Census by barangay](https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2024/0041A6DTPH3.px) | Philippine Statistics Authority | **1** | 2024 population, household population, households, per barangay | PxWeb API (JSON/CSV) | **The PSA blocker is solved.** PSA's editorial pages return a bot challenge; its statistical database does not. Geo keys are PSGC codes. |
| [PSA OpenSTAT — population, land area, density](https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2024/0221A6DLPD0.px) | Philippine Statistics Authority | **1** | 2015/2020/2024 counts per municipality | PxWeb API | Also carries the land-area column discussed below. |
| [PSGC API](https://psgc.gitlab.io/api/municipalities/041008000/barangays/) | psgc.gitlab.io (PSA mirror) | 3 | PSGC codes, barangay names | JSON | Now a cross-check rather than the basis. |
| [PSGC Cloud API](https://psgc.cloud/api/municipalities/0401008000/barangays) | psgc.cloud (PSA mirror) | 3 | PSGC codes, 2020 barangay populations | JSON | Independent of the above. Its `status` field carries the 2020 CPH count. |
| [PhilAtlas — Calatagan](https://www.philatlas.com/luzon/r04a/batangas/calatagan.html) | PhilAtlas | 3 | 2020 CPH totals, barangay breakdown | HTML | Cross-check. Land area shown as 101.50 km² attributed to a 2013 figure. |

## Known and characterised, not yet used

| Source | Publisher | Rank | Covers | Access | Notes |
| --- | --- | --- | --- | --- | --- |
| [DILG Full Disclosure Policy Portal](https://fdpp.dilg.gov.ph/fdpp/report/index?region_filter=04&province_filter=010&lgu_filter=08) | DILG | 1 | 156 filings, 14 statutory forms, CY2022–CY2026 | Public, no auth | See the format audit below. The backbone of a later phase. |
| [BetterGov Officials API](https://officials.bettergov.ph/api/v1/contests?province=batangas&town=calatagan&year=2025&candidates=1) | BetterGov.ph, from Open Halalan | 4 | Local election results 2001–2025 | JSON, no auth | Results, **not** incumbency. Carries `match_confidence` per candidacy. |
| [DTI CMCI — Calatagan](https://cmci.dti.gov.ph/lgu-profile.php?lgu=Calatagan) | DTI | 3 | Competitiveness scores 2015–2024 | HTML | **Its LGU profile block is stale**: income class, mayor and website fields are all out of date. Do not use for identity facts. |
| [COA](https://www.coa.gov.ph/) | Commission on Audit | 1 | Annual Audit Reports | **Blocked** (bot challenge) | A CY2022 executive summary URL is known to exist. Coverage unconfirmed. |
| [PSA editorial site](https://psa.gov.ph/) | Philippine Statistics Authority | 1 | Census write-ups, PSGC pages | **Blocked** (bot challenge) | Superseded for our purposes by OpenSTAT above, which serves the same releases as data. |
| [PhilGEPS](https://notices.philgeps.gov.ph/) | Procurement Service, DBM | 1 | Procurement notices | Public, session-based | Reference numbers are the stable join key. |
| [Internet Archive — calatagan.gov.ph](https://web.archive.org/web/*/calatagan.gov.ph) | Internet Archive | 7 | 236 documents, 2016–2022 | Public | The official site is offline; see below. |

---

## Findings from the 2026-09-22 verification

### The official municipal website is offline

`calatagan.gov.ph` has **no A record**. The domain is still delegated to DICT nameservers
(`ns3/4/5.dns.gov.ph`) with SOA serial `2025102103`, and `www` is a CNAME to the apex, so the zone
exists but nothing resolves.

This is a *partial* correction to a stronger claim made elsewhere that the domain returns
NXDOMAIN/SERVFAIL with inactive nameservers: the nameservers answer, and the zone is live. The
practical effect is the same — the site is unreachable — but the diagnosis differs.

Archive coverage runs 2010 through 2025 (283 snapshots in 2025 alone) and stops. Documents
recovered: 236, by upload year — 2016: 60, 2017: 13, 2018: 1, 2019: 103, 2020: 4, 2022: 47.

### FDP Portal: measured format audit

All 156 Calatagan filings were requested and the returned bytes inspected. Measured twice — once
by hand, then again by the committed pipeline with retries:

| Result | Count | Share |
| --- | --- | --- |
| Genuine XLSX (Office Open XML) | 133 | 85% |
| **HTTP 500 — download fails** | 23 | 15% |
| PDFs | **0** | 0% |
| HTML served as `.xlsx` | **0** | 0% |

File type is determined from magic bytes, not from the declared `content-type`. Successful files
range 9 KB – 8.45 MB. One file was parsed to confirm real content: *FDP Form 10a — Bid Results on
Civil Works, Municipality of Calatagan, CY2026 Q2*, listing reference numbers `RBP-ITB-2026-10` to
`-21` with bidders, amounts and dates.

Filings by document year: 2022 (2), 2023 (44), 2024 (44), 2025 (44), 2026 (22). Of the 14 forms,
10 are quarterly and 4 annual.

**TLS note.** The DILG server does not send its intermediate certificate, so clients that do not
already hold it fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. The pipeline supplies the
intermediate from `certs/` rather than disabling verification.

**Consequence for architecture:** an OCR pipeline is **not** justified by the evidence — there are
no scanned PDFs in this corpus. What *is* required is retry and failure handling for a ~15%
server-side error rate, and recording which filings could not be retrieved.

Document IDs are durable per upload (observed range 5,529 – 264,887, assigned sequentially
portal-wide) but a re-submission will receive a **new** id, so ids identify a *file*, not a
*filing slot*. Index on (form type, document period) and treat the id as a pointer.

### The PSA blocker, and how it was solved

PSA's editorial web pages (`psa.gov.ph`, `rsso04a.psa.gov.ph`) return HTTP 403 behind a bot
challenge. **PSA OpenSTAT** — PSA's own PxWeb statistical database — answers normally and serves
the same census releases as structured data. It is the same authority, so it is a rank-1 primary
source, and the census figures now rest on it rather than on aggregators.

What that unblocked, all promoted to tier 1:

- 2024 population **60,420**, household population **60,337**, households **15,442**
- Census series **2015: 56,449 · 2020: 58,719 · 2024: 60,420**
- Barangay-level 2024 population and households for all 25 barangays, reconciling **exactly** to
  the municipal totals
- Barangay names and PSGC codes, since OpenSTAT keys its geography by PSGC

One correction this produced: the household count of **14,267** that circulates widely (and which
the adversarial audit repeated from Wikipedia) is **wrong**. PSA reports **15,442**.

### Source conflicts on the record

| Fact | Value A | Value B | Treatment |
| --- | --- | --- | --- |
| Population | **PSA OpenSTAT 60,420** (1 Jul 2024) | DTI CMCI 64,234 | **PSA published.** CMCI's basis is undocumented and its profile block is stale on several fields. |
| Households | **PSA OpenSTAT 15,442** | 14,267 (widely repeated) | **PSA published.** |
| Land area | **PSA OpenSTAT 10.50 km²** | 101.50 km² (PhilAtlas) / 112.00 km² | **Neither published — see below.** |

### The land-area problem

PSA's own table reports **10.50 km²** for Calatagan and derives a 2024 density of **5,754 persons
per km²** from it. That is an order of magnitude denser than comparable municipalities in the very
same table:

| Municipality | 2024 population | Land area (km²) | Density |
| --- | --- | --- | --- |
| Agoncillo | 40,662 | 49.67 | 819 |
| Bauan | 94,016 | 51.49 | 1,826 |
| Rosario | 131,365 | 224.03 | 586 |
| **Calatagan** | **60,420** | **10.50** | **5,754** |

A density of 5,754/km² would make this rural coastal municipality denser than many Philippine
cities. The widely circulated alternative, 101.50 km², yields 595/km², which fits its neighbours —
and 10.50 versus 101.50 is consistent with a dropped digit.

We cannot confirm which is correct from a second primary source, so **we publish neither**. The
raw PSA value is recorded in the dataset for audit, flagged as a suspected source error. Note also
that the provincial total in this table (2,725.23 km²) differs from the 3,119.75 km² figure used
elsewhere, so the discrepancy may be a boundary-vintage issue rather than a simple typo.
| Income class | BLGF/DOF **1st class**, effective 2025-01-01 | CMCI **Second Class Municipality** | **1st class published.** CMCI is stale. |
| Barangay PSGC codes | Two mirrors: `001–011, 013–023, 026–028` | A claimed sequential `001–025` | **Mirrors published.** The sequential claim is wrong; see below. |

### On the barangay code "gap"

Codes 012, 024 and 025 are **not assigned** within Calatagan. Both independent mirrors agree.

An explanation circulating elsewhere — that the gaps are an artefact of "provincial-level database
queries that include deleted historical sitios in other municipalities, offsetting numeric primary
keys" — is not tenable. PSGC codes are hierarchical, not sequential keys: every Calatagan barangay
code begins `0401008`, and nothing in another municipality can shift them. The gaps are real and
are preserved by a test.

---

## Open items

1. **Read a PSA-hosted page.** This single blocker drives four separate limitations: the 2024
   POPCEN count (60,420) and the barangay-level 2020 populations are both held at tier 3 and not
   published, while the PSGC codes and the 2020 municipal total are published only at tier 2 with
   caveats. The page of record for the population figure is *Highlights of the 2024 Census of
   Population (POPCEN) for Batangas Province* on the PSA CALABARZON site. Every PSA host returns a
   bot challenge to this project's tooling, so no maintainer has opened it.
2. **Confirm the barangay names and codes against a PSA-hosted PSGC page**, replacing the two
   mirrors and promoting that dataset from tier 2 to tier 1.
3. **Establish land area from a PSA source** and resolve 101.50 vs 112.00 km².
4. **Confirm current incumbency** of elected officials against COMELEC or DILG, not election
   results and not media.
5. **Establish COA Annual Audit Report coverage** for Calatagan beyond the known CY2022 summary.
6. **Find government-hosted copies** of the Comprehensive Development Plan 2017–2026 and the CLUP
   (2018–2027 and the 2023–2032 draft). Copies circulate on third-party document hosts; adoption
   status and authenticity are unconfirmed, so none is cited here.
7. **Verify municipal contact details** independently of the DTI CMCI profile block, whose other
   fields are demonstrably stale.
