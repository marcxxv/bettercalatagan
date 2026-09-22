import { z } from 'zod';
import { psgc10Schema } from './civic.js';

/**
 * Structured figures extracted from the Statement of Receipts and Expenditures
 * (FDP Form 3). The original filing remains authoritative: every value records
 * the cell it came from so any figure can be traced back and checked.
 */

/** A number together with the cell it was read from. */
export const sreValueSchema = z
  .object({
    value: z.number(),
    cell: z.string().regex(/^[A-Z]+\d+$/, 'must be a cell reference like G24'),
  })
  .strict()
  .nullable();

/**
 * What the budget column means for a row.
 *
 * The form heads column D "Income/Target Budget Appropriations", which is a
 * revenue target on income rows and an appropriation on expenditure rows. The
 * two senses are kept distinct rather than collapsed into one label.
 */
export const sreItemKindSchema = z.enum(['income', 'expenditure', 'derived', 'balance']);

export const sreItemSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().trim().min(1),
    /** What this particular filing called the line, if it differs. */
    sourceLabel: z.string().trim().min(1),
    kind: sreItemKindSchema,
    level: z.number().int().min(0).max(3),
    row: z.number().int().positive(),
    budget: sreValueSchema,
    generalFund: sreValueSchema,
    sef: sreValueSchema,
    total: sreValueSchema,
  })
  .strict();

export const sreCheckSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['fund-split', 'subtotal']),
    expected: z.number(),
    actual: z.number(),
    delta: z.number(),
    passed: z.boolean(),
  })
  .strict();

export const sreFilingSchema = z
  .object({
    ok: z.literal(true),
    filingId: z.string().regex(/^fdp-\d{4}-q[1-4]-statement-of-receipts-and-expenditures$/),
    fdppId: z.number().int().positive(),
    documentPeriod: z
      .object({ year: z.number().int().min(2000).max(2100), quarter: z.number().int().min(1).max(4) })
      .strict(),
    sheet: z.string().min(1),
    formReference: z.string().min(1),
    header: z
      .object({
        region: z.string().nullable(),
        province: z.string().nullable(),
        lgu: z.string().nullable(),
        calendarYear: z.number().int(),
        quarter: z.number().int().min(1).max(4),
      })
      .strict(),
    columns: z.object({ budget: z.string(), generalFund: z.string(), sef: z.string(), total: z.string() }).strict(),
    items: z.array(sreItemSchema).min(1),
    unmatchedLabels: z.array(z.string()),
    checks: z.array(sreCheckSchema),
    reconciliation: z
      .object({
        total: z.number().int().nonnegative(),
        passed: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        failures: z.array(
          z.object({ id: z.string(), expected: z.number(), actual: z.number(), delta: z.number() }).strict(),
        ),
      })
      .strict(),
    verification: z.enum(['verified', 'unverified']),
  })
  .strict()
  // The sheet must say it is the period the filing claims.
  .refine(
    (filing) =>
      filing.header.calendarYear === filing.documentPeriod.year &&
      filing.header.quarter === filing.documentPeriod.quarter,
    'the sheet header must match the filing period',
  )
  // The sheet must say it is Calatagan.
  .refine(
    (filing) => (filing.header.lgu ?? '').trim().toUpperCase() === 'CALATAGAN',
    'the sheet header must name Calatagan',
  )
  // "verified" means every identity held and every label was found.
  .refine(
    (filing) =>
      filing.verification !== 'verified' ||
      (filing.reconciliation.failed === 0 && filing.unmatchedLabels.length === 0),
    'a verified filing must have no failed checks and no unmatched labels',
  )
  .refine(
    (filing) => filing.reconciliation.passed + filing.reconciliation.failed === filing.checks.length,
    'reconciliation counts must match the checks recorded',
  );

export const sreDatasetSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    form: z.literal('statement-of-receipts-and-expenditures'),
    formReference: z.string().min(1),
    psgc: psgc10Schema,
    lgu: z.string().min(1),
    generatedAt: z.string().datetime(),
    methodology: z.string().min(1),
    extractedCount: z.number().int().nonnegative(),
    verifiedCount: z.number().int().nonnegative(),
    skipped: z.array(z.object({ filingId: z.string(), reason: z.string() }).strict()),
    filings: z.array(sreFilingSchema),
  })
  .strict()
  .refine((d) => d.extractedCount === d.filings.length, 'extractedCount must match filings length')
  .refine(
    (d) => d.verifiedCount === d.filings.filter((f) => f.verification === 'verified').length,
    'verifiedCount must match the verified filings',
  )
  .refine(
    (d) => new Set(d.filings.map((f) => f.filingId)).size === d.filings.length,
    'filing ids must be unique',
  );

export type SreFiling = z.infer<typeof sreFilingSchema>;
export type SreItem = z.infer<typeof sreItemSchema>;
export type SreDataset = z.infer<typeof sreDatasetSchema>;
