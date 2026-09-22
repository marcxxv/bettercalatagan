import type { APIRoute } from 'astro';
import { archivedDocuments, documentsSource } from '../../data/documents';
import { envelope } from '../../lib/export';

/** The archived document record of the municipality's former website. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'archived-documents',
    data: archivedDocuments.documents,
    sources: documentsSource,
    notes: [
      'Every document here is ARCHIVED. The site it came from (calatagan.gov.ph) no longer resolves.',
      'Nothing in this dataset should be read as the municipality’s current position, fees or procedure.',
      '`status` is "superseded" when the document’s own stated period has ended, otherwise "archived".',
      '`kind` is inferred from the filename the municipality chose. Documents that match no pattern are "other" rather than guessed at.',
      'Documents are linked, not mirrored: the Internet Archive already preserves them.',
    ],
  });
