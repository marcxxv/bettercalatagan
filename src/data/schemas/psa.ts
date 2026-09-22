import { z } from 'zod';
import { barangayPsgcSchema, psgc10Schema } from './civic.js';
import { isoDateSchema } from './provenance.js';

/** Shape of the file written by `scripts/psa.mjs`. */

const censusUnitSchema = z.object({
  psgc10: psgc10Schema,
  name: z.string().trim().min(1),
  totalPopulation: z.number().int().nonnegative(),
  householdPopulation: z.number().int().nonnegative(),
  households: z.number().int().nonnegative(),
});

const barangayUnitSchema = censusUnitSchema.extend({ psgc10: barangayPsgcSchema });

export const psaPopulationSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    source: z.object({
      name: z.string().trim().min(1),
      publisher: z.literal('Philippine Statistics Authority'),
      api: z.string().url().startsWith('https://'),
      tables: z.record(z.string().url().startsWith('https://')),
    }),
    retrievedAt: z.string().datetime(),
    municipality: censusUnitSchema,
    barangays: z.array(barangayUnitSchema).length(25),
    populationSeries: z
      .array(
        z.object({
          census: z.string().trim().min(1),
          referenceDate: isoDateSchema,
          population: z.number().int().positive(),
        }),
      )
      .min(1),
    /** Recorded for audit. Not published — see population.ts. */
    reportedLandAreaKm2: z.number().positive(),
    reportedDensity2024: z.number().positive(),
  })
  .strict()
  // PSA's parts must sum to PSA's own total, or we have misread the table.
  .refine(
    (data) =>
      data.barangays.reduce((sum, b) => sum + b.totalPopulation, 0) ===
      data.municipality.totalPopulation,
    'barangay populations must sum to the municipal total',
  )
  .refine(
    (data) =>
      data.barangays.reduce((sum, b) => sum + b.households, 0) === data.municipality.households,
    'barangay household counts must sum to the municipal total',
  )
  // Household population can never exceed total population.
  .refine(
    (data) =>
      data.municipality.householdPopulation <= data.municipality.totalPopulation &&
      data.barangays.every((b) => b.householdPopulation <= b.totalPopulation),
    'household population cannot exceed total population',
  )
  // The series must be chronological and must agree with the 2024 record.
  .refine((data) => {
    const dates = data.populationSeries.map((entry) => Date.parse(entry.referenceDate));
    return dates.every((value, index) => index === 0 || value > dates[index - 1]);
  }, 'population series must be in chronological order')
  .refine((data) => {
    const latest = data.populationSeries.at(-1);
    return latest?.population === data.municipality.totalPopulation;
  }, 'the latest series entry must match the municipal total');

export type PsaPopulation = z.infer<typeof psaPopulationSchema>;
