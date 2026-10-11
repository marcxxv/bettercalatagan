# Licensing

Three distinct things live in this repository and they are **not** covered by one licence. Getting
this wrong would mean claiming rights over government documents we do not own, so the boundary is
drawn explicitly.

## 1. Code — MIT

Everything under `src/` that is program logic, plus configuration, build tooling and scripts.
See [LICENSE](LICENSE).

## 2. This project's own compilation — CC BY 4.0

Our original contribution: the schemas, the provenance records we authored, our annotations,
methodology notes, caveats, the selection and arrangement of datasets, and the prose in this
repository and on the site. See [LICENSE-CONTENT](LICENSE-CONTENT).

This covers **our compilation and commentary**, not the underlying government facts. Bare facts —
that a municipality has 25 barangays, that its PSGC is `0401008000` — are not ours to license and
are not claimed.

## 3. Cited government documents — not licensed by us

Documents issued by Philippine government agencies — BLGF circulars, DOF orders, PSA releases, COA
reports, DILG FDP filings, municipal ordinances and plans — remain the works of their issuing
agencies and are governed by Philippine law, including the Intellectual Property Code of the
Philippines (R.A. No. 8293) and the rules each agency applies to its own publications.

**We do not relicense them, and applying CC BY 4.0 to them would be incorrect.** Our practice:

- **Link first.** Cite the agency's own URL as the canonical location.
- **Describe, don't absorb.** We record metadata — title, issuing body, date, locator, checksum —
  rather than republishing documents wholesale.
- **Mirror only where justified**, and only with attribution, where a document is at genuine risk
  of loss (as happened when `calatagan.gov.ph` went offline). A mirror is a preservation copy, not
  a claim of ownership.
- **Attribute always.** Every citation names the issuing agency.

Public factual corrections can be reported through GitHub issues. Do not post personal data,
legal notices or confidential material there. A private reporting channel is not yet configured;
see `docs/reporting.md` for the setup requirement and review process.

The document reader passes source bytes through the host, which may cache responses according to
`vercel.json`. This is not a separately maintained preservation mirror or a grant of reuse rights.

## Artwork, marks and map services

Agency marks credit sources and do not indicate endorsement. The municipal seal rendition is
maintainer-supplied historical artwork; its underlying municipal identity is not relicensed.
Reproduction restrictions and the supplied reference's rights require separate review.
See `public/images/README.md` and `docs/audits/2026-10-11-report.md`.
Channel marks are third-party assets, not project-owned CC BY material. Their origins are recorded
in `public/icons/channels/README.md`; use remains subject to the platforms' applicable terms.
Fonts keep their separate OFL licences. Map outlines retain their source attribution; OpenFreeMap
and AWS terrain tiles are external services, not assets licensed by this repository.

## Third-party document hosts

Copies of Calatagan material circulate on Scribd, Studocu and similar sites. Those uploads carry
no evidence of authenticity, completeness or adoption status, and the hosts' own terms are not a
licence granted by the issuing agency. This project does not cite them as authority and does not
mirror from them.

## Typefaces

The site self-hosts two typefaces, both under the SIL Open Font License 1.1, with their licence
texts alongside the font files in `public/fonts/`:

- **Source Serif 4** (Adobe) — `OFL-source-serif-4.txt`
- **Public Sans** (U.S. Web Design System) — `OFL-public-sans.txt`
