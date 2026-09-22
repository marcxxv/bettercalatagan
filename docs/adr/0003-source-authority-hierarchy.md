# 0003 — A ranked source-authority hierarchy

**Status:** Accepted · 2026-09-22

## Context

Calatagan's own municipal website is offline, so information must be assembled from national
repositories, derived datasets, archives and, in places, social media. Without an explicit ranking,
the path of least resistance is to cite whatever is reachable — which in practice means Wikipedia,
Scribd and Facebook.

That is not hypothetical. An independent audit of this project's research sourced Calatagan's
income class, population, land area, household count and barangay codes to **Wikipedia**, cited
**Scribd** for municipal planning documents, cited **media outlets** while describing them as
"COMELEC certified canvass returns", and supported a fire-station hotline with a Facebook post from
a station in a different province.

## Decision

Sources carry an `authority` rank from 1 (primary government) to 10 (tertiary). A published record
(tier 1 or 2) requires at least one source at rank 4 or better, enforced by schema.

A lower-authority source may be used to **discover** evidence but must never silently stand in for
a higher-authority one.

Two consequences worth stating plainly:

- **A third-party document host is not a government source.** A municipal plan on Scribd may well
  be genuine, but the host attests nothing about authenticity, completeness or adoption.
- **An agency's own social media account is still social media** (rank 9). Good evidence that a
  figure exists; not the page of record.

## Consequences

Some genuinely correct facts will be unpublishable until someone retrieves a better source. The
2024 population count is the current example.

This is the intended trade. The project's value rests on a reader being able to trust that a
published number was read from a document, and the only way to keep that promise is to decline the
convenient citation.
