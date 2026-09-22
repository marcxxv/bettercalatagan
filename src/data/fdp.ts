/**
 * DILG Full Disclosure Policy Portal filings for Calatagan.
 *
 * The dataset is produced by `scripts/fdp.mjs` and committed. It is validated
 * here at build time, so a malformed or tampered dataset fails the build rather
 * than reaching a reader.
 *
 * This phase publishes a DOCUMENT INDEX, not extracted figures. Every record
 * points at the DILG original; no financial value is restated.
 */
import rawDataset from './generated/fdp-filings.json' with { type: 'json' };
import { fdpDatasetSchema, type FdpDataset, type FdpFiling } from './schemas/fdp.js';
import type { DataSource, SourceReference, Sourced } from './types/provenance.js';

/** Throws at build time if the generated dataset does not match the schema. */
export const fdpDataset: FdpDataset = fdpDatasetSchema.parse(rawDataset);

export const FDPP_LISTING: SourceReference = {
  name: 'DILG Full Disclosure Policy Portal — Calatagan filings',
  publisher: 'Department of the Interior and Local Government',
  url: fdpDataset.listingUrl as `https://${string}`,
  accessedOn: fdpDataset.generatedAt.slice(0, 10) as `${number}-${number}-${number}`,
  authority: 'primary-government',
  locator: 'Region IV-A (CALABARZON) · Batangas · Calatagan',
};

const availableCount = fdpDataset.records.filter((r) => r.availability === 'available').length;

export const fdpSource: DataSource = {
  sources: [FDPP_LISTING],
  asOf: periodRangeLabel(fdpDataset.records),
  lastVerified: fdpDataset.generatedAt.slice(0, 10) as `${number}-${number}-${number}`,
  verification: 'verified',
  status: 'current',
  tier: 2,
  expectedRefresh: 'quarterly',
  isLatestKnownOfficial: true,
  methodology:
    'Every filing listed for Calatagan on the DILG portal was enumerated, and each download endpoint was requested directly. File type was determined from the returned bytes, not from the declared content type, and a SHA-256 checksum was recorded for each file that downloaded cleanly.',
  caveat:
    `This is an index of documents, not of figures — no financial value has been extracted or restated. The filings are self-reported by the LGU to DILG. ${fdpDataset.records.length - availableCount} of ${fdpDataset.records.length} download endpoints were failing at the time of retrieval; those filings remain listed with their metadata.`,
  note: 'Portal document ids change when an LGU resubmits a filing, so local ids are derived from form type and document period instead.',
};

export const fdpFilings: Sourced<FdpFiling[]> = {
  data: fdpDataset.records,
  source: fdpSource,
};

function periodRangeLabel(records: readonly FdpFiling[]): string {
  if (records.length === 0) return 'no filings';
  const years = records.map((record) => record.documentPeriod.year);
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `CY${min}` : `CY${min}–CY${max}`;
}

export interface FdpSummary {
  total: number;
  available: number;
  sourceError: number;
  missingFromSource: number;
  years: number[];
  quarters: number[];
  forms: { slug: string; label: string; count: number }[];
}

export function summarise(records: readonly FdpFiling[]): FdpSummary {
  const forms = new Map<string, { slug: string; label: string; count: number }>();
  for (const record of records) {
    const entry = forms.get(record.formSlug) ?? {
      slug: record.formSlug,
      label: record.formLabel,
      count: 0,
    };
    entry.count += 1;
    forms.set(record.formSlug, entry);
  }

  return {
    total: records.length,
    available: records.filter((r) => r.availability === 'available').length,
    sourceError: records.filter((r) => r.availability === 'source-error').length,
    missingFromSource: records.filter((r) => r.availability === 'missing-from-source').length,
    years: [...new Set(records.map((r) => r.documentPeriod.year))].sort((a, b) => b - a),
    quarters: [...new Set(records.flatMap((r) => (r.documentPeriod.quarter ? [r.documentPeriod.quarter] : [])))].sort(),
    forms: [...forms.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export const fdpSummary = summarise(fdpDataset.records);

/** Bytes formatted for display; undefined for filings we could not download. */
export function formatBytes(bytes?: number): string | null {
  if (bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
