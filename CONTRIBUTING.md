# Contributing to Better Calatagan

Thank you for helping. This project publishes information about a real municipality that real
people rely on, so the bar for evidence is higher than for most codebases.

**The one firm rule: every civic fact needs a source.** A correction without a source will be
declined even when it is right, because the project has no way to tell the difference between a
well-informed neighbour and a confident guess. If you know something is wrong but cannot cite it,
open an issue describing what is wrong — that is genuinely useful, and someone can then go find
the evidence.

---

## The evidence hierarchy

Sources are ranked. A lower-authority source may help you *discover* evidence, but it must never
silently stand in for a higher-authority one.

| Rank | `authority` value | Examples |
| --- | --- | --- |
| 1 | `primary-government` | DOF/BLGF issuances, COA reports, PSA releases, COMELEC canvass |
| 2 | `government-hosted-copy` | Municipal documents hosted on a `.gov.ph` site |
| 3 | `government-derived-dataset` | PSGC mirrors, PhilAtlas |
| 4 | `civic-tech-derivative` | BetterGov APIs, Open Halalan |
| 5 | `academic` | Peer-reviewed or institutional research |
| 6 | `reputable-secondary` | Established news organisations |
| 7 | `archived-official` | Web archive copies of a formerly official page |
| 8 | `third-party-document-host` | Scribd, Studocu, CourseHero |
| 9 | `social-media` | Official agency accounts on social platforms |
| 10 | `tertiary` | Wikipedia and similar aggregators |

A **published** record (tier 1 or 2) needs at least one source at rank 4 or better.

Two practical consequences, both learned the hard way:

- **A document on Scribd is not a government source.** It may well be a real municipal plan, but
  the host tells you nothing about authenticity, completeness or adoption status. Cite the
  government copy, or record it as tier 3 until someone finds one.
- **An official agency's social media post is still social media.** It is good evidence that a
  figure exists; it is not the page of record. Chase the page of record.

## Provenance fields

Every record carries a `DataSource`. Three fields are routinely confused:

- **`asOf`** — the period the *data describes* ("1 July 2024", "CY2026 Q2").
- **`lastVerified`** — when a *human last checked* the record against its sources.
- **`accessedOn`** (per source) — when someone last actually opened that URL.

These are independent. A census from 2020 verified this morning has an old `asOf` and a recent
`lastVerified`, and that is correct.

**Never set `accessedOn` for a URL you did not open.** If a source is blocked or unreachable, say
so in `SOURCES.md` under open items rather than inventing an access date.

### Status, not age

We do not have a global "stale after N months" rule, because age alone decides nothing. A census
two years past its reference date is still the **latest official release**. A phone number checked
last month may already be wrong.

Use `status` to say what the record *is*: `current`, `latest-official`, `historical`, `archived`,
`draft`, `unverified`. Set `isLatestKnownOfficial` when nothing newer has been issued.

### Readiness tiers

| Tier | Meaning |
| --- | --- |
| 1 | Verified. Published as-is. Requires `verification: 'verified'`. |
| 2 | Published **with a caveat shown to the reader**. The `caveat` field is mandatory. |
| 3 | Internal only. Kept in the repository for auditability; never rendered or exported. |
| 4 | Withheld — contradictory, obsolete, or unsafe. |

## Handling conflicts between sources

When two sources disagree, **publish the disagreement**; do not quietly pick a winner.

1. Prefer the higher-authority source.
2. Record the other value, its source, and the reason it was not used.
3. If neither can be confirmed, publish **neither** and add an entry to `WITHHELD` explaining why.

Do not invent an explanation for a discrepancy. "Source B is probably a projection" is a
hypothesis, not a finding, unless a source actually says so.

## Political and personal data

For elected officials we record **facts only**: name, office, term, party where officially
documented, election result metadata, sources, verification dates.

We do **not** publish biographies, rankings, evaluations, characterisations of performance or
motive, or inferences about competence. We do not publish the names of individual civil servants
in routine administrative posts, because those rotate and the harm from being wrong falls on a
private individual.

Election results are not the same as **incumbency**. A person can win an election and not be in
office. Confirm current incumbency separately before describing anyone as the present officeholder.

## Making a change

1. Fork and branch.
2. Add or amend the record, with its full provenance envelope.
3. Add a line to `CHANGELOG.md` under *Unreleased* — this changelog tracks **data** changes, not
   just code.
4. Update `SOURCES.md` if you added a source or closed an open item.
5. Run `npm run check` (typecheck, lint, tests, build). It must pass.
6. Open a PR explaining which source you read, and what it said.

### Pull request checklist

- [ ] Every new fact has at least one `SourceReference` with a working https URL.
- [ ] `accessedOn` reflects a URL I actually opened.
- [ ] `lastVerified` is today or earlier.
- [ ] Tier and `verification` are consistent, and tier 2 records carry a `caveat`.
- [ ] Any conflicting source is recorded rather than discarded.
- [ ] No biographical or evaluative content about any individual.
- [ ] `npm run check` passes.

## Code of conduct

Be straightforward and courteous. Assume contributors are acting in good faith. Disagreements
about evidence are normal and are settled by looking at the source together.
