/**
 * Calatagan in DTI's Cities and Municipalities Competitiveness Index (CMCI).
 *
 * The CMCI is DTI's own annual index, compiled with the Regional
 * Competitiveness Committees from data the LGUs and agencies submit. Its ranks
 * and scores are DTI's; `scripts/cmci.mjs` copies them from DTI's ranking
 * tables without calculation.
 *
 * Two things this module is careful about:
 *  - A rank means nothing without its field. DTI ranks municipalities within
 *    income-class categories, so each year carries the category and how many
 *    LGUs were ranked in it.
 *  - DTI's 2018 table gives ranks but prints every score as 0.0000. Those
 *    scores are recorded as not published, not as zero.
 *
 * From the CMCI profile page only the indicator breakdown is used. It also shows a mayor, a population, a telephone number
 * and an e-mail address. Those fields are stale and are withheld on this site
 * (municipality.ts, WITHHELD); nothing from that block is used.
 */
import raw from './generated/cmci.json' with { type: 'json' };
import { cmciDatasetSchema, type CmciYear } from './schemas/cmci.js';
import { DTI_CMCI_PROFILE, DTI_CMCI_RANKINGS } from './sources.js';
import type { DataSource } from './types/provenance.js';

export const cmci = cmciDatasetSchema.parse(raw);
export type { CmciYear };

const retrieved = cmci.retrievedAt.slice(0, 10) as `${number}-${number}-${number}`;

/** Years, oldest first. */
export const cmciYears = [...cmci.years].sort((a, b) => a.year - b.year);
export const latestCmci = cmciYears.at(-1)!;

export const competitivenessSource: DataSource = {
  sources: [
    { ...DTI_CMCI_RANKINGS, accessedOn: retrieved },
    { ...DTI_CMCI_PROFILE, accessedOn: retrieved },
  ],
  asOf: `CMCI ${cmciYears[0].year}–${latestCmci.year}`,
  lastVerified: retrieved,
  verification: 'verified',
  status: 'latest-official',
  tier: 1,
  expectedRefresh: 'annual',
  isLatestKnownOfficial: true,
  methodology:
    'Read from DTI’s CMCI ranking table for each year, in the category Calatagan was ranked in (1st to 2nd class municipalities throughout). The overall rank and score, each pillar’s rank and score, and the number of LGUs ranked are recorded exactly as DTI’s table prints them. The indicator breakdown comes from DTI’s LGU profile page for Calatagan and is placed in the year whose pillar ranks and scores it reproduces exactly; a stray row DTI’s page repeats under every pillar is dropped.',
  note: 'The CMCI measures what LGUs and agencies report to DTI against DTI’s indicators; a rank compares Calatagan with other municipalities of its class, and pillars were added over time (Resiliency from 2017, Innovation from 2022), so overall scores from different years are not strictly comparable. DTI’s 2018 table prints no scores, only ranks.',
};
