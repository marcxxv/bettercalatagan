import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { barangays } from './barangays.js';
import {
  barangayPopulation2024,
  population2024,
  populationSeries,
  psaPopulation,
  LAND_AREA_UNRESOLVED,
} from './population.js';
import { incomeClassification, municipality, WITHHELD } from './municipality.js';
import { dataSourceSchema, AUTHORITY_RANK } from './schemas/provenance.js';
import {
  CALATAGAN_BARANGAY_PREFIX,
  CALATAGAN_PSGC_10,
  barangaySchema,
  incomeClassificationSchema,
  municipalitySchema,
} from './schemas/civic.js';
import { isPublishable, type DataSource, type Sourced } from './types/provenance.js';

/** Every dataset in the project, so the guardrails below cover all of them. */
const datasets: { name: string; record: Sourced<unknown> }[] = [
  { name: 'municipality', record: municipality },
  { name: 'incomeClassification', record: incomeClassification },
  { name: 'barangays', record: barangays },
  { name: 'population2024', record: population2024 },
  { name: 'populationSeries', record: populationSeries },
  { name: 'barangayPopulation2024', record: barangayPopulation2024 },
];

describe('provenance envelope', () => {
  it.each(datasets)('$name carries a schema-valid DataSource', ({ record }) => {
    expect(() => dataSourceSchema.parse(record.source)).not.toThrow();
  });

  it.each(datasets)('$name cites at least one source with a real https URL', ({ record }) => {
    expect(record.source.sources.length).toBeGreaterThan(0);
    for (const source of record.source.sources) {
      expect(source.url.startsWith('https://')).toBe(true);
      expect(() => new URL(source.url)).not.toThrow();
      expect(source.name.trim()).not.toBe('');
      expect(source.publisher.trim()).not.toBe('');
    }
  });

  it.each(datasets)('$name was verified on a date that is not in the future', ({ record }) => {
    const verified = Date.parse(`${record.source.lastVerified}T00:00:00Z`);
    expect(Number.isNaN(verified)).toBe(false);
    expect(verified).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
  });

  it.each(datasets)('$name records an access date for every source', ({ record }) => {
    for (const source of record.source.sources) {
      const accessed = Date.parse(`${source.accessedOn}T00:00:00Z`);
      expect(Number.isNaN(accessed)).toBe(false);
      expect(accessed).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
    }
  });
});

describe('publication safety', () => {
  it.each(datasets)('$name is never published while unverified', ({ record }) => {
    if (record.source.verification === 'unverified' || record.source.status === 'unverified') {
      expect(isPublishable(record.source)).toBe(false);
    }
  });

  it.each(datasets)('$name, if tier 1, is verified', ({ record }) => {
    if (record.source.tier === 1) {
      expect(record.source.verification).toBe('verified');
    }
  });

  it.each(datasets)('$name, if tier 2, carries a caveat for the reader', ({ record }) => {
    if (record.source.tier === 2) {
      expect(record.source.caveat?.trim()).toBeTruthy();
    }
  });

  it.each(datasets)('$name, if published, rests on more than a tertiary source', ({ record }) => {
    if (!isPublishable(record.source)) return;
    const best = Math.min(...record.source.sources.map((s) => AUTHORITY_RANK[s.authority]));
    expect(best).toBeLessThanOrEqual(4);
  });

  it('allows an archived record to rest on a web archive, but only as archived', () => {
    // A web archive is authoritative for "this document existed here", which is
    // the only claim an archived record makes. It must not unlock a current one.
    const archivedOnArchive = {
      ...municipality.source,
      status: 'archived' as const,
      tier: 2 as const,
      caveat: 'Archived record.',
      sources: [
        {
          name: 'Internet Archive',
          publisher: 'Internet Archive',
          url: 'https://web.archive.org/web/*/example.gov.ph' as const,
          accessedOn: '2026-09-22' as const,
          authority: 'archived-official' as const,
        },
      ],
    };
    expect(dataSourceSchema.safeParse(archivedOnArchive).success).toBe(true);
    expect(
      dataSourceSchema.safeParse({ ...archivedOnArchive, status: 'current' as const }).success,
    ).toBe(false);
  });
});

describe('municipality identity', () => {
  it('matches the schema', () => {
    expect(() => municipalitySchema.parse(municipality.data)).not.toThrow();
  });

  it('uses Calatagan’s PSGC and keeps the 9- and 10-digit forms consistent', () => {
    expect(municipality.data.psgc10).toBe(CALATAGAN_PSGC_10);
    // The 10-digit form widens the region segment from two digits to three, so
    // 041008000 becomes 0401008000 by inserting a zero after the region code.
    const { psgc9 } = municipality.data;
    expect(`${psgc9.slice(0, 2)}0${psgc9.slice(2)}`).toBe(municipality.data.psgc10);
  });

  it('declares a barangay count that matches the barangay list', () => {
    expect(municipality.data.barangayCount).toBe(barangays.data.length);
  });
});

describe('income classification', () => {
  it('matches the schema', () => {
    expect(() => incomeClassificationSchema.parse(incomeClassification.data)).not.toThrow();
  });

  it('is first class, effective 1 January 2025', () => {
    expect(incomeClassification.data.incomeClass).toBe(1);
    expect(incomeClassification.data.previousIncomeClass).toBe(2);
    expect(incomeClassification.data.effectiveFrom).toBe('2025-01-01');
  });

  it('cites a primary government issuance, not an index or aggregator', () => {
    const primary = incomeClassification.source.sources.filter(
      (s) => s.authority === 'primary-government',
    );
    expect(primary.length).toBeGreaterThan(0);
    // The value is only defensible because someone read the schedule itself.
    expect(primary.some((s) => Boolean(s.locator))).toBe(true);
  });

  it('pins the issuance file by checksum so a silent replacement is detectable', () => {
    expect(
      incomeClassification.source.sources.some((s) => /^[0-9a-f]{64}$/.test(s.sha256 ?? '')),
    ).toBe(true);
  });
});

describe('barangays', () => {
  it('has exactly 25 entries, each schema-valid', () => {
    expect(barangays.data).toHaveLength(25);
    for (const barangay of barangays.data) {
      expect(() => barangaySchema.parse(barangay)).not.toThrow();
    }
  });

  it('gives every barangay a PSGC code inside Calatagan', () => {
    for (const barangay of barangays.data) {
      expect(barangay.psgc10.startsWith(CALATAGAN_BARANGAY_PREFIX)).toBe(true);
      expect(barangay.psgc10).not.toBe(CALATAGAN_PSGC_10);
    }
  });

  it('has no duplicate codes or names', () => {
    expect(new Set(barangays.data.map((b) => b.psgc10)).size).toBe(25);
    expect(new Set(barangays.data.map((b) => b.name)).size).toBe(25);
  });

  it('preserves the real, non-sequential PSGC suffixes', () => {
    // Guards against a "tidy" 001-025 run being introduced by a well-meaning
    // edit. PSA does not assign 012, 024 or 025 within Calatagan.
    const suffixes = barangays.data.map((b) => b.psgc10.slice(-3)).sort();
    expect(suffixes).toEqual([
      '001', '002', '003', '004', '005', '006', '007', '008', '009', '010',
      '011', '013', '014', '015', '016', '017', '018', '019', '020', '021',
      '022', '023', '026', '027', '028',
    ]);
    expect(suffixes).not.toContain('012');
    expect(suffixes).not.toContain('024');
    expect(suffixes).not.toContain('025');
  });
});

describe('population, from PSA primary data', () => {
  it('publishes the 2024 count as the latest official release', () => {
    expect(population2024.data.population).toBe(60420);
    expect(population2024.data.households).toBe(15442);
    expect(population2024.source.tier).toBe(1);
    expect(population2024.source.verification).toBe('verified');
    expect(population2024.source.status).toBe('latest-official');
    expect(population2024.source.isLatestKnownOfficial).toBe(true);
  });

  it('rests on a primary government source, not an aggregator', () => {
    const primary = population2024.source.sources.filter(
      (s) => s.authority === 'primary-government',
    );
    expect(primary.length).toBeGreaterThan(0);
    expect(primary.some((s) => s.url.includes('openstat.psa.gov.ph'))).toBe(true);
  });

  it('reconciles barangay counts exactly to the municipal total', () => {
    // The reconciliation rule that caught a fabricated barangay table during
    // the audit reconciliation. Now applied to PSA's own figures.
    const population = barangayPopulation2024.data.reduce((sum, b) => sum + b.totalPopulation, 0);
    const households = barangayPopulation2024.data.reduce((sum, b) => sum + b.households, 0);
    expect(population).toBe(population2024.data.population);
    expect(households).toBe(population2024.data.households);
  });

  it('has one population row per barangay, and no orphans', () => {
    const codes = new Set(barangays.data.map((b) => b.psgc10));
    const populationCodes = new Set(barangayPopulation2024.data.map((b) => b.psgc10));
    expect(populationCodes.size).toBe(codes.size);
    for (const code of populationCodes) expect(codes.has(code)).toBe(true);
  });

  it('never lets household population exceed total population', () => {
    expect(psaPopulation.municipality.householdPopulation).toBeLessThanOrEqual(
      psaPopulation.municipality.totalPopulation,
    );
    for (const barangay of psaPopulation.barangays) {
      expect(barangay.householdPopulation).toBeLessThanOrEqual(barangay.totalPopulation);
    }
  });

  it('keeps the census series chronological and consistent with the 2024 count', () => {
    const series = populationSeries.data;
    expect(series.map((entry) => entry.population)).toEqual([56449, 58719, 60420]);
    const dates = series.map((entry) => Date.parse(entry.referenceDate));
    for (let i = 1; i < dates.length; i += 1) expect(dates[i]).toBeGreaterThan(dates[i - 1]);
    expect(series.at(-1)?.population).toBe(population2024.data.population);
  });
});

describe('land area remains unresolved', () => {
  it('records PSA\u2019s figure without publishing it', () => {
    // PSA's own table reports 10.50 km², implying a density around ten times
    // that of comparable municipalities in the same table. Recorded, not shown.
    expect(LAND_AREA_UNRESOLVED.psaReportedKm2).toBeCloseTo(10.5, 2);
    expect(Object.keys(municipality.data)).not.toContain('landArea');
  });

  it('flags the implied density as implausible, which is why it is withheld', () => {
    const impliedDensity =
      population2024.data.population / LAND_AREA_UNRESOLVED.psaReportedKm2;
    expect(impliedDensity).toBeGreaterThan(5000);
    const alternativeDensity =
      population2024.data.population / LAND_AREA_UNRESOLVED.alternativeKm2;
    expect(alternativeDensity).toBeLessThan(700);
  });
});

describe('withheld facts', () => {
  it('records a reason for every deliberate omission', () => {
    expect(WITHHELD.length).toBeGreaterThan(0);
    for (const entry of WITHHELD) {
      expect(entry.fact.trim()).not.toBe('');
      expect(entry.reason.trim().length).toBeGreaterThan(20);
    }
  });

  it('does not publish land area, which remains contested', () => {
    expect(WITHHELD.some((w) => /land area/i.test(w.fact))).toBe(true);
    expect(Object.keys(municipality.data)).not.toContain('landArea');
  });
});

describe('the guardrails actually fail when they should', () => {
  const validSource = municipality.source;

  const invalid = (overrides: Partial<DataSource>) =>
    dataSourceSchema.safeParse({ ...validSource, ...overrides }).success;

  it('rejects a record with no sources', () => {
    expect(invalid({ sources: [] })).toBe(false);
  });

  it('rejects a future verification date', () => {
    const nextYear = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10) as DataSource['lastVerified'];
    expect(invalid({ lastVerified: nextYear })).toBe(false);
  });

  it('rejects a malformed verification date', () => {
    expect(invalid({ lastVerified: '2026-13-45' as DataSource['lastVerified'] })).toBe(false);
  });

  it('rejects an unverified record placed in a published tier', () => {
    expect(invalid({ verification: 'unverified', tier: 1 })).toBe(false);
    expect(invalid({ verification: 'unverified', tier: 2 })).toBe(false);
  });

  it('rejects tier 1 that is merely reported', () => {
    expect(invalid({ verification: 'reported', tier: 1 })).toBe(false);
  });

  it('rejects tier 2 without a caveat', () => {
    expect(invalid({ verification: 'reported', tier: 2, caveat: undefined })).toBe(false);
  });

  it('rejects a published record resting only on a tertiary source', () => {
    expect(
      invalid({
        tier: 1,
        sources: [
          {
            name: 'Calatagan',
            publisher: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Calatagan',
            accessedOn: '2026-09-22',
            authority: 'tertiary',
          },
        ],
      }),
    ).toBe(false);
  });

  it('rejects a non-https source URL', () => {
    const result = z
      .object({ source: dataSourceSchema })
      .safeParse({
        source: {
          ...validSource,
          sources: [{ ...validSource.sources[0], url: 'http://blgf.gov.ph/x.pdf' }],
        },
      });
    expect(result.success).toBe(false);
  });

  it('rejects a barangay PSGC that belongs to another municipality', () => {
    expect(barangaySchema.safeParse({ psgc10: '0401009001', name: 'Elsewhere' }).success).toBe(
      false,
    );
  });

  it('rejects the municipal code being used as a barangay code', () => {
    expect(barangaySchema.safeParse({ psgc10: CALATAGAN_PSGC_10, name: 'Calatagan' }).success).toBe(
      false,
    );
  });
});
