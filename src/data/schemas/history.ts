import { z } from 'zod';
import { httpsUrlSchema, pastOrTodaySchema } from './provenance.js';

/**
 * Historical content, held to the same discipline as the civic data.
 *
 * Every assertion on the History page is a `claim` that cites one or more
 * `citations` by id, and carries a status saying how well it is supported:
 *
 *  - `documented`  Supported by a primary-grade source (a primary historical
 *                  document, a government record or publication, peer-reviewed
 *                  scholarship, or a photograph of a government marker), OR by
 *                  two independent sources of lesser rank that agree.
 *  - `attributed`  Rests on a single non-primary source. Published only with
 *                  the attribution spelled out in the text, so a reader sees
 *                  whose claim it is.
 *  - `disputed`    Sources or scholars disagree. The disagreement is described;
 *                  no single version is chosen.
 */

export const citationKindSchema = z.enum([
  'primary-document',
  'government-record',
  'government-publication',
  'peer-reviewed',
  'photograph',
  'archived-official',
  'secondary',
]);

/** Kinds strong enough, on their own, to make a claim `documented`. */
export const PRIMARY_GRADE_KINDS = [
  'primary-document',
  'government-record',
  'government-publication',
  'peer-reviewed',
  'photograph',
] as const;

export const citationSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** Formatted for display, e.g. "Fox, Robert B. (1959)". */
    short: z.string().trim().min(1),
    title: z.string().trim().min(1),
    publisher: z.string().trim().min(1),
    year: z.number().int().min(1500).max(2100).nullable(),
    url: httpsUrlSchema,
    doi: z.string().regex(/^10\.\d{4,}\//).optional(),
    locator: z.string().trim().min(1).optional(),
    kind: citationKindSchema,
    /** When a maintainer last opened or confirmed this reference. */
    accessedOn: pastOrTodaySchema,
    /** Honest notes on access, e.g. that only the metadata could be retrieved. */
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export const claimStatusSchema = z.enum(['documented', 'attributed', 'disputed']);

export const claimSchema = z
  .object({
    text: z.string().trim().min(20),
    cite: z.array(z.string()).min(1, 'every claim needs at least one citation'),
    status: claimStatusSchema,
    /** Required for `attributed`: whose claim this is, shown to the reader. */
    attribution: z.string().trim().min(3).optional(),
  })
  .strict()
  .refine(
    (claim) => claim.status !== 'attributed' || Boolean(claim.attribution),
    'an attributed claim must say whose claim it is',
  );

export const timelineEntrySchema = z
  .object({
    /** Display date, e.g. "16 December 1911" or "Late 14th–mid 15th century". */
    when: z.string().trim().min(3),
    /** Sort key: the earliest year the entry could refer to. */
    sortYear: z.number().int(),
    event: z.string().trim().min(10),
    cite: z.array(z.string()).min(1),
    status: claimStatusSchema,
    attribution: z.string().trim().min(3).optional(),
  })
  .strict()
  .refine(
    (entry) => entry.status !== 'attributed' || Boolean(entry.attribution),
    'an attributed timeline entry must say whose claim it is',
  );

export const chapterSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    kicker: z.string().trim().min(1),
    title: z.string().trim().min(1),
    claims: z.array(claimSchema).min(1),
  })
  .strict();

export const unverifiedSchema = z
  .object({
    claim: z.string().trim().min(10),
    foundIn: z.array(z.string()).min(1),
    why: z.string().trim().min(10),
  })
  .strict();

export type Citation = z.infer<typeof citationSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;
export type Unverified = z.infer<typeof unverifiedSchema>;
