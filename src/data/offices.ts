/**
 * The offices of local government in Calatagan, as the Local Government Code
 * creates them — the titles and what each does, never who holds them.
 *
 * Who holds each office is withheld (WITHHELD in municipality.ts, and the
 * officials check in CI): an election result or a campaign list is not proof
 * of present incumbency. This module therefore carries no names at all.
 * Seat counts are only those the Code itself states, multiplied by the 25
 * barangays in PSA's geographic code.
 */
import type { DataSource, SourceReference } from './types/provenance.js';

export const RA_7160: SourceReference = {
  name: 'Republic Act No. 7160 — The Local Government Code of 1991',
  publisher: 'Official Gazette of the Republic of the Philippines',
  url: 'https://www.officialgazette.gov.ph/downloads/1991/10oct/19911010-RA-7160-CCA.pdf',
  accessedOn: '2026-11-05',
  authority: 'primary-government',
  locator: 'Sections 43, 387, 389, 390, 444, 445 and 446 (as enacted, 10 October 1991)',
  sha256: 'e270e8bc7bd84ba8ad7b6fe6780c12a3e5a6103e2b9395db13084266a5ff1fff',
};

export const officesSource: DataSource = {
  sources: [RA_7160],
  asOf: 'Republic Act No. 7160, as enacted',
  lastVerified: '2026-11-05',
  verification: 'verified',
  status: 'current',
  tier: 1,
  expectedRefresh: 'irregular',
  methodology:
    'Each office and duty is read from the Official Gazette’s copy of the Code: Section 387 (barangay officials), 389 (the punong barangay), 390 (the Sangguniang Barangay), 444 (the mayor), 445 (the vice-mayor), 446 (the Sangguniang Bayan) and 43 (terms). Barangay seat totals multiply the Code’s per-barangay numbers by Calatagan’s 25 barangays.',
  note: 'Later laws amend parts of the Code (for example, the Sangguniang Kabataan reform law renamed and reshaped youth offices, and barangay terms are set by separate election laws). Titles here follow the Code as enacted; no officeholder is named.',
};

export interface Office {
  title: string;
  /** The Filipino title residents use, where it differs. */
  local?: string;
  /** What the Code says the office does, in brief. */
  role: string;
  /** Seats in Calatagan, only where the Code fixes the number. */
  seats?: number;
  section: string;
}

const BARANGAYS = 25;

export const municipalOffices: readonly Office[] = [
  {
    title: 'Municipal Mayor',
    local: 'Punong Bayan',
    role: 'The chief executive of the municipal government, with general supervision and control over its programmes, projects, services and activities.',
    seats: 1,
    section: 'Sec. 444',
  },
  {
    title: 'Municipal Vice-Mayor',
    local: 'Pangalawang Punong Bayan',
    role: 'Presides over the Sangguniang Bayan and assumes the office of mayor if it becomes permanently vacant.',
    seats: 1,
    section: 'Sec. 445',
  },
  {
    title: 'Sangguniang Bayan members',
    local: 'Konsehal',
    role: 'The municipality’s legislative body: the vice-mayor presiding, the elected regular members, the presidents of the municipal Liga ng mga Barangay and of the Sangguniang Kabataan federation, and sectoral representatives.',
    section: 'Sec. 446',
  },
];

export const barangayOffices: readonly Office[] = [
  {
    title: 'Punong Barangay',
    local: 'Kapitan',
    role: 'The barangay’s chief executive, and the presiding officer of the Sangguniang Barangay.',
    seats: BARANGAYS,
    section: 'Secs. 387, 389, 390',
  },
  {
    title: 'Sangguniang Barangay members',
    local: 'Kagawad',
    role: 'Seven in each barangay, elected at large; with the punong barangay and the Sangguniang Kabataan chair they make up the barangay’s legislative body.',
    seats: BARANGAYS * 7,
    section: 'Secs. 387, 390',
  },
  {
    title: 'Sangguniang Kabataan chair',
    local: 'SK Chair',
    role: 'Heads the barangay’s youth council and sits on the Sangguniang Barangay.',
    seats: BARANGAYS,
    section: 'Secs. 387, 390',
  },
  {
    title: 'Barangay Secretary and Treasurer',
    role: 'Appointive officers the Code places in every barangay, alongside the elected officials.',
    seats: BARANGAYS * 2,
    section: 'Sec. 387',
  },
];

export const TERM = {
  text: 'Municipal elective officials serve three-year terms, and no local elective official may serve more than three consecutive terms in the same position. Barangay officials’ terms are set separately by law.',
  section: 'Sec. 43',
};
