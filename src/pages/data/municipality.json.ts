import type { APIRoute } from 'astro';
import { barangays } from '../../data/barangays';
import { incomeClassification, municipality, WITHHELD } from '../../data/municipality';
import { barangayPopulation2024, population2024, populationSeries } from '../../data/population';
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
    ],
    withheld: WITHHELD,
  });
