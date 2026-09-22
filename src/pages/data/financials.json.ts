import type { APIRoute } from 'astro';
import { financialsSource, sreDataset, verifiedFilings } from '../../data/financials';
import { FDPP_LISTING } from '../../data/fdp';

/**
 * Machine-readable export of the extracted SRE figures.
 *
 * Only fully reconciled filings are exported, matching what the site publishes.
 * Every value keeps the cell it came from so a consumer can verify any figure
 * against the original DILG filing.
 */
export const GET: APIRoute = () => {
  const body = {
    data: verifiedFilings,
    meta: {
      api_version: sreDataset.schemaVersion,
      dataset: 'sre-financials',
      form: sreDataset.form,
      form_reference: sreDataset.formReference,
      lgu: sreDataset.lgu,
      psgc: sreDataset.psgc,
      data_vintage: sreDataset.generatedAt,
      period_coverage: financialsSource.asOf,
      quarters_published: verifiedFilings.length,
      quarters_extracted: sreDataset.extractedCount,
      source: {
        name: FDPP_LISTING.name,
        publisher: FDPP_LISTING.publisher,
        url: FDPP_LISTING.url,
        authority: FDPP_LISTING.authority,
      },
      verification: financialsSource.verification,
      readiness_tier: financialsSource.tier,
      caveat: financialsSource.caveat,
      methodology: financialsSource.methodology,
      license: {
        compilation:
          'CC BY 4.0 — applies to this compilation (extraction, line-item keys, provenance metadata) by Better Calatagan.',
        source_documents:
          'NOT covered by the above. The underlying filings are works of the Department of the Interior and Local Government and the Municipality of Calatagan.',
        attribution: 'Better Calatagan (bettercalatagan.org)',
      },
      disclaimer:
        'Better Calatagan is an independent civic project. It is not the official website of the Municipality of Calatagan and is not affiliated with, endorsed by, or operated by any government agency.',
      notes: [
        'Figures are reported by the LGU to DILG and are NOT audited. The Commission on Audit publishes separate audited statements.',
        'Quarterly figures are cumulative within a calendar year: a Q3 value already includes Q1 and Q2.',
        'Each value carries the cell it was read from, e.g. "G24". The original filing is authoritative where they differ.',
        'Column D ("budget") is a revenue target on income rows and an appropriation on expenditure rows; the `kind` field records which.',
        'Only filings whose own internal identities reconcile are included here.',
      ],
    },
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
};
