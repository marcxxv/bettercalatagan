/**
 * Holidays observed in Calatagan, and the national hotlines set by law.
 *
 * Every date is copied from the proclamation that declares it, read directly
 * (Proclamation No. 1006 is a scanned certified copy; its list was read from
 * the page image, and each entry is checked by the test for this module).
 * Calatagan's own special days are declared one at a time by proclamation;
 * only those found in a primary record are listed, with their proclamation.
 *
 * Hotlines: only numbers established by an executive order are listed. Local
 * numbers (municipal hall, MDRRMO, police, fire) are withheld for the reason
 * given in municipality.ts: the only records of them are out of date.
 */
import {
  EO_56_2018,
  EO_6_2016,
  PROC_1006_2025,
  PROC_1006_2025_ELIBRARY,
  PROC_1050_2020,
  PROC_1102_2025,
  PROC_1189_2026,
  PROC_1220_2026,
  PROC_1264_2026,
} from './sources.js';
import type { DataSource, SourceReference } from './types/provenance.js';

export type HolidayKind = 'regular' | 'special' | 'special-working' | 'local';

export interface Holiday {
  date: `${number}-${number}-${number}`;
  name: string;
  kind: HolidayKind;
  /** The proclamation declaring it. */
  proclamation: string;
  source: SourceReference;
  note?: string;
}

export const HOLIDAY_YEAR = 2026;

const P1006 = 'Proclamation No. 1006, s. 2025';

export const holidays: readonly Holiday[] = [
  { date: '2026-01-01', name: 'New Year’s Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-02-17', name: 'Chinese New Year', kind: 'special', proclamation: P1006, source: PROC_1006_2025, note: 'Additional special (non-working) day' },
  { date: '2026-02-25', name: 'EDSA People Power Revolution Anniversary', kind: 'special-working', proclamation: P1006, source: PROC_1006_2025, note: 'A special working day: work continues' },
  { date: '2026-03-20', name: 'Eid’l Fitr (Feast of Ramadhan)', kind: 'regular', proclamation: 'Proclamation No. 1189, s. 2026', source: PROC_1189_2026 },
  { date: '2026-04-02', name: 'Maundy Thursday', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-04-03', name: 'Good Friday', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-04-04', name: 'Black Saturday', kind: 'special', proclamation: P1006, source: PROC_1006_2025, note: 'Additional special (non-working) day' },
  { date: '2026-04-09', name: 'Araw ng Kagitingan', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-04-30', name: 'Calatagan Cultural Day', kind: 'local', proclamation: 'Proclamation No. 1220, s. 2026', source: PROC_1220_2026, note: 'Special (non-working) day in Calatagan only' },
  { date: '2026-05-01', name: 'Labor Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-05-27', name: 'Eid’l Adha (Feast of Sacrifice)', kind: 'regular', proclamation: 'Proclamation No. 1264, s. 2026', source: PROC_1264_2026 },
  { date: '2026-06-12', name: 'Independence Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-08-21', name: 'Ninoy Aquino Day', kind: 'special', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-08-31', name: 'National Heroes Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025, note: 'Last Monday of August' },
  { date: '2026-11-01', name: 'All Saints’ Day', kind: 'special', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-11-02', name: 'All Souls’ Day', kind: 'special', proclamation: P1006, source: PROC_1006_2025, note: 'Additional special (non-working) day' },
  { date: '2026-11-30', name: 'Bonifacio Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception of Mary', kind: 'special', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-12-24', name: 'Christmas Eve', kind: 'special', proclamation: P1006, source: PROC_1006_2025, note: 'Additional special (non-working) day' },
  { date: '2026-12-25', name: 'Christmas Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-12-30', name: 'Rizal Day', kind: 'regular', proclamation: P1006, source: PROC_1006_2025 },
  { date: '2026-12-31', name: 'Last Day of the Year', kind: 'special', proclamation: P1006, source: PROC_1006_2025 },
];

/** Calatagan's founding anniversary, as declared in past proclamations. */
export const foundingAnniversary = {
  day: '16 December',
  proclamations: [
    { year: 2025, name: 'Proclamation No. 1102, s. 2025', source: PROC_1102_2025 },
    { year: 2020, name: 'Proclamation No. 1050, s. 2020', source: PROC_1050_2020 },
  ],
};

export const holidaysSource: DataSource = {
  sources: [PROC_1006_2025, PROC_1006_2025_ELIBRARY, PROC_1189_2026, PROC_1264_2026, PROC_1220_2026, PROC_1102_2025],
  asOf: `Calendar year ${HOLIDAY_YEAR}`,
  lastVerified: '2026-09-30',
  verification: 'verified',
  status: 'current',
  tier: 1,
  expectedRefresh: 'annual',
  methodology:
    'Each date was read from the proclamation that declares it: Proclamation No. 1006 (the annual list, read from the signed certified copy), Nos. 1189 and 1264 (the Eid holidays, whose dates are fixed during the year) and No. 1220 (Calatagan’s Cultural Day). Calatagan’s founding anniversary is shown with the proclamations that declared it in past years; it is not listed as a 2026 holiday until a 2026 proclamation is found.',
  note: 'Local special days are declared by separate proclamations during the year. One declared after this page was last checked will not appear here.',
};

export interface Hotline {
  number: string;
  name: string;
  what: string;
  source: SourceReference;
}

export const hotlines: readonly Hotline[] = [
  {
    number: '911',
    name: 'Emergency 911',
    what: 'The nationwide emergency hotline, for police, fire and medical emergencies. It replaced Patrol 117.',
    source: EO_56_2018,
  },
  {
    number: '8888',
    name: '8888 Citizens’ Complaint Hotline',
    what: 'For complaints about red tape or corruption in any national government agency, government-owned corporation or other government instrumentality.',
    source: EO_6_2016,
  },
];

export const hotlinesSource: DataSource = {
  sources: [EO_56_2018, EO_6_2016],
  asOf: 'Executive orders in force',
  lastVerified: '2026-09-30',
  verification: 'verified',
  status: 'current',
  tier: 1,
  expectedRefresh: 'irregular',
  methodology: 'Each number is the one fixed by the executive order that established the hotline, read from the Supreme Court E-Library’s copy of the order.',
};
