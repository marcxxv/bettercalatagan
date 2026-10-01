# 0011 — An interactive barangay map with outside map tiles

**Status:** Accepted · 2026-10-01 · Narrows ADR 0002 ("no third-party requests") for one page

## Context

Residents think of Calatagan by place first: which barangay, where. A list of 25 names with
numbers does not show that Balitoc and Tanagan are neighbours or that the poblacion is on the
coast. PSA publishes barangay codes but no boundary files; an open civic-tech dataset of
PSGC-coded barangay shapes (faeldon/philippines-json-maps, MIT, from altcoder's PSGC shapefiles)
covers all 25 of Calatagan's codes.

A readable map also needs a basemap (coast, roads) and, for 3D, elevation. Neither can be
self-hosted sensibly on a static site.

## Decision

- **Outlines** come from `scripts/boundaries.mjs`, which refuses to write unless the file holds
  exactly PSA's 25 codes, drops the dataset's area fields, and rounds to about a metre. They are
  published at tier 2 with the caveat that they are approximate and for orientation only. No area
  or density is ever computed from them (land area stays withheld).
- **The page works without the map.** `/barangays` renders an SVG map of the outlines on the
  server: every barangay a link, shaded by population, no outside requests.
- **The 3D map loads only when it scrolls into view.** MapLibre GL is bundled with the site (an
  npm dependency, lazily imported: no CDN script). It then requests vector tiles and fonts from
  OpenFreeMap and elevation tiles from the public AWS Terrain Tiles bucket. These are the only
  third-party requests on the site, and only on this page. The privacy notice names them.
- **The map's colours are the site's tokens**, read at runtime, so it follows light and dark mode
  and never looks like someone else's map.

## Consequences

- A visitor who scrolls to the map sends their IP address to OpenFreeMap and AWS. Stated on
  /about#privacy. If either service disappears, the tiles fail and the SVG map remains.
- MapLibre adds about 1 MB of JavaScript, loaded only on this page and only on demand.
- Barangay profile pages do not embed the map yet; a later change can reuse the component.
