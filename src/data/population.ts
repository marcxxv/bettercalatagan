/**
 * Census figures for Calatagan, from PSA's own statistical database.
 *
 * PSA's editorial web pages return a bot challenge, but PSA OpenSTAT (a PxWeb
 * instance) serves the same census releases as data and answers normally. That
 * is a primary government source, so these records are tier 1.
 *
 * The generated file is produced by `scripts/psa.mjs`, which refuses to write
 * unless the 25 barangay counts reconcile exactly to PSA's own municipal total
 * for both population and households.
 */
import raw from './generated/psa-population.json' with { type: 'json' };
import { psaPopulationSchema } from './schemas/psa.js';
import { PSA_BATANGAS_POPCEN_2024, PSA_OPENSTAT_CENSUS_2024, PSA_OPENSTAT_SERIES } from './sources.js';
import type { DataSource, Sourced } from './types/provenance.js';

/** Throws at build time if the generated file does not match the schema. */
export const psaPopulation = psaPopulationSchema.parse(raw);

const accessedOn = psaPopulation.retrievedAt.slice(0, 10) as `${number}-${number}-${number}`;

const census2024Source: DataSource = {
  sources: [PSA_OPENSTAT_CENSUS_2024, PSA_BATANGAS_POPCEN_2024],
  asOf: '1 July 2024',
  lastVerified: accessedOn,
  verification: 'verified',
  status: 'latest-official',
  tier: 1,
  expectedRefresh: 'per-census',
  isLatestKnownOfficial: true,
  methodology:
    "Retrieved from PSA's own statistical database (OpenSTAT) for the 2024 Census of Population. The 25 barangay counts reconcile exactly to PSA's municipal total for both population and households; the pipeline refuses to write the dataset otherwise. PSA's definitions of each measure are captured from the same table and published alongside the figures.",
  note: 'Per PSA, total population is household population plus institutional population. A barangay can therefore report people but no households: Baha reports 83 persons, 0 household population and 0 households, exactly as PSA publishes them. PSA does not say which institutional quarters those persons were enumerated in, and this project does not speculate.',
};

/** PSA's definitions of the census measures, verbatim. */
export const censusDefinitions = psaPopulation.definitions;

/**
 * Barangays where PSA counts people outside private households.
 *
 * Derived only from PSA's own identity (total = household + institutional), so
 * the difference is institutional population by PSA's definition. Nothing is
 * said about which institution, because PSA does not say.
 */
export const outsideHouseholds = psaPopulation.barangays
  .filter((b) => b.totalPopulation !== b.householdPopulation)
  .map((b) => ({
    psgc10: b.psgc10,
    name: b.name,
    institutionalPopulation: b.totalPopulation - b.householdPopulation,
  }));

/** The latest official population count. */
export const population2024: Sourced<{
  census: string;
  referenceDate: string;
  population: number;
  householdPopulation: number;
  households: number;
}> = {
  data: {
    census: '2024 POPCEN',
    referenceDate: '2024-07-01',
    population: psaPopulation.municipality.totalPopulation,
    householdPopulation: psaPopulation.municipality.householdPopulation,
    households: psaPopulation.municipality.households,
  },
  source: census2024Source,
};

/** Population at each of the last three censuses. */
export const populationSeries: Sourced<typeof psaPopulation.populationSeries> = {
  data: psaPopulation.populationSeries,
  source: {
    sources: [PSA_OPENSTAT_SERIES],
    asOf: '2015, 2020 and 2024 census reference dates',
    lastVerified: accessedOn,
    verification: 'verified',
    status: 'latest-official',
    tier: 1,
    expectedRefresh: 'per-census',
    isLatestKnownOfficial: true,
    methodology:
      'Counts as published by PSA for each census. Values between census years are not interpolated.',
  },
};

/** Barangay-level counts from the same 2024 release. */
export const barangayPopulation2024: Sourced<typeof psaPopulation.barangays> = {
  data: psaPopulation.barangays,
  source: census2024Source,
};

/**
 * PSA's land-area column, recorded but NOT published.
 *
 * PSA's own table gives 10.50 km² for Calatagan and computes a 2024 density of
 * 5,754 persons/km² from it. Comparable Batangas municipalities in the same
 * table sit near 50 km² (Agoncillo 49.67, Bauan 51.49), and a widely circulated
 * figure for Calatagan is 101.50 km² — which would make PSA's value a dropped
 * digit. We cannot confirm either, so we publish neither.
 */
export const LAND_AREA_UNRESOLVED = {
  psaReportedKm2: psaPopulation.reportedLandAreaKm2,
  psaReportedDensity2024: psaPopulation.reportedDensity2024,
  alternativeKm2: 101.5,
  note:
    "PSA's published land area for Calatagan implies a population density roughly ten times that of comparable municipalities in the same table. Treated as a suspected data-entry error in the source rather than a finding about Calatagan. Withheld until a second primary source settles it.",
} as const;
