import type { APIRoute } from 'astro';
import { financialsSource, sreDataset, verifiedFilings } from '../../data/financials';
import { envelope } from '../../lib/export';

/** Figures extracted from the Statement of Receipts and Expenditures. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'sre-financials',
    data: verifiedFilings,
    sources: financialsSource,
    notes: [
      `Form: ${sreDataset.formReference}.`,
      'Figures are reported by the LGU to DILG and are NOT audited. The Commission on Audit publishes separate audited statements on a different accounting basis; the two should not be compared line for line.',
      'Quarterly figures are cumulative within a calendar year: a Q3 value already includes Q1 and Q2.',
      'Every value carries the cell it was read from, e.g. "G24". The original filing is authoritative where they differ.',
      'Column D ("budget") is a revenue target on income rows and an appropriation on expenditure rows; the `kind` field records which.',
      `Only filings whose own internal identities reconcile are included. ${verifiedFilings.length} of ${sreDataset.extractedCount} extracted filings qualify.`,
    ],
  });
