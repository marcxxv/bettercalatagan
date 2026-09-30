import type { APIRoute } from 'astro';
import { cmciYears, competitivenessSource } from '../../data/competitiveness';
import { envelope } from '../../lib/export';

/** Calatagan in DTI's Cities and Municipalities Competitiveness Index, by year. */
export const GET: APIRoute = () =>
  envelope({
    dataset: 'cmci',
    data: cmciYears,
    sources: competitivenessSource,
    notes: [
      'Ranks and scores exactly as DTI’s ranking tables print them. `ranked` is how many LGUs DTI ranked in `category` that year.',
      'A `score` of null means DTI’s table printed no score (2018), not a score of zero.',
      'Pillars were added over time (Resiliency 2017, Innovation 2022); overall scores across years are not strictly comparable.',
    ],
  });
