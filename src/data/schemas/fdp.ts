import { z } from 'zod';
import { isoDateSchema } from './provenance.js';
import { psgc10Schema } from './civic.js';

/**
 * DILG Full Disclosure Policy Portal filings.
 *
 * A filing is a statutory form submitted for a document period. The portal
 * identifies the uploaded FILE by a numeric id and reassigns that id when an
 * LGU resubmits, so the numeric id cannot be our canonical key. We derive a
 * local id from civic meaning instead and keep the portal id as metadata.
 */

/** The 14 statutory FDP forms. */
export const FDP_FORM_SLUGS = [
  'annual-budget-report',
  'gad-accomplishment-report',
  'annual-procurement-plan',
  'supplemental-procurement-plan',
  'statement-of-indebtedness',
  'nta-20-percent-utilization',
  'bid-results',
  'ldrrmf-utilization',
  'manpower-complement',
  'statement-of-receipts-and-expenditures',
  'trust-fund-utilization',
  'quarterly-statement-of-cash-flow',
  'sef-utilization',
  'unliquidated-cash-advances',
] as const;

export const fdpFormSlugSchema = z.enum(FDP_FORM_SLUGS);

export const fdpCadenceSchema = z.enum(['annual', 'quarterly']);

/**
 * Whether the document itself can currently be obtained.
 *
 * `source-error` is common: roughly one in seven download endpoints returns
 * HTTP 500. That is a portal fault, not a missing filing, and the filing stays
 * listed with its metadata intact.
 */
export const fdpAvailabilitySchema = z.enum([
  'available',
  'source-error',
  'missing-from-source',
  'not-checked',
]);

export const fdpFileTypeSchema = z.enum(['xlsx', 'pdf', 'html-error', 'empty', 'unknown']);

export const fdpPeriodSchema = z
  .object({
    year: z.number().int().min(2000).max(2100),
    quarter: z.number().int().min(1).max(4).nullable(),
  })
  .strict();

export const fdpFilingSchema = z
  .object({
    /** Local canonical id, e.g. "fdp-2026-q2-bid-results". Stable across resubmissions. */
    id: z
      .string()
      .regex(
        /^fdp-\d{4}-(q[1-4]-)?[a-z0-9-]+$/,
        'local id must look like fdp-<year>[-q<n>]-<form-slug>',
      ),
    /** The portal's current numeric id for the uploaded file. Not canonical. */
    fdppId: z.number().int().positive(),
    /** Portal ids previously seen for this filing slot, oldest first. */
    supersededFdppIds: z.array(z.number().int().positive()).optional(),

    formSlug: fdpFormSlugSchema,
    formLabel: z.string().trim().min(1),
    formCadence: fdpCadenceSchema,

    /** The period the document reports on. */
    documentPeriod: fdpPeriodSchema,
    /** The period in which the LGU posted it. */
    postingPeriod: fdpPeriodSchema.nullable(),
    /** Physical posting places named by the LGU. */
    postingLocations: z.array(z.string().trim().min(1)),

    downloadUrl: z.string().url().startsWith('https://'),
    availability: fdpAvailabilitySchema,
    httpStatus: z.number().int().nullable().optional(),
    fileType: fdpFileTypeSchema.nullable(),
    contentType: z.string().optional(),
    byteLength: z.number().int().nonnegative().optional(),
    /**
     * Content fingerprint, NOT a hash of the delivered bytes.
     *
     * The DILG portal regenerates each XLSX at request time and stamps the
     * current clock into the zip entries, so the raw bytes differ on every
     * fetch even when the spreadsheet is unchanged. This hashes each zip
     * entry's name, CRC-32 and uncompressed size instead: stable across
     * regenerations, and still changes when the data changes.
     */
    contentSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),

    /** When the pipeline last fetched this record. */
    retrievedAt: z.string().datetime(),
    firstSeenAt: z.string().datetime().optional(),
    /** When the file last downloaded successfully. Survives later failures. */
    lastKnownGoodAt: z.string().datetime().optional(),
    missingSince: z.string().datetime().optional(),
    error: z.string().optional(),
  })
  .strict()
  // An annual form has no quarter; a quarterly form must have one.
  .refine(
    (filing) =>
      filing.formCadence === 'annual'
        ? filing.documentPeriod.quarter === null
        : filing.documentPeriod.quarter !== null,
    'quarterly forms need a document quarter; annual forms must not have one',
  )
  // The local id must actually describe the filing it is attached to.
  .refine((filing) => {
    const quarter = filing.documentPeriod.quarter ? `q${filing.documentPeriod.quarter}-` : '';
    return filing.id === `fdp-${filing.documentPeriod.year}-${quarter}${filing.formSlug}`;
  }, 'local id must be derived from document period and form slug')
  // A file that downloaded cleanly must carry its checksum and type.
  .refine(
    (filing) =>
      filing.availability !== 'available' ||
      (Boolean(filing.contentSha256) && filing.fileType !== null),
    'an available filing must record a content fingerprint and a file type',
  );

export const fdpDatasetSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    psgc: psgc10Schema,
    lgu: z.string().trim().min(1),
    generatedAt: z.string().datetime(),
    listingUrl: z.string().url().startsWith('https://'),
    portalReportedTotal: z.number().int().nonnegative().nullable(),
    recordCount: z.number().int().nonnegative(),
    records: z.array(fdpFilingSchema),
  })
  .strict()
  .refine((dataset) => dataset.recordCount === dataset.records.length, 'recordCount must match records length')
  .refine(
    (dataset) => new Set(dataset.records.map((r) => r.id)).size === dataset.records.length,
    'local filing ids must be unique',
  )
  .refine(
    (dataset) => new Set(dataset.records.map((r) => r.fdppId)).size === dataset.records.length,
    'portal ids must be unique within a snapshot',
  );

export type FdpFiling = z.infer<typeof fdpFilingSchema>;
export type FdpDataset = z.infer<typeof fdpDatasetSchema>;
export type FdpFormSlug = (typeof FDP_FORM_SLUGS)[number];

/** Human label for a document period, e.g. "Q2 CY2026" or "CY2025". */
export function formatPeriod(period: z.infer<typeof fdpPeriodSchema>): string {
  return period.quarter ? `Q${period.quarter} CY${period.year}` : `CY${period.year}`;
}

export const isoDate = isoDateSchema;
