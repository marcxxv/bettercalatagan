/**
 * The citation registry.
 *
 * Every source used by a published civic record is declared here once, so that
 * a reviewer can audit the project's entire evidence base in a single file.
 * `accessedOn` is the date a maintainer last actually opened the URL.
 */
import type { SourceReference } from './types/provenance.js';

/**
 * BLGF Memorandum Circular No. 020.2024 (9 December 2024), transmitting
 * DOF Department Order No. 074.2024 (5 November 2024) with Annex A, the
 * Schedule of Income Classification for the First General Income
 * Reclassification under R.A. No. 11964.
 *
 * Calatagan appears in Annex A, page 13 of 32, in the Batangas municipalities
 * block: previous class "2nd", new class "1st".
 */
export const BLGF_MC_020_2024: SourceReference = {
  name: 'BLGF Memorandum Circular No. 020.2024 (Annex A — Schedule of Income Classification)',
  publisher: 'Bureau of Local Government Finance, Department of Finance',
  url: 'https://blgf.gov.ph/wp-content/uploads/2024/12/04.-BLGF-MC-No.-020.2024.pdf',
  accessedOn: '2026-09-22',
  authority: 'primary-government',
  locator: 'Annex A, page 13 of 32 — Region IV-A, Batangas, Calatagan',
  sha256: '298d5ee0926bd1aed8bd33862de178b7144efb23a029aaa0888eed5b335a4117',
};

/** The Department Order itself, as published by BLGF. Scanned; no text layer. */
export const DOF_DO_074_2024: SourceReference = {
  name: 'DOF Department Order No. 074.2024',
  publisher: 'Department of Finance',
  url: 'https://blgf.gov.ph/wp-content/uploads/2025/01/DOF-DO-074.2024.pdf',
  accessedOn: '2026-09-22',
  authority: 'primary-government',
  locator: 'Schedule of Income Reclassification, effective 1 January 2025',
  sha256: '34bd94787524421fe9e4bdda744773c477c32e096754c49ab127b4d5e45a04e1',
};

/**
 * PSGC API mirrors. Both are community-maintained projections of the PSA's
 * Philippine Standard Geographic Code. They are independent of each other and
 * agree exactly on Calatagan's 25 barangay codes and names.
 *
 * PSA's own PSGC pages sit behind a bot challenge and could not be retrieved
 * directly; see SOURCES.md for the open item.
 */
export const PSGC_GITLAB: SourceReference = {
  name: 'PSGC API — Calatagan barangays',
  publisher: 'psgc.gitlab.io (community mirror of PSA PSGC)',
  url: 'https://psgc.gitlab.io/api/municipalities/041008000/barangays/',
  accessedOn: '2026-09-22',
  authority: 'government-derived-dataset',
};

export const PSGC_CLOUD: SourceReference = {
  name: 'PSGC Cloud API — Calatagan barangays',
  publisher: 'psgc.cloud (community mirror of PSA PSGC)',
  url: 'https://psgc.cloud/api/municipalities/0401008000/barangays',
  accessedOn: '2026-09-22',
  authority: 'government-derived-dataset',
};

/**
 * PhilAtlas republishes PSA census results at barangay level. Used here as an
 * independent cross-check on the barangay population figures, which reconcile
 * exactly to the PSA 2020 CPH municipal total.
 */
export const PHILATLAS_CALATAGAN: SourceReference = {
  name: 'Calatagan, Batangas Profile — 2020 CPH barangay populations',
  publisher: 'PhilAtlas',
  url: 'https://www.philatlas.com/luzon/r04a/batangas/calatagan.html',
  accessedOn: '2026-09-22',
  authority: 'government-derived-dataset',
};

/**
 * PSA Batangas provincial office announcement of the 2024 POPCEN count.
 *
 * Retained as a corroborating citation only. The figure it states is now
 * confirmed from PSA's own statistical database (see PSA_OPENSTAT_CENSUS_2024),
 * which is what the published record rests on.
 */
export const PSA_BATANGAS_POPCEN_2024: SourceReference = {
  name: 'PSA Batangas — 2024 POPCEN population of Calatagan',
  publisher: 'Philippine Statistics Authority, Batangas Provincial Office',
  url: 'https://x.com/PSABatangas/status/1970776856006996447',
  accessedOn: '2026-09-22',
  authority: 'social-media',
  locator: 'Population as of 01 July 2024',
};

/**
 * PSA OpenSTAT — the Philippine Statistics Authority's own statistical database
 * (a PxWeb instance). PSA's editorial web pages return a bot challenge, but the
 * statistical API answers normally, and it serves the same census releases.
 *
 * This is a primary government source and is what the census figures rest on.
 */
export const PSA_OPENSTAT_CENSUS_2024: SourceReference = {
  name: 'PSA OpenSTAT — 2024 Census of Population, CALABARZON by barangay',
  publisher: 'Philippine Statistics Authority',
  url: 'https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2024/0041A6DTPH3.px',
  accessedOn: '2026-09-22',
  authority: 'primary-government',
  locator:
    'Geographic Location 0401008000 (Calatagan) and its 25 barangay codes; parameters: Total Population, Household Population, Number of Households',
};

/** PSA's longitudinal table: 2015, 2020 and 2024 counts per municipality. */
export const PSA_OPENSTAT_SERIES: SourceReference = {
  name: 'PSA OpenSTAT — Population, Land Area and Population Density: 2015, 2020, 2024',
  publisher: 'Philippine Statistics Authority',
  url: 'https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2024/0221A6DLPD0.px',
  accessedOn: '2026-09-22',
  authority: 'primary-government',
  locator: 'Geographic Location 0401008000 (Calatagan)',
};

/*
 * NOTE — deliberately not a SourceReference.
 *
 * The PSA CALABARZON page "Highlights of the 2024 Census of Population (POPCEN)
 * for Batangas Province" is PSA's editorial write-up of this release. It still
 * returns a bot challenge, so no maintainer has opened it and no SourceReference
 * is recorded for it — `accessedOn` would be a false claim.
 *
 * It is no longer a blocker: the underlying figures now come from PSA OpenSTAT,
 * the same authority serving the same release as data.
 */

/**
 * DPWH's published contracts, read through the BetterGov.ph mirror of DPWH's
 * infrastructure transparency data (the same source other Better LGU portals
 * use). DPWH is the author of every value; the mirror is the carrier.
 */
export const DPWH_BETTERGOV_API: SourceReference = {
  name: 'DPWH infrastructure projects (contracts, budgets, contractors, status)',
  publisher: 'Department of Public Works and Highways, via the BetterGov.ph DPWH transparency API',
  url: 'https://api.dpwh.bettergov.ph/projects?search=Calatagan',
  accessedOn: '2026-09-30',
  authority: 'civic-tech-derivative',
  locator: 'Search "Calatagan"; each contract read from /projects/{contractId}',
};

export const DPWH_TRANSPARENCY_BETTERGOV: SourceReference = {
  name: 'BetterGov.ph Transparency — DPWH projects',
  publisher: 'BetterGov.ph',
  url: 'https://transparency.bettergov.ph/dpwh?q=Calatagan',
  accessedOn: '2026-09-30',
  authority: 'civic-tech-derivative',
};

/** DTI's Cities and Municipalities Competitiveness Index, ranking tables. */
export const DTI_CMCI_RANKINGS: SourceReference = {
  name: 'Cities and Municipalities Competitiveness Index — rankings, 1st to 2nd class municipalities',
  publisher: 'Department of Trade and Industry, Competitiveness Bureau',
  url: 'https://cmci.dti.gov.ph/rankings-data.php?unit=1st%20to%202nd%20Class%20Municipalities',
  accessedOn: '2026-09-30',
  authority: 'primary-government',
  locator: 'Row "Calatagan, Batangas", each year from 2015',
};

export const DTI_CMCI_PROFILE: SourceReference = {
  name: 'CMCI LGU profile — Calatagan',
  publisher: 'Department of Trade and Industry, Competitiveness Bureau',
  url: 'https://cmci.dti.gov.ph/lgu-profile.php?lgu=Calatagan',
  accessedOn: '2026-09-30',
  authority: 'primary-government',
  locator: 'Pillar and indicator rankings only; the contact block on this page is stale and not used',
};

/** PSA OpenSTAT, full-year poverty statistics by region and province. */
export const PSA_POVERTY_POPULATION: SourceReference = {
  name: 'PSA OpenSTAT — Annual poverty threshold and poverty incidence among population, by region and province: 2018, 2021 and 2023',
  publisher: 'Philippine Statistics Authority',
  url: 'https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1F__FY/0031F3DF020.px/',
  accessedOn: '2026-10-01',
  authority: 'primary-government',
  locator: 'Table 2; Geolocation: Batangas and Region IV-A (CALABARZON)',
};
export const PSA_POVERTY_FAMILIES: SourceReference = {
  name: 'PSA OpenSTAT — Annual poverty threshold and poverty incidence among families, by region and province: 2018, 2021 and 2023',
  publisher: 'Philippine Statistics Authority',
  url: 'https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1F__FY/0011F3DF010.px/',
  accessedOn: '2026-10-01',
  authority: 'primary-government',
  locator: 'Table 1; Geolocation: Batangas and Region IV-A (CALABARZON)',
};

/* ---------- Holidays and national hotlines ---------- */

/** Proclamation No. 1006, s. 2025: the 2026 holidays. The signed, certified copy (scanned). */
export const PROC_1006_2025: SourceReference = {
  name: 'Proclamation No. 1006, s. 2025 — Regular holidays and special (non-working) days for 2026',
  publisher: 'Office of the President (Presidential Communications Office)',
  url: 'https://pco.gov.ph/wp-content/uploads/2025/09/20250903-PROC-1006-FRM.pdf.pdf',
  accessedOn: '2026-09-30',
  authority: 'primary-government',
  locator: 'Section 1, A–D (page 2 of 3); certified copy, signed 3 September 2025',
  sha256: '1f4e765de7208c685b628cc8bd872ea329918f64d300fcd9115660a892f8e541',
};
export const PROC_1006_2025_ELIBRARY: SourceReference = {
  name: 'Proclamation No. 1006, s. 2025',
  publisher: 'Supreme Court E-Library',
  url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/7/99678',
  accessedOn: '2026-09-30',
  authority: 'government-hosted-copy',
};
export const PROC_1189_2026: SourceReference = {
  name: 'Proclamation No. 1189, s. 2026 — Eid’l Fitr, 20 March 2026',
  publisher: 'Presidential Communications Office',
  url: 'https://pco.gov.ph/news_releases/proclamation-no-1189-s-2026-declaring-friday-20-march-2026-a-regular-holiday-throughout-the-country-in-observance-of-eidl-fitr-feast-of-ramadhan/',
  accessedOn: '2026-09-30',
  authority: 'primary-government',
};
export const PROC_1264_2026: SourceReference = {
  name: 'Proclamation No. 1264, s. 2026 — Eid’l Adha, 27 May 2026',
  publisher: 'Presidential Communications Office',
  url: 'https://pco.gov.ph/news_releases/palace-declares-may-27-as-a-regular-holiday-for-eidl-adha-observance/',
  accessedOn: '2026-09-30',
  authority: 'primary-government',
};
export const PROC_1220_2026: SourceReference = {
  name: 'Proclamation No. 1220, s. 2026 — Calatagan Cultural Day, 30 April 2026',
  publisher: 'Presidential Communications Office',
  url: 'https://pco.gov.ph/news_releases/pbbm-declares-special-non-working-days-in-several-provinces-across-ph/',
  accessedOn: '2026-09-30',
  authority: 'primary-government',
};
export const PROC_1102_2025: SourceReference = {
  name: 'Proclamation No. 1102, s. 2025 — Calatagan Founding Anniversary, 16 December 2025',
  publisher: 'Supreme Court E-Library',
  url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/7/100590',
  accessedOn: '2026-09-30',
  authority: 'government-hosted-copy',
  locator: 'Signed 3 December 2025',
};
export const PROC_1050_2020: SourceReference = {
  name: 'Proclamation No. 1050, s. 2020 — Calatagan Founding Anniversary, 16 December 2020',
  publisher: 'Supreme Court E-Library',
  url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/7/92651',
  accessedOn: '2026-09-30',
  authority: 'government-hosted-copy',
  locator: 'Signed 17 November 2020',
};
export const EO_56_2018: SourceReference = {
  name: 'Executive Order No. 56, s. 2018 — Emergency 911 as the nationwide emergency hotline',
  publisher: 'Supreme Court E-Library',
  url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/83090',
  accessedOn: '2026-09-30',
  authority: 'government-hosted-copy',
  locator: 'Section 1: “911” institutionalized as the Nationwide Emergency Hotline Number, replacing “117”',
};
export const EO_6_2016: SourceReference = {
  name: 'Executive Order No. 6, s. 2016 — the 8888 Citizens’ Complaint Hotline',
  publisher: 'Supreme Court E-Library',
  url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/71975',
  accessedOn: '2026-09-30',
  authority: 'government-hosted-copy',
  locator: 'Sections 1–2',
};
/** Executive Order No. 414, s. 2005: the Calatagan Port Zone. */
export const EO_414_2005: SourceReference = {
  name: 'Executive Order No. 414, s. 2005 — Declaring and delineating the Calatagan Port Zone',
  publisher: 'Supreme Court E-Library',
  url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/5/452',
  accessedOn: '2026-09-30',
  authority: 'government-hosted-copy',
  locator: 'Signed 7 March 2005; port zone of 289,371.64 square metres under the Philippine Ports Authority',
};
