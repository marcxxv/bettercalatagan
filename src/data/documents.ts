/**
 * The archived document record of calatagan.gov.ph.
 *
 * The municipality's website is gone. What it published is still public record,
 * and the Internet Archive still holds it, so this indexes what survives and
 * links to it.
 *
 * Tier 2, and the caveat says why: these are archived documents of unknown
 * current force. Publishing them as a historical record is useful; publishing
 * them as current municipal information would not be.
 */
import raw from './generated/archived-documents.json' with { type: 'json' };
import { archivedDocumentsSchema, type ArchivedDocument, type ArchivedDocuments } from './schemas/documents.js';
import type { DataSource, SourceReference, Sourced } from './types/provenance.js';

export const archivedDocuments: ArchivedDocuments = archivedDocumentsSchema.parse(raw);

export const WAYBACK_CALATAGAN: SourceReference = {
  name: 'Internet Archive — calatagan.gov.ph',
  publisher: 'Internet Archive',
  url: 'https://web.archive.org/web/*/calatagan.gov.ph',
  accessedOn: archivedDocuments.generatedAt.slice(0, 10) as `${number}-${number}-${number}`,
  authority: 'archived-official',
  locator: 'CDX index of PDF, XLS and DOC captures, excluding plugin assets',
};

export const documentsSource: DataSource = {
  sources: [WAYBACK_CALATAGAN],
  asOf: yearRange(),
  lastVerified: archivedDocuments.generatedAt.slice(0, 10) as `${number}-${number}-${number}`,
  verification: 'verified',
  status: 'archived',
  tier: 2,
  expectedRefresh: 'irregular',
  methodology:
    'Built from the Internet Archive CDX index for calatagan.gov.ph, keeping successful captures of document files and discarding plugin assets and duplicate captures. Each entry keeps the URL it had on the municipal site, the archive URL, the capture date and the archive’s content digest. Documents are classified from the filename the municipality chose; anything that does not match a pattern is listed as "Other" rather than guessed at.',
  caveat:
    'These documents come from the municipality’s former website, which is offline. They are a historical record: none should be read as the municipality’s current position, current fees, or current procedure. Where a document states its own period, that is shown.',
  note: 'Indexed and linked, not mirrored. The Internet Archive already preserves these files.',
};

export const documents: Sourced<ArchivedDocument[]> = {
  data: archivedDocuments.documents,
  source: documentsSource,
};

function yearRange(): string {
  const years = archivedDocuments.documents
    .map((doc) => doc.publishedYear)
    .filter((year): year is number => year !== null);
  if (years.length === 0) return 'unknown';
  return `${Math.min(...years)}–${Math.max(...years)}`;
}

export const documentYears = [
  ...new Set(archivedDocuments.documents.map((d) => d.publishedYear).filter((y): y is number => y !== null)),
].sort((a, b) => b - a);

export const documentKinds = Object.entries(archivedDocuments.countsByKind)
  .map(([kind, count]) => ({ kind, count }))
  .sort((a, b) => b.count - a.count);
