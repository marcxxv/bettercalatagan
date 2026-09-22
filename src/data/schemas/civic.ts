import { z } from 'zod';
import { dataSourceSchema, isoDateSchema } from './provenance.js';

/**
 * Philippine Standard Geographic Code.
 *
 * PSA publishes both a 9-digit and a 10-digit form. The 10-digit form is the
 * current one and is what we store; the 9-digit form is kept alongside it
 * because most government documents still quote it.
 *
 * The codes are hierarchical: region, province, city/municipality, barangay.
 * Nothing outside Calatagan's own 041008 segment can affect its barangay codes.
 */
export const psgc10Schema = z
  .string()
  .regex(/^\d{10}$/, 'PSGC (10-digit) must be exactly 10 digits');

export const psgc9Schema = z
  .string()
  .regex(/^\d{9}$/, 'PSGC (9-digit) must be exactly 9 digits');

/** Calatagan's municipal segment in the 10-digit form. */
export const CALATAGAN_PSGC_10 = '0401008000';
export const CALATAGAN_PSGC_9 = '041008000';
/** Every Calatagan barangay code begins with this. */
export const CALATAGAN_BARANGAY_PREFIX = '0401008';

export const barangayPsgcSchema = psgc10Schema.refine(
  (value) => value.startsWith(CALATAGAN_BARANGAY_PREFIX) && !value.endsWith('000'),
  `barangay PSGC must begin with ${CALATAGAN_BARANGAY_PREFIX} and must not be the municipal code`,
);

export const municipalitySchema = z.object({
  name: z.string().trim().min(1),
  /** The form used in statutes and official issuances. */
  officialName: z.string().trim().min(1),
  province: z.string().trim().min(1),
  region: z.string().trim().min(1),
  regionName: z.string().trim().min(1),
  islandGroup: z.enum(['luzon', 'visayas', 'mindanao']),
  psgc10: psgc10Schema,
  psgc9: psgc9Schema,
  barangayCount: z.number().int().positive(),
});

export const barangaySchema = z.object({
  psgc10: barangayPsgcSchema,
  name: z.string().trim().min(1),
  /** Alternative spellings seen in official documents. */
  aliases: z.array(z.string().trim().min(1)).default([]),
});

export const incomeClassificationSchema = z.object({
  /** 1st through 6th. Stored as a small integer. */
  incomeClass: z.number().int().min(1).max(6),
  previousIncomeClass: z.number().int().min(1).max(6).optional(),
  /** Date the classification took legal effect. */
  effectiveFrom: isoDateSchema,
  /** The issuance that set it. */
  issuance: z.string().trim().min(1),
  legalBasis: z.string().trim().min(1),
});

/** Every exported dataset carries the same envelope shape. */
export const datasetEnvelopeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'dataset id must be kebab-case'),
  title: z.string().trim().min(1),
  source: dataSourceSchema,
});

export type Municipality = z.infer<typeof municipalitySchema>;
export type Barangay = z.infer<typeof barangaySchema>;
export type IncomeClassification = z.infer<typeof incomeClassificationSchema>;
