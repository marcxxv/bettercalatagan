/**
 * Recognition Calatagan has received from government bodies, each with the
 * record that announced it.
 *
 * The CALABARZON Tourism Excellence Awards ranking was announced by the
 * municipality's tourism office on Facebook. Neither the Department of Tourism's
 * per-municipality arrival statistics nor an official awards list could be
 * read by this project (DOT's statistics pages return 404; municipal figures
 * are released through FOI requests), so the ranking is published at tier 2 on
 * the maintainer's attestation (ADR 0010), and the arrival count itself is not.
 */
import type { DataSource, Sourced } from './types/provenance.js';

export interface Recognition {
  title: string;
  body: string;
  /** The period the recognition is for. */
  period: string;
  conferredOn: string;
  place: string;
}

const tourismAwardSource: DataSource = {
  sources: [
    {
      name: 'Calatagan, Top 9: CALABARZON Tourism Excellence Awards (post by Tourism of Calatagan, Batangas with LGU Calatagan, Batangas, 18 September 2026)',
      publisher: 'Municipality of Calatagan Tourism Office, on Facebook',
      url: 'https://www.facebook.com/photo/?fbid=1416618750575243',
      accessedOn: '2026-10-01',
      authority: 'social-media',
      locator:
        'Read by the maintainer on 1 October 2026; Facebook’s login wall prevents this project from reading it. Award plaque in the photo: “Top 9 Overnight Tourist Arrivals for 2025”.',
    },
  ],
  asOf: 'Overnight tourist arrivals, 2025',
  lastVerified: '2026-10-01',
  verification: 'reported',
  status: 'current',
  tier: 2,
  expectedRefresh: 'annual',
  attestation:
    'The maintainer attests on 1 October 2026 that the post is from the official page of the Municipality of Calatagan’s tourism office, published with the municipality’s own page.',
  caveat:
    'Announced by the municipal tourism office; the Department of Tourism’s own ranking table and arrival counts could not be read, so the number of arrivals is not published.',
};

export const recognitions: Sourced<Recognition[]> = {
  data: [
    {
      title: 'Top 9 in overnight tourist arrivals, CALABARZON',
      body: 'Calatagan was recognised as ninth among the region’s municipalities for overnight tourist arrivals in 2025, at the CALABARZON Tourism Excellence Awards.',
      period: '2025',
      conferredOn: '2026-09-16',
      place: 'Twin Lakes Hotel, Laurel, Batangas',
    },
  ],
  source: tourismAwardSource,
};
