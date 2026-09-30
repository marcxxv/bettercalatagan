# 0009 — The Better LGU information architecture, held to this site's evidence standard

**Status:** Accepted · 2026-09-30 · Extends [0006](0006-editorial-redesign.md)

## Context

The active portals in the Better LGU directory (github.com/jmacj/better-lgu-directory: Los Baños,
Cabanatuan, Baler, Indang, Tanay, Solano, Bacolod and others, read from their repositories) share
one information architecture, most of it inherited from the BetterGov.ph template:

- **Services** by category (certificates, business, health, social welfare, agriculture…), with
  hotlines and holidays;
- **Government**: officials, departments, barangays, and legislation ("OpenLGU": ordinances,
  resolutions, executive orders);
- **Statistics**: demographics, DTI competitiveness (CMCI), municipal income;
- **Transparency**: financial reports, Full Disclosure Policy, procurement (PhilGEPS), DPWH
  infrastructure;
- plus About, Accessibility, Sitemap, and a footer linking the BetterGov network and national
  sources.

This site had a flat navigation of seven pages and none of Services, Statistics, legislation,
procurement, infrastructure, hotlines, holidays, accessibility or a sitemap. A resident who had
used another Better LGU portal would not find their way.

The portals differ from this one in evidence standard. Most publish officials, office phone
numbers and service fees without dates or sources; several read DPWH and PhilGEPS data through a
search service whose key is embedded in their bundles.

## Decision

**Adopt the shared structure; fill it only with what can be sourced.** The design (0005, 0006)
does not change: the new pages use the same page header, provenance card, record list and tokens.

- **Navigation** is grouped: Overview · Services · Government · Statistics · Transparency · About
  (`NAV_GROUPS` in `src/lib/site.ts`, which also drives the footer directory, sitemap, `llms.txt`,
  search index and the assistant's section names). Groups are native `<details>` menus: they open
  on hover with a mouse, on click or keyboard otherwise, and work without JavaScript.
- **Services** come from the 18 office Citizen's Charters of 2022 (archived): 119 services by
  topic, each naming its office and opening its dated charter. Fees, requirements and processing
  times stay in the charters, not restated as current.
- **Infrastructure** is DPWH's own contract data, read through BetterGov.ph's open DPWH API (no
  key), and placed in Calatagan only by the contract's own description (a tested rule). Road
  segments with no municipality and multi-town packages are listed, not counted.
- **Statistics** adds DTI's CMCI, read from DTI's ranking tables, always with the category and
  field size; DTI's blank 2018 scores are shown as not published.
- **Legislation** and **Procurement** regroup documents already in the archive index, with
  DPWH's bidding records and a pointer to the DILG bid-results filings.
- **Barangays** get one profile each: census counts and the DPWH projects that name them.
- **Holidays** come from the proclamations themselves (the annual one read from its signed,
  scanned copy), including Calatagan's own special days. **Hotlines** list only numbers fixed by
  executive order (911, 8888); local numbers stay withheld.
- **Not adopted:** officials and barangay captains (incumbency unverified, 0003/CONTRIBUTING),
  office contact details (stale), tourism listings (no primary source found), and any data behind
  another project's API key.

## Consequences

- Two new pipelines (`dpwh:fetch`, `cmci:fetch`) join the weekly refresh and its change report.
- The Supreme Court E-Library omits an intermediate certificate; it is supplied from `certs/`, as
  DILG's is (never bypassed).
- Astro's HTML compression was found to drop spaces before inline elements across the site
  ("on theFinances"); it is now off (`compressHTML: false`). The host compresses responses.
- The assistant's corpus grew from 286 to about 620 passages with no change to the assistant:
  it indexes whatever the built pages say.
