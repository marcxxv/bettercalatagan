/**
 * Municipal finances, extracted from the Statement of Receipts and Expenditures.
 *
 * These are the first figures this project publishes rather than merely links
 * to. Three things make that defensible:
 *
 *  1. The source is a primary government filing (DILG FDP portal, BLGF form).
 *  2. Every value carries the cell it came from, so any figure is traceable.
 *  3. Each filing's own internal identities are re-computed and must hold; a
 *     filing that does not reconcile is not published.
 *
 * The figures remain LGU self-reported and unaudited — that is what an SRE is —
 * so the dataset is tier 2 and carries a caveat saying so.
 */
import raw from './generated/sre-financials.json' with { type: 'json' };
import { sreDatasetSchema, type SreDataset, type SreFiling, type SreItem } from './schemas/sre.js';
import { fdpDataset } from './fdp.js';
import { FDPP_LISTING } from './fdp.js';
import type { DataSource, Sourced } from './types/provenance.js';

/** Throws at build time if the generated dataset does not match the schema. */
export const sreDataset: SreDataset = sreDatasetSchema.parse(raw);

/** Only filings that fully reconciled are published. */
export const verifiedFilings: SreFiling[] = sreDataset.filings
  .filter((filing) => filing.verification === 'verified')
  .sort(
    (a, b) =>
      b.documentPeriod.year - a.documentPeriod.year || b.documentPeriod.quarter - a.documentPeriod.quarter,
  );

const totalChecks = verifiedFilings.reduce((sum, f) => sum + f.reconciliation.total, 0);

export const financialsSource: DataSource = {
  sources: [FDPP_LISTING],
  asOf: periodRange(),
  lastVerified: sreDataset.generatedAt.slice(0, 10) as `${number}-${number}-${number}`,
  verification: 'verified',
  status: 'latest-official',
  tier: 2,
  expectedRefresh: 'quarterly',
  isLatestKnownOfficial: true,
  methodology: `${sreDataset.methodology} Across ${verifiedFilings.length} quarters, ${totalChecks} internal identity checks were recomputed and all passed.`,
  caveat:
    'These figures are reported by the municipality to the DILG and are not audited. They are a statement of what the LGU filed, not an independent assessment of its finances. Each figure links to the original filing; where the two differ, the filing is authoritative.',
  note: 'Quarterly SRE figures are cumulative within a calendar year, so a Q3 value already includes Q1 and Q2.',
};

export const financials: Sourced<SreFiling[]> = {
  data: verifiedFilings,
  source: financialsSource,
};

function periodRange(): string {
  if (verifiedFilings.length === 0) return 'no filings';
  const last = verifiedFilings[0];
  const first = verifiedFilings[verifiedFilings.length - 1];
  return `Q${first.documentPeriod.quarter} CY${first.documentPeriod.year} – Q${last.documentPeriod.quarter} CY${last.documentPeriod.year}`;
}

/** The most recent fully reconciled filing. */
export const latestFiling: SreFiling | undefined = verifiedFilings[0];

export function itemOf(filing: SreFiling, key: string): SreItem | undefined {
  return filing.items.find((item) => item.key === key);
}

/** Headline figures for one filing, in the Total (General Fund + SEF) column. */
export function headline(filing: SreFiling) {
  const value = (key: string) => itemOf(filing, key)?.total?.value ?? null;
  return {
    income: value('total-current-operating-income'),
    localSources: value('local-sources'),
    externalSources: value('external-sources'),
    nationalTaxAllotment: value('national-tax-allotment'),
    realPropertyTax: value('real-property-tax'),
    businessTax: value('tax-on-business'),
    expenditures: value('total-current-operating-expenditures'),
    netOperatingIncome: value('net-operating-income'),
    cashBalanceEnd: value('cash-balance-end'),
  };
}

/** The DILG filing record behind an extraction, for linking to the original. */
export function filingRecord(filingId: string) {
  return fdpDataset.records.find((record) => record.id === filingId);
}

/** Sector spending lines, largest first. */
export function sectorSpending(filing: SreFiling) {
  const keys = [
    'general-public-services',
    'social-services-welfare',
    'economic-services',
    'health-nutrition-population',
    'education-culture-sports',
    'housing-community-development',
    'labor-and-employment',
    'debt-service-interest',
  ];
  return keys
    .map((key) => itemOf(filing, key))
    .filter((item): item is SreItem => Boolean(item))
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: item.total?.value ?? 0,
      cell: item.total?.cell ?? null,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Annual series built from each year's fourth-quarter (full-year) filing. */
export function annualSeries() {
  return verifiedFilings
    .filter((filing) => filing.documentPeriod.quarter === 4)
    .map((filing) => ({ year: filing.documentPeriod.year, filing, ...headline(filing) }))
    .sort((a, b) => a.year - b.year);
}
