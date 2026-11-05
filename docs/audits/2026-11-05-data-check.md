# Data check — 5 November 2026

Run by an AI agent (Claude) at the maintainer's request. It records what was re-read from
primary sources today. `lastVerified` records a person's review (AGENTS.md §1.5): the maintainer
read this check and directed that the dates below advance to 2026-11-05 (census and identity,
DILG filings, SREs, income class). Datasets not listed keep their dates.

| Dataset | Source re-read today | Result |
| --- | --- | --- |
| 2024 census (population, households) | PSA OpenSTAT table `0041A6DTPH3.px`, queried directly | Matches: 60,420 people · 60,337 household population · 15,442 households |
| Census by barangay, population series | PSA OpenSTAT (pipeline `psa:fetch`) | Unchanged; 25 barangays reconcile to the municipal total |
| DILG Full Disclosure filings | DILG FDP portal (pipeline `fdp:stage`, from the Philippines) | 156 filings, portal reports 156; 2023 APP now downloads |
| Statements of Receipts and Expenditures | DILG portal (pipeline `fdp:extract`) | 14 filings, all fully reconciled |
| DPWH projects | BetterGov.ph DPWH API (pipeline `dpwh:fetch`) | 2 contracts added, 3 updated (see CHANGELOG) |
| DTI CMCI, PSA poverty, archive index | Pipelines | Unchanged |
| Municipal identity (PSGC 0401008000, 25 barangays) | PSA OpenSTAT (same query as the census) | Matches |
| Income class (1st, from 1 Jan 2025) | BLGF MC No. 020.2024 PDF | blgf.gov.ph refuses automated requests (HTTP 403), so the Internet Archive capture of the same URL (20260626113040) was read instead: its SHA-256 equals the hash recorded in `sources.ts` (`298d5ee0…a4117`), and Annex A “Page 13 of 32” (PDF page 18) lists Region IV-A · Batangas · Calatagan · 2nd → 1st |

Not checked today: hand-maintained modules (history, services, calendar, hotlines), which have no
pipeline. Their review dates stand as recorded.
