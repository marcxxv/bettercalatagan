import { z } from 'zod';

/**
 * Archived documents recovered from the municipality's former website.
 *
 * Everything here is historical by definition: the site it came from no longer
 * resolves. The `status` field exists so a reader can tell an expired plan from
 * a document that may still reflect practice.
 */

export const documentKindSchema = z.enum([
  'citizens-charter',
  'office-document',
  'executive-order',
  'ordinance',
  'resolution',
  'land-use-plan',
  'budget',
  'procurement-award',
  'procurement-notice',
  'procurement-plan',
  'fdp-disclosure',
  'personnel',
  'report',
  'profile',
  'other',
]);

/**
 * `archived` — from a source that no longer exists; currency unknown.
 * `superseded` — the document's own stated period has ended.
 *
 * Neither means the document is wrong, only that it must not be read as the
 * municipality's current position.
 */
export const documentStatusSchema = z.enum(['archived', 'superseded']);

export const archivedDocumentSchema = z
  .object({
    id: z.string().regex(/^doc-\d{14}-[0-9a-z]{8}$/),
    title: z.string().trim().min(1),
    filename: z.string().trim().min(1),
    kind: documentKindSchema,
    status: documentStatusSchema,
    fileType: z.enum(['pdf', 'xls', 'xlsx', 'doc', 'docx', 'csv']),
    byteLength: z.number().int().positive().nullable(),
    publishedYear: z.number().int().min(2000).max(2100).nullable(),
    publishedMonth: z.number().int().min(1).max(12).nullable(),
    originalUrl: z.string().url().startsWith('https://'),
    archiveUrl: z.string().url().startsWith('https://web.archive.org/'),
    capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    archiveDigest: z.string().min(8),
  })
  .strict()
  // The archive link must point at the document it claims to archive.
  .refine(
    (doc) => doc.archiveUrl.includes(doc.originalUrl.replace(/^https:/, 'http:')) ||
      doc.archiveUrl.includes(doc.originalUrl),
    'the archive URL must reference the original URL',
  );

export const archivedDocumentsSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    sourceSite: z.literal('calatagan.gov.ph'),
    sourceSiteStatus: z.string().min(1),
    archive: z.string().min(1),
    cdxQuery: z.string().min(1),
    generatedAt: z.string().datetime(),
    documentCount: z.number().int().nonnegative(),
    countsByKind: z.record(z.number().int().nonnegative()),
    documents: z.array(archivedDocumentSchema),
  })
  .strict()
  .refine((d) => d.documentCount === d.documents.length, 'documentCount must match documents length')
  .refine((d) => new Set(d.documents.map((x) => x.id)).size === d.documents.length, 'ids must be unique');

export type ArchivedDocument = z.infer<typeof archivedDocumentSchema>;
export type ArchivedDocuments = z.infer<typeof archivedDocumentsSchema>;

/** Human labels for each kind. */
export const KIND_LABELS: Record<z.infer<typeof documentKindSchema>, string> = {
  'citizens-charter': "Citizen's Charter",
  'office-document': 'Office document',
  'executive-order': 'Executive order',
  ordinance: 'Ordinance',
  resolution: 'Resolution',
  'land-use-plan': 'Land use and zoning',
  budget: 'Budget',
  'procurement-award': 'Procurement award',
  'procurement-notice': 'Procurement notice',
  'procurement-plan': 'Procurement plan',
  'fdp-disclosure': 'Full disclosure report',
  personnel: 'Personnel',
  report: 'Report',
  profile: 'Municipal profile',
  other: 'Other',
};
