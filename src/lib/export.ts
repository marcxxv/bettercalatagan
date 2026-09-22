import type { DataSource } from '../data/types/provenance';
import { municipality } from '../data/municipality';

/**
 * The shared envelope for every machine-readable export.
 *
 * Shape follows the convention used by the BetterGov officials API (`data` plus
 * `meta`) so ecosystem consumers see something familiar. Provenance travels
 * with the data: a consumer can reproduce any citation this site shows, and can
 * tell how well-evidenced each dataset is.
 */
export const API_VERSION = '1.0.0';

export const LICENSE = {
  compilation:
    'CC BY 4.0 — applies to this compilation (selection, arrangement, identifiers, extraction and provenance metadata) by Better Calatagan.',
  source_documents:
    'NOT covered by the above. Cited government documents remain the works of their issuing agencies under Philippine law and are not relicensed here. Obtain them from the issuing agency and observe its terms.',
  attribution: 'Better Calatagan (bettercalatagan.org)',
} as const;

export const DISCLAIMER =
  'Better Calatagan is an independent civic project. It is not the official website of the Municipality of Calatagan and is not affiliated with, endorsed by, or operated by any government agency.';

/** Strips a DataSource down to what a consumer needs to reproduce a citation. */
function describeSource(source: DataSource) {
  return {
    as_of: source.asOf ?? null,
    last_verified: source.lastVerified,
    verification: source.verification,
    status: source.status,
    readiness_tier: source.tier,
    expected_refresh: source.expectedRefresh,
    is_latest_known_official: source.isLatestKnownOfficial ?? false,
    methodology: source.methodology ?? null,
    caveat: source.caveat ?? null,
    sources: source.sources.map((reference) => ({
      name: reference.name,
      publisher: reference.publisher,
      url: reference.url,
      authority: reference.authority,
      accessed_on: reference.accessedOn,
      locator: reference.locator ?? null,
      sha256: reference.sha256 ?? null,
      archive_url: reference.archiveUrl ?? null,
    })),
  };
}

export interface EnvelopeInput {
  dataset: string;
  data: unknown;
  /** One DataSource, or a map of named ones where a dataset combines several. */
  sources: DataSource | Record<string, DataSource>;
  notes?: readonly string[];
  withheld?: readonly { fact: string; reason: string }[];
}

function isDataSource(value: DataSource | Record<string, DataSource>): value is DataSource {
  return Array.isArray((value as DataSource).sources);
}

export function envelope({ dataset, data, sources, notes, withheld }: EnvelopeInput): Response {
  const provenance = isDataSource(sources)
    ? describeSource(sources)
    : Object.fromEntries(
        Object.entries(sources).map(([key, value]) => [key, describeSource(value)]),
      );

  const body = {
    data,
    meta: {
      api_version: API_VERSION,
      dataset,
      lgu: municipality.data.officialName,
      psgc: municipality.data.psgc10,
      generated_at: new Date().toISOString(),
      provenance,
      ...(notes ? { notes } : {}),
      ...(withheld ? { withheld } : {}),
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
}
