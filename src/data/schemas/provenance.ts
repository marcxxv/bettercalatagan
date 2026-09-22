import { z } from 'zod';

/** ISO calendar date, strictly YYYY-MM-DD and a real date. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
  }, 'must be a real calendar date');

/** A date that cannot be in the future. Nobody verifies a fact tomorrow. */
export const pastOrTodaySchema = isoDateSchema.refine((value) => {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  // Compare against end-of-day UTC so "today" is always acceptable.
  return parsed <= Date.now() + 24 * 60 * 60 * 1000;
}, 'must not be a future date');

export const sourceAuthoritySchema = z.enum([
  'primary-government',
  'government-hosted-copy',
  'government-derived-dataset',
  'civic-tech-derivative',
  'academic',
  'reputable-secondary',
  'archived-official',
  'third-party-document-host',
  'social-media',
  'tertiary',
]);

/** Rank used to compare authority levels. Lower is stronger. */
export const AUTHORITY_RANK: Record<z.infer<typeof sourceAuthoritySchema>, number> = {
  'primary-government': 1,
  'government-hosted-copy': 2,
  'government-derived-dataset': 3,
  'civic-tech-derivative': 4,
  academic: 5,
  'reputable-secondary': 6,
  'archived-official': 7,
  'third-party-document-host': 8,
  'social-media': 9,
  tertiary: 10,
};

export const httpsUrlSchema = z
  .string()
  .url('must be a valid URL')
  .startsWith('https://', 'must use https');

export const sourceReferenceSchema = z.object({
  name: z.string().trim().min(1, 'source name is required'),
  publisher: z.string().trim().min(1, 'publisher is required'),
  url: httpsUrlSchema,
  accessedOn: pastOrTodaySchema,
  authority: sourceAuthoritySchema,
  archiveUrl: httpsUrlSchema.optional(),
  locator: z.string().trim().min(1).optional(),
  sha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/, 'sha256 must be 64 lowercase hex characters')
    .optional(),
});

export const verificationStatusSchema = z.enum(['verified', 'reported', 'unverified']);

export const recordStatusSchema = z.enum([
  'current',
  'latest-official',
  'historical',
  'archived',
  'draft',
  'unverified',
]);

export const readinessTierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const refreshCadenceSchema = z.enum([
  'quarterly',
  'annual',
  'per-census',
  'per-election',
  'per-issuance',
  'irregular',
  'none',
]);

export const dataSourceSchema = z
  .object({
    sources: z.array(sourceReferenceSchema).min(1, 'at least one source is required'),
    asOf: z.string().trim().min(1).optional(),
    lastVerified: pastOrTodaySchema,
    verification: verificationStatusSchema,
    status: recordStatusSchema,
    tier: readinessTierSchema,
    expectedRefresh: refreshCadenceSchema,
    isLatestKnownOfficial: z.boolean().optional(),
    methodology: z.string().trim().min(1).optional(),
    caveat: z.string().trim().min(1).optional(),
    note: z.string().trim().min(1).optional(),
  })
  // Tier 1 is the "publish without qualification" tier. It must be verified.
  .refine(
    (value) => value.tier !== 1 || value.verification === 'verified',
    'tier 1 records must have verification "verified"',
  )
  // Tier 2 is publishable only because the caveat travels with it.
  .refine(
    (value) => value.tier !== 2 || Boolean(value.caveat),
    'tier 2 records must carry a caveat, which is displayed to the reader',
  )
  // Nothing unverified may reach a page or an export.
  .refine(
    (value) => value.verification !== 'unverified' || value.tier >= 3,
    'records with verification "unverified" must be tier 3 or 4',
  )
  .refine(
    (value) => value.status !== 'unverified' || value.tier >= 3,
    'records with status "unverified" must be tier 3 or 4',
  )
  // A published fact must rest on something better than an encyclopaedia.
  //
  // One narrow exception, and it turns on WHAT IS BEING CLAIMED. A record with
  // status `archived` does not assert a current civic fact; it asserts that a
  // document existed at a government URL and that a copy survives. A web
  // archive is authoritative for exactly that claim, and it is the only thing
  // that can be, since the original site is gone. Such a record still may not
  // be dressed up as current: `status` pins it to `archived`, and the reader
  // sees that label.
  .refine(
    (value) =>
      value.tier >= 3 ||
      value.sources.some((source) => AUTHORITY_RANK[source.authority] <= 4) ||
      (value.status === 'archived' &&
        value.sources.some((source) => source.authority === 'archived-official')),
    'published records need at least one source of authority "civic-tech-derivative" or stronger, unless the record is an archived one attested by a web archive',
  );

export type DataSourceInput = z.infer<typeof dataSourceSchema>;

/** Wraps any record schema with its required provenance envelope. */
export function sourced<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({ data: dataSchema, source: dataSourceSchema });
}
