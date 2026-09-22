# 0004 — Stage → review → promote for FDP filings, and a local canonical id

**Status:** Accepted · 2026-09-22

## Context

The DILG Full Disclosure Policy Portal is the most valuable current source for Calatagan: 156
filings across 14 statutory forms, CY2022–CY2026, downloadable without authentication. It is also
the *only* live official channel, since `calatagan.gov.ph` is offline.

Two measured properties shape the design.

**One.** Roughly **15% of download endpoints return HTTP 500** (23 of 155 measured). This is a
portal fault, not a missing filing: the filing is listed, the metadata is intact, only the file
will not come down. A naive scraper that wrote whatever it got would silently delete a filing —
and its checksum — every time the portal had a bad day.

**Two.** Portal document ids are assigned sequentially across the whole portal at upload time
(observed range 5,529–264,887 for Calatagan alone). An id therefore identifies **an uploaded
file**, not a filing. When an LGU resubmits a corrected form, the new upload receives a new id and
any deep link to the old one breaks.

We also measured what is *not* true: the corpus is **132 genuine XLSX files and zero PDFs**. The
HTML responses are HTTP 500 error pages, not spreadsheets in disguise.

## Decision

**A local canonical id derived from civic meaning**, with the portal id kept as metadata:

```
fdp-2026-q2-bid-results        ← ours; stable across resubmissions
264887                          ← DILG's; identifies today's file
```

The id is `fdp-<year>[-q<n>]-<form-slug>` and is asserted by schema to match the record's own form
and period, so it cannot drift from what it describes. Prior portal ids are retained in
`supersededFdppIds`.

**A two-step pipeline** (`scripts/fdp.mjs stage` then `promote`) with three merge rules:

1. A filing already in the reviewed dataset is **never deleted** by a scrape. If the listing stops
   returning it, it is marked `missing-from-source` and kept.
2. A failed download **never overwrites** a previously good checksum. The last known-good file
   metadata is retained and `lastKnownGoodAt` records when it was obtained.
3. A changed portal id is recorded as a resubmission under the same local id.

Downloads retry with exponential backoff on 5xx. Failures are recorded, not swallowed.

**No OCR.** The evidence does not support it. This is written down so that a future contributor
inherits the measurement rather than the assumption — and a test asserts that no PDF has appeared.

**A content fingerprint, not a byte hash.** Measured on the second pipeline run: **all 133
checksums changed** between two runs minutes apart, with no resubmissions and no change in
availability. Fetching the same document twice confirmed why — identical size, identical per-entry
CRC-32, but different zip entry timestamps:

```
t1.xlsx -> [Content_Types].xml (2026, 9, 22, 22, 53, 44) crc 0x7997c0f3
t2.xlsx -> [Content_Types].xml (2026, 9, 22, 22, 53, 46) crc 0x7997c0f3
```

The portal **regenerates each spreadsheet at request time**, stamping the current clock into the
container. A hash of the delivered bytes is therefore worthless for detecting a real revision, and
would have produced a 133-line spurious diff on every refresh — noise that would hide a genuine
change.

We instead hash the zip central directory: each entry's name, CRC-32 and uncompressed size, sorted.
CRC-32 is computed over the entry's *content*, so the fingerprint is stable across regeneration and
still moves when the data moves. Verified stable across two fetches.

**No bulk mirroring in this phase.** We keep official URL → metadata → content fingerprint. The
fingerprint means a silent revision is detectable without holding copies of everything.

## Consequences

The dataset is durable against a portal that is intermittently broken, and reconcilable when the
LGU resubmits. The cost is that `fdp-filings.json` is not a pure mirror of today's portal state —
it is the union of everything observed, annotated. That is the intended trade, and the
`availability` field makes the distinction visible.

If a future phase extracts financial figures from these spreadsheets, that is a separate decision
requiring its own ADR. A test currently asserts that no amount fields exist in this dataset.
