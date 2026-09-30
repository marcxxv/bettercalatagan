import { z } from 'zod';
import { barangayPsgcSchema } from './civic.js';

/** Shape of the file written by `scripts/dpwh.mjs`. */

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const money = z.number().positive().nullable();

export const dpwhProjectSchema = z.object({
  contractId: z.string().regex(/^[0-9A-Z]{6,12}$/),
  description: z.string().trim().min(5),
  /** Where the description places the work (see scripts/lib/dpwh-location.mjs). */
  scope: z.enum(['calatagan', 'shared', 'road']),
  barangays: z.array(barangayPsgcSchema),
  category: z.string().nullable(),
  status: z.string().trim().min(1),
  progress: z.number().min(0).max(100).nullable(),
  infraYear: z.number().int().min(2000).max(2100).nullable(),
  budget: money,
  abc: money,
  contractor: z.string().nullable(),
  bidders: z.number().int().nonnegative().nullable(),
  startDate: date,
  completionDate: date,
  advertisementDate: date,
  programName: z.string().nullable(),
  sourceOfFunds: z.string().nullable(),
  fundingInstrument: z.string().nullable(),
  implementingOffice: z.string().nullable(),
});

export const dpwhDatasetSchema = z
  .object({
    source: z.object({ api: z.string().url().startsWith('https://'), query: z.string(), publisher: z.string() }),
    retrievedAt: z.string().datetime(),
    searched: z.number().int().positive(),
    excluded: z.object({ elsewhere: z.number().int().nonnegative() }),
    projects: z.array(dpwhProjectSchema),
  })
  .refine(
    (d) => new Set(d.projects.map((p) => p.contractId)).size === d.projects.length,
    'contract ids must be unique',
  );

export type DpwhProject = z.infer<typeof dpwhProjectSchema>;
