# 0010 — Local emergency hotlines, published on the maintainer's attestation

**Status:** Accepted · 2026-09-30 · Narrows the "office contact details" item in `WITHHELD`

## Context

Local contact details were withheld (see `municipality.ts`): the only records this project could
read were years old, and CI failed any build containing the Batangas area code "(043)". Residents
need emergency numbers more than anything else on the site.

The municipality published an "Updated Calatagan Emergency Hotlines" poster (MDRRMO, PNP, BFP,
RHU, Coast Guard, Medicare, BATELEC, and 911). Its record is a Facebook post, which this project's
tooling cannot read (login wall), and social media ranks 9 of 10 in the evidence hierarchy: too
weak, under the rules, to publish from. The maintainer supplied the poster and attests that it is
the municipality's current list.

## Decision

- A `DataSource` may carry an **`attestation`**: the maintainer's written statement that a
  social-media record is the official, current one. With an attestation, a record resting on a
  `social-media` source may be published at **tier 2 only** (never tier 1), with a caveat shown
  to the reader. The schema enforces all three conditions.
- The local hotlines are published this way (`localHotlines` in `calendar.ts`), numbers copied as
  printed. **911 stays first** everywhere. The MDRRMO's Gmail address is not published.
- CI's "(043)" check was a proxy for the stale numbers; it now names the stale CMCI number
  ("419-0150") instead. The assistant may state a phone number only if the site's own passages
  contain it; any other number still withdraws the answer.

## Consequences

- A number that changes will be wrong until someone reports it; the caveat asks readers to.
- Attestation is not a general escape hatch: it covers official accounts' current contact
  information, and every use must be recorded in an ADR like this one.
