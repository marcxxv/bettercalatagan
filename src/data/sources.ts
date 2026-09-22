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
