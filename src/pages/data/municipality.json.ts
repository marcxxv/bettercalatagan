import type { APIRoute } from 'astro';
import { barangays } from '../../data/barangays';
import { incomeClassification, municipality, WITHHELD } from '../../data/municipality';
import {
  barangayPopulation2024,
  censusDefinitions,
  population2024,
  populationSeries,
} from '../../data/population';
import { envelope } from '../../lib/export';

/** Identity, income classification, barangays and census figures in one file. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'municipality',
    data: {
      municipality: municipality.data,
      incomeClassification: incomeClassification.data,
      barangays: barangays.data,
      population: {
        latest: population2024.data,
        series: populationSeries.data,
        byBarangay: barangayPopulation2024.data,
        /** PSA's own definitions of these measures, verbatim from the source table. */
        definitions: censusDefinitions,
      },
    },
    sources: {
      municipality: municipality.source,
      incomeClassification: incomeClassification.source,
      barangays: barangays.source,
      population: population2024.source,
      populationSeries: populationSeries.source,
    },
    notes: [
      'Census figures come from PSA OpenSTAT, the Philippine Statistics Authority’s own statistical database.',
      'Barangay populations sum exactly to the municipal total; the pipeline refuses to publish otherwise.',
      'Barangay PSGC codes are NOT contiguous: 012, 024 and 025 are unassigned within Calatagan.',
      'Baha reports 83 persons with 0 household population and 0 households, exactly as PSA publishes it. Per PSA, total population is household plus institutional population; PSA does not say which institutional quarters were involved.',
    ],
    withheld: WITHHELD,
  });
