import type { APIRoute } from 'astro';
import { archivedDocuments, documentsSource } from '../../data/documents';
import { fdpDataset, fdpSource } from '../../data/fdp';
import { financialsSource, verifiedFilings } from '../../data/financials';
import { municipality, WITHHELD } from '../../data/municipality';
import { barangays } from '../../data/barangays';
import { population2024 } from '../../data/population';
import { API_VERSION, DISCLAIMER, LICENSE } from '../../lib/export';

/**
 * Discovery manifest.
 *
 * One request tells a consumer what exists, how well evidenced each dataset is,
 * how often it changes, and — just as importantly — what is deliberately absent
 * and why.
 */
export const GET: APIRoute = ({ site }) => {
  const base = site ? new URL('/data/', site).toString().replace(/\/$/, '') : '/data';

  const datasets = [
    {
      id: 'municipality',
      title: 'Identity, income classification, barangays and census figures',
      url: `${base}/municipality.json`,
      records: 1 + barangays.data.length,
      readiness_tier: Math.max(municipality.source.tier, population2024.source.tier),
      expected_refresh: 'per-census',
      primary_sources: ['Philippine Statistics Authority', 'Bureau of Local Government Finance'],
    },
    {
      id: 'fdp-filings',
      title: 'DILG Full Disclosure Policy filings (document index)',
      url: `${base}/fdp-filings.json`,
      records: fdpDataset.recordCount,
      readiness_tier: fdpSource.tier,
      expected_refresh: fdpSource.expectedRefresh,
      primary_sources: ['Department of the Interior and Local Government'],
    },
    {
      id: 'sre-financials',
      title: 'Statement of Receipts and Expenditures (extracted figures)',
      url: `${base}/financials.json`,
      records: verifiedFilings.length,
      readiness_tier: financialsSource.tier,
      expected_refresh: financialsSource.expectedRefresh,
      primary_sources: ['Department of the Interior and Local Government'],
    },
    {
      id: 'archived-documents',
      title: 'Documents archived from the municipality’s former website',
      url: `${base}/documents.json`,
      records: archivedDocuments.documentCount,
      readiness_tier: documentsSource.tier,
      expected_refresh: documentsSource.expectedRefresh,
      primary_sources: ['Internet Archive (of calatagan.gov.ph)'],
    },
  ];

  const body = {
    data: { datasets },
    meta: {
      api_version: API_VERSION,
      dataset: 'index',
      lgu: municipality.data.officialName,
      psgc: municipality.data.psgc10,
      generated_at: new Date().toISOString(),
      readiness_tiers: {
        '1': 'Verified against a primary source; published as-is.',
        '2': 'Published with a caveat that is shown to the reader alongside the figure.',
        '3': 'Held internally; needs more verification. Never exported.',
        '4': 'Withheld.',
      },
      withheld: WITHHELD,
      notes: [
        'Every dataset carries its own provenance in its `meta.provenance` block: sources, what period the data describes, when a human last checked it, and how well evidenced it is.',
        '`as_of` (the period the data describes) and `last_verified` (when someone checked) are deliberately different fields.',
        'There is no global staleness rule. A census two years past its reference date is still the latest official release; `status` says what a record is.',
        'Only tier 1 and tier 2 datasets are exported. Tier 3 and 4 data stays out of public output entirely.',
      ],
      license: LICENSE,
      disclaimer: DISCLAIMER,
    },
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
};
