import type { APIRoute } from 'astro';
import { fdpDataset, FDPP_LISTING, fdpSource } from '../../data/fdp';

/**
 * Machine-readable export of the FDP filing index.
 *
 * Envelope shape follows the convention used by the BetterGov officials API
 * (`data` + `meta`), so ecosystem consumers see something familiar.
 *
 * Licensing is deliberately split: our compilation is CC BY 4.0, but the DILG
 * documents this index points at are NOT ours to license and are not covered.
 */
export const GET: APIRoute = () => {
  const body = {
    data: fdpDataset.records,
    meta: {
      api_version: fdpDataset.schemaVersion,
      dataset: 'fdp-filings',
      lgu: fdpDataset.lgu,
      psgc: fdpDataset.psgc,
      data_vintage: fdpDataset.generatedAt,
      record_count: fdpDataset.recordCount,
      period_coverage: fdpSource.asOf,
      source: {
        name: FDPP_LISTING.name,
        publisher: FDPP_LISTING.publisher,
        url: FDPP_LISTING.url,
        authority: FDPP_LISTING.authority,
        accessed_on: FDPP_LISTING.accessedOn,
      },
      verification: fdpSource.verification,
      readiness_tier: fdpSource.tier,
      caveat: fdpSource.caveat,
      methodology: fdpSource.methodology,
      license: {
        compilation:
          'CC BY 4.0 — applies to this compilation (selection, arrangement, local identifiers, provenance metadata) by Better Calatagan.',
        source_documents:
          'NOT covered by the above. The filings themselves are works of the Department of the Interior and Local Government and the Municipality of Calatagan, governed by Philippine law. Obtain them from DILG and observe its terms.',
        attribution: 'Better Calatagan (bettercalatagan.org)',
      },
      disclaimer:
        'Better Calatagan is an independent civic project. It is not the official website of the Municipality of Calatagan and is not affiliated with, endorsed by, or operated by any government agency.',
      notes: [
        'This is a document index. No financial figures have been extracted from the filings.',
        'The `id` field is a local canonical identifier derived from form type and document period. It is stable across resubmissions.',
        'The `fdppId` field is the DILG portal identifier for the uploaded file. It changes when an LGU resubmits a filing, so it must not be used as a permanent key.',
        'Filings with `availability` of "source-error" exist but the DILG download endpoint was returning an error at the time of retrieval.',
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
