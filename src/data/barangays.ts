/**
 * The 25 barangays of Calatagan, with PSGC codes and 2020 census populations.
 *
 * Codes and names are cross-checked between two independent community mirrors
 * of the PSA PSGC, which agree exactly. Note that the codes are NOT sequential:
 * 012, 024 and 025 are unassigned within Calatagan, and the sequence runs
 * ...023, 026, 027, 028. This was confirmed against both mirrors. Any source
 * presenting a tidy 001-025 run for Calatagan is wrong.
 *
 * Names and codes are now confirmed against PSA's own statistical database:
 * OpenSTAT returns Calatagan's barangays keyed by their PSGC codes, in the same
 * set recorded here. Population figures live in population.ts.
 */
import type { Sourced } from './types/provenance.js';
import type { Barangay } from './schemas/civic.js';
import { PSA_OPENSTAT_CENSUS_2024, PSGC_CLOUD, PSGC_GITLAB } from './sources.js';

const barangayList: Barangay[] = [
  { psgc10: '0401008001', name: 'Bagong Silang', aliases: [] },
  { psgc10: '0401008002', name: 'Baha', aliases: [] },
  { psgc10: '0401008003', name: 'Balibago', aliases: [] },
  { psgc10: '0401008004', name: 'Balitoc', aliases: [] },
  { psgc10: '0401008005', name: 'Biga', aliases: [] },
  { psgc10: '0401008006', name: 'Bucal', aliases: [] },
  { psgc10: '0401008007', name: 'Carlosa', aliases: [] },
  { psgc10: '0401008008', name: 'Carretunan', aliases: [] },
  { psgc10: '0401008009', name: 'Encarnacion', aliases: [] },
  { psgc10: '0401008010', name: 'Gulod', aliases: [] },
  { psgc10: '0401008011', name: 'Hukay', aliases: [] },
  { psgc10: '0401008013', name: 'Lucsuhin', aliases: [] },
  { psgc10: '0401008014', name: 'Luya', aliases: [] },
  { psgc10: '0401008015', name: 'Paraiso', aliases: [] },
  { psgc10: '0401008016', name: 'Barangay 1 (Pob.)', aliases: ['Barangay 1', 'Barangay I (Poblacion)', 'Poblacion 1'] },
  { psgc10: '0401008017', name: 'Barangay 2 (Pob.)', aliases: ['Barangay 2', 'Barangay II (Poblacion)', 'Poblacion 2'] },
  { psgc10: '0401008018', name: 'Barangay 3 (Pob.)', aliases: ['Barangay 3', 'Barangay III (Poblacion)', 'Poblacion 3'] },
  { psgc10: '0401008019', name: 'Barangay 4 (Pob.)', aliases: ['Barangay 4', 'Barangay IV (Poblacion)', 'Poblacion 4'] },
  { psgc10: '0401008020', name: 'Quilitisan', aliases: [] },
  { psgc10: '0401008021', name: 'Real', aliases: [] },
  { psgc10: '0401008022', name: 'Sambungan', aliases: [] },
  { psgc10: '0401008023', name: 'Santa Ana', aliases: [] },
  { psgc10: '0401008026', name: 'Talibayog', aliases: [] },
  { psgc10: '0401008027', name: 'Talisay', aliases: [] },
  { psgc10: '0401008028', name: 'Tanagan', aliases: [] },
];

export const barangays: Sourced<Barangay[]> = {
  data: barangayList,
  source: {
    sources: [PSA_OPENSTAT_CENSUS_2024, PSGC_GITLAB, PSGC_CLOUD],
    asOf: 'PSGC as used in the PSA 2024 Census of Population',
    lastVerified: '2026-09-22',
    verification: 'verified',
    status: 'current',
    tier: 1,
    expectedRefresh: 'irregular',
    isLatestKnownOfficial: true,
    methodology:
      "Confirmed against PSA's own statistical database, which returns Calatagan's barangays keyed by PSGC code, and cross-checked against two independent PSA-derived mirrors. All three agree on the same 25 codes and names. Poblacion barangays keep their PSGC name with common alternative spellings as aliases.",
  },
};
