/**
 * Poverty in the province Calatagan belongs to, from PSA's full-year poverty
 * statistics. PSA's OpenSTAT tables stop at the province: Calatagan's own
 * poverty incidence (a small-area estimate) is published only on psa.gov.ph,
 * which this project's tools cannot read, so it stays unpublished here and
 * these figures must always be labelled as Batangas-wide.
 *
 * `scripts/poverty.mjs` copies PSA's figures without calculation, with PSA's
 * measures of precision (coefficient of variation, 95% confidence interval).
 */
import { z } from 'zod';
import raw from './generated/psa-poverty.json' with { type: 'json' };
import { PSA_POVERTY_FAMILIES, PSA_POVERTY_POPULATION } from './sources.js';
import type { DataSource, Sourced } from './types/provenance.js';

const rowSchema = z.object({
  place: z.enum(['Batangas', 'Region IV-A (CALABARZON)']),
  year: z.number().int().min(2015).max(2100),
  threshold: z.number().positive().nullable(),
  incidence: z.number().min(0).max(100),
  cv: z.number().nonnegative().nullable(),
  standardError: z.number().nonnegative().nullable(),
  ciLower: z.number().nonnegative().nullable(),
  ciUpper: z.number().nonnegative().nullable(),
});
const tableSchema = z.object({ title: z.string().min(10), url: z.string().url(), rows: z.array(rowSchema).min(4) });
const datasetSchema = z.object({ retrievedAt: z.string().datetime(), population: tableSchema, families: tableSchema });

const dataset = datasetSchema.parse(raw);
export type PovertyRow = z.infer<typeof rowSchema>;

const retrieved = dataset.retrievedAt.slice(0, 10) as `${number}-${number}-${number}`;
const latestYear = Math.max(...dataset.population.rows.map((r) => r.year));

const source: DataSource = {
  sources: [
    { ...PSA_POVERTY_POPULATION, accessedOn: retrieved },
    { ...PSA_POVERTY_FAMILIES, accessedOn: retrieved },
  ],
  asOf: `Full-year ${latestYear} estimates`,
  lastVerified: retrieved,
  verification: 'verified',
  status: 'latest-official',
  tier: 1,
  expectedRefresh: 'irregular',
  isLatestKnownOfficial: true,
  methodology:
    'Read from PSA OpenSTAT’s full-year poverty tables for the province of Batangas and for Region IV-A, with the poverty threshold, the incidence and PSA’s measures of precision exactly as PSA publishes them.',
  note: 'These are figures for the whole province of Batangas, not for Calatagan. PSA estimates municipal poverty separately (small-area estimates) and publishes those only on its website, which this project cannot currently read; Calatagan’s own figure is therefore not published here.',
};

export const poverty: Sourced<{ population: PovertyRow[]; families: PovertyRow[]; latestYear: number }> = {
  data: { population: dataset.population.rows, families: dataset.families.rows, latestYear },
  source,
};
