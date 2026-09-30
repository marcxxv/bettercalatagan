/**
 * Guardrails for the datasets behind the Services, Infrastructure, Statistics,
 * Holidays and Hotlines pages.
 */
import { describe, expect, it } from 'vitest';
import { holidays, hotlines, HOLIDAY_YEAR } from './calendar';
import { cmciYears, competitivenessSource } from './competitiveness';
import { dpwh, inCalatagan, infrastructureSource } from './infrastructure';
import { dataSourceSchema } from './schemas/provenance';
import { charterDocuments, offices, servicesSource } from './services';
import { holidaysSource, hotlinesSource } from './calendar';
import { barangays } from './barangays';

/** Counts in the committed data. A refresh may add records, never lose them. */
const SNAPSHOT = { dpwhInCalatagan: 179, cmciYears: 10, offices: 18 };

describe('provenance', () => {
  it('every new dataset carries a valid provenance envelope', () => {
    for (const source of [infrastructureSource, competitivenessSource, servicesSource, holidaysSource, hotlinesSource]) {
      expect(() => dataSourceSchema.parse(source)).not.toThrow();
    }
  });
});

describe('DPWH projects', () => {
  it('never shrinks', () => {
    expect(inCalatagan.length).toBeGreaterThanOrEqual(SNAPSHOT.dpwhInCalatagan);
  });
  it('places every counted project in Calatagan, Batangas by its own description', () => {
    for (const p of inCalatagan) expect(p.description, p.contractId).toMatch(/CALATAGAN/);
  });
  it('only names barangays of Calatagan', () => {
    const codes = new Set(barangays.data.map((b) => b.psgc10));
    for (const p of dpwh.projects) for (const code of p.barangays) expect(codes.has(code), `${p.contractId} ${code}`).toBe(true);
  });
});

describe('CMCI', () => {
  it('never shrinks, and each rank sits within its field', () => {
    expect(cmciYears.length).toBeGreaterThanOrEqual(SNAPSHOT.cmciYears);
    for (const y of cmciYears) expect(y.rank).toBeLessThanOrEqual(y.ranked);
  });
  it('records DTI’s blank 2018 scores as not published, not zero', () => {
    const y2018 = cmciYears.find((y) => y.year === 2018);
    expect(y2018?.score).toBeNull();
    for (const y of cmciYears) if (y.score !== null) expect(y.score).toBeGreaterThan(0);
  });
});

describe('services', () => {
  it('lists every office once, each with a charter in the archive index', () => {
    expect(offices.length).toBeGreaterThanOrEqual(SNAPSHOT.offices);
    expect(new Set(offices.map((o) => o.slug)).size).toBe(offices.length);
    for (const office of offices) {
      const doc = charterDocuments.get(office.slug);
      expect(doc?.kind, office.name).toBe('citizens-charter');
    }
  });
  it('restates no fee or processing time', () => {
    const text = JSON.stringify(offices);
    expect(text).not.toMatch(/₱|\bPhP\b|\bpesos\b|\d[\d,.]*\s*(minutes?|mins?|days?|hours?)\b/i);
  });
});

describe('holidays', () => {
  // Weekdays as Proclamation No. 1006 prints them beside each date (and Nos. 1189, 1220, 1264).
  const PRINTED_WEEKDAY: Record<string, string> = {
    '2026-01-01': 'Thursday', '2026-02-17': 'Tuesday', '2026-02-25': 'Wednesday', '2026-03-20': 'Friday',
    '2026-04-09': 'Thursday', '2026-04-30': 'Thursday', '2026-05-01': 'Friday', '2026-05-27': 'Wednesday',
    '2026-06-12': 'Friday', '2026-08-21': 'Friday', '2026-11-01': 'Sunday', '2026-11-02': 'Monday',
    '2026-11-30': 'Monday', '2026-12-08': 'Tuesday', '2026-12-24': 'Thursday', '2026-12-25': 'Friday',
    '2026-12-30': 'Wednesday', '2026-12-31': 'Thursday',
  };
  it('falls on the weekday its proclamation states', () => {
    for (const [date, weekday] of Object.entries(PRINTED_WEEKDAY)) {
      const actual = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
      expect(actual, date).toBe(weekday);
      expect(holidays.some((h) => h.date === date), date).toBe(true);
    }
  });
  it('is one year, in date order, without duplicates', () => {
    const dates = holidays.map((h) => h.date);
    expect(dates.every((d) => d.startsWith(String(HOLIDAY_YEAR)))).toBe(true);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
  });
});

describe('hotlines', () => {
  it('lists only numbers set by an executive order', () => {
    expect(hotlines.map((h) => h.number)).toEqual(['911', '8888']);
    for (const h of hotlines) expect(h.source.name).toMatch(/^Executive Order No\./);
  });
});
