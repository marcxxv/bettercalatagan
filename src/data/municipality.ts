/**
 * Municipal identity and income classification.
 *
 * Only values independently verified during the September 2026 reconciliation
 * appear here. Deliberate omissions are recorded in `WITHHELD` at the bottom of
 * this file so that their absence is visible rather than silent.
 */
import type { Sourced } from './types/provenance.js';
import type { IncomeClassification, Municipality } from './schemas/civic.js';
import {
  BLGF_MC_020_2024,
  DOF_DO_074_2024,
  PSA_OPENSTAT_CENSUS_2024,
  PSGC_CLOUD,
  PSGC_GITLAB,
} from './sources.js';

export const municipality: Sourced<Municipality> = {
  data: {
    name: 'Calatagan',
    officialName: 'Municipality of Calatagan',
    province: 'Batangas',
    region: 'IV-A',
    regionName: 'CALABARZON',
    islandGroup: 'luzon',
    psgc10: '0401008000',
    psgc9: '041008000',
    barangayCount: 25,
  },
  source: {
    sources: [PSA_OPENSTAT_CENSUS_2024, PSGC_GITLAB, PSGC_CLOUD],
    asOf: 'PSGC as used in the PSA 2024 Census of Population',
    lastVerified: '2026-09-22',
    verification: 'verified',
    status: 'current',
    tier: 1,
    expectedRefresh: 'irregular',
    isLatestKnownOfficial: true,
    methodology:
      "PSA's own statistical database returns Calatagan under geographic key 0401008000 with its 25 barangays, confirming both the municipal code and the barangay set. Cross-checked against two independent PSA-derived mirrors, which agree.",
    note: 'The province and region are independently corroborated by BLGF MC No. 020.2024, which lists Calatagan under Region IV-A, Batangas.',
  },
};

/**
 * Calatagan was reclassified from 2nd to 1st class municipality in the First
 * General Income Reclassification under R.A. No. 11964.
 *
 * Verified by reading Annex A of BLGF MC No. 020.2024 directly: the Batangas
 * municipalities block lists Calatagan with previous class "2nd" and new class
 * "1st". Note that the DTI CMCI profile still displays "Second Class
 * Municipality" — CMCI carries stale metadata for this LGU.
 */
export const incomeClassification: Sourced<IncomeClassification> = {
  data: {
    incomeClass: 1,
    previousIncomeClass: 2,
    effectiveFrom: '2025-01-01',
    issuance:
      'DOF Department Order No. 074.2024 (5 November 2024), transmitted by BLGF Memorandum Circular No. 020.2024 (9 December 2024)',
    legalBasis:
      'Republic Act No. 11964 — Automatic Income Classification of Local Government Units Act',
  },
  source: {
    sources: [BLGF_MC_020_2024, DOF_DO_074_2024],
    asOf: 'Effective 1 January 2025',
    lastVerified: '2026-09-22',
    verification: 'verified',
    status: 'current',
    tier: 1,
    expectedRefresh: 'per-issuance',
    isLatestKnownOfficial: true,
    methodology:
      'Read directly from Annex A of the BLGF circular, Batangas municipalities block, page 13 of 32. The Order took effect on 1 January 2025 upon publication in the Official Gazette on 9 December 2024.',
    note: 'The DTI CMCI LGU profile still shows "Second Class Municipality". CMCI is stale on this field and must not be used for income class.',
  },
};

/**
 * Facts deliberately not published, with the reason. Rendered on the Sources
 * page so that gaps are visible to readers rather than merely absent.
 */
export const WITHHELD: readonly { fact: string; reason: string }[] = [
  {
    fact: 'Land area',
    reason:
      "PSA's own statistical table gives 10.50 km² and computes a 2024 density of 5,754 persons per km² from it. Comparable Batangas municipalities in that same table sit near 50 km², and a widely circulated figure for Calatagan is 101.50 km², which would make PSA's value a dropped digit. We cannot confirm which is right, so we publish neither.",
  },
  {
    fact: 'Current elected officials',
    reason:
      'Election results for May 2025 are available from a civic-tech derivative of COMELEC data, but results are not the same as present incumbency, and no COMELEC or DILG primary source has been read. Scheduled for a later phase.',
  },
  {
    fact: 'Municipal office contact details',
    reason:
      'The telephone number, e-mail address and postal address published on the DTI CMCI profile sit in the same LGU-submitted record whose income class, mayor and website fields are all demonstrably out of date. Treated as unverified until confirmed against a current source.',
  },
  {
    fact: 'Poverty incidence and other social statistics',
    reason:
      'Not yet retrieved from a primary source. PSA OpenSTAT carries poverty tables; they have not been fetched or reviewed.',
  },
  {
    fact: 'Financial figures from Full Disclosure Policy filings',
    reason:
      'The transparency section indexes the filings and links to each DILG original. No amount has been extracted from a spreadsheet or restated, because extraction has not yet been reviewed for accuracy.',
  },
  {
    fact: 'COA audit figures and findings, and planning-document facts',
    reason:
      'COA is unreachable to this project\u2019s tooling, and the planning documents circulate only on third-party document hosts with no government-hosted copy and no confirmed adoption status.',
  },
];
