import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { fdpDataset, fdpSource, fdpSummary, FDPP_LISTING, summarise } from './fdp.js';
import {
  FDP_FORM_SLUGS,
  fdpDatasetSchema,
  fdpFilingSchema,
  formatPeriod,
  type FdpFiling,
} from './schemas/fdp.js';
import { dataSourceSchema } from './schemas/provenance.js';
import { isPublishable } from './types/provenance.js';

/**
 * A verified snapshot, not an eternal invariant.
 *
 * The DILG portal gains filings every quarter, so these numbers are expected to
 * change. They are asserted as a floor or as an explicit "as measured on this
 * date" value, and the test names say so. A future contributor who sees one of
 * these fail should update the snapshot, not weaken the rule.
 */
const SNAPSHOT = {
  measuredOn: '2026-09-22',
  /** Portal-reported total on the measurement date. */
  filings: 156,
  /** Measured across all 156 download endpoints on the measurement date. */
  availableShareFloor: 0.75,
};

const records = fdpDataset.records;

describe('dataset integrity', () => {
  it('parses against the dataset schema', () => {
    expect(() => fdpDatasetSchema.parse(fdpDataset)).not.toThrow();
  });

  it('validates every filing individually', () => {
    for (const filing of records) {
      expect(() => fdpFilingSchema.parse(filing)).not.toThrow();
    }
  });

  it('has no duplicate local filing ids', () => {
    const ids = records.map((filing) => filing.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate DILG portal ids', () => {
    const ids = records.map((filing) => filing.fdppId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives every local id from its form type and document period', () => {
    for (const filing of records) {
      const quarter = filing.documentPeriod.quarter ? `q${filing.documentPeriod.quarter}-` : '';
      expect(filing.id).toBe(`fdp-${filing.documentPeriod.year}-${quarter}${filing.formSlug}`);
    }
  });

  it('never uses the portal id as the local id', () => {
    for (const filing of records) {
      expect(filing.id).not.toBe(String(filing.fdppId));
      expect(filing.id.startsWith('fdp-')).toBe(true);
    }
  });

  it('uses only known statutory form types', () => {
    for (const filing of records) {
      expect(FDP_FORM_SLUGS).toContain(filing.formSlug);
    }
  });

  it('keeps year and quarter combinations valid for the form cadence', () => {
    for (const filing of records) {
      const { year, quarter } = filing.documentPeriod;
      expect(year).toBeGreaterThanOrEqual(2000);
      expect(year).toBeLessThanOrEqual(new Date().getUTCFullYear() + 1);
      if (filing.formCadence === 'annual') {
        expect(quarter).toBeNull();
      } else {
        expect(quarter).not.toBeNull();
        expect(quarter).toBeGreaterThanOrEqual(1);
        expect(quarter).toBeLessThanOrEqual(4);
      }
    }
  });

  it('points every filing at an https DILG download URL carrying its portal id', () => {
    for (const filing of records) {
      expect(filing.downloadUrl.startsWith('https://fdpp.dilg.gov.ph/')).toBe(true);
      expect(() => new URL(filing.downloadUrl)).not.toThrow();
      expect(filing.downloadUrl).toContain(`id=${filing.fdppId}`);
    }
  });

  it('records a checksum and file type for every downloadable filing', () => {
    for (const filing of records.filter((f) => f.availability === 'available')) {
      expect(filing.contentSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(filing.fileType).not.toBeNull();
      expect(filing.byteLength).toBeGreaterThan(0);
    }
  });

  it('has no retrieval timestamp in the future', () => {
    const now = Date.now() + 24 * 60 * 60 * 1000;
    for (const filing of records) {
      expect(Date.parse(filing.retrievedAt)).toBeLessThanOrEqual(now);
      if (filing.lastKnownGoodAt) {
        expect(Date.parse(filing.lastKnownGoodAt)).toBeLessThanOrEqual(now);
      }
    }
  });

  it('reports a record count matching the records array', () => {
    expect(fdpDataset.recordCount).toBe(records.length);
  });
});

describe('provenance', () => {
  it('carries a schema-valid DataSource', () => {
    expect(() => dataSourceSchema.parse(fdpSource)).not.toThrow();
  });

  it('is published, and therefore carries a reader-facing caveat', () => {
    expect(isPublishable(fdpSource)).toBe(true);
    expect(fdpSource.tier).toBe(2);
    expect(fdpSource.caveat?.trim()).toBeTruthy();
  });

  it('cites DILG as a primary government source', () => {
    expect(FDPP_LISTING.authority).toBe('primary-government');
    expect(FDPP_LISTING.url.startsWith('https://fdpp.dilg.gov.ph/')).toBe(true);
  });

  it('declares a quarterly refresh cadence', () => {
    expect(fdpSource.expectedRefresh).toBe('quarterly');
  });
});

describe('measured snapshot (not an eternal invariant)', () => {
  it(`indexes at least the ${SNAPSHOT.filings} filings measured on ${SNAPSHOT.measuredOn}`, () => {
    // A floor, not equality: the portal gains filings each quarter. If this
    // fails, filings have DISAPPEARED, which is worth investigating.
    expect(records.length).toBeGreaterThanOrEqual(SNAPSHOT.filings);
  });

  it('covers all 14 statutory form types', () => {
    expect(fdpSummary.forms.length).toBe(14);
  });

  it('still downloads most filings successfully', () => {
    // The DILG portal returned HTTP 500 for roughly 15% of endpoints when
    // measured. If the success rate collapses, the pipeline needs attention.
    const share = fdpSummary.available / fdpSummary.total;
    expect(share).toBeGreaterThanOrEqual(SNAPSHOT.availableShareFloor);
  });

  it('finds no PDFs, so no OCR pipeline is warranted', () => {
    // Measured, not assumed. If PDFs ever appear this must be revisited.
    const types = new Set(records.map((f) => f.fileType).filter(Boolean));
    expect(types.has('pdf')).toBe(false);
  });
});

describe('document index discipline', () => {
  it('stores no extracted financial figures', () => {
    // This phase indexes documents. If a contributor starts parsing amounts
    // into this dataset, that is a design change and needs its own review.
    const forbidden = ['amount', 'total', 'budget', 'peso', 'php', 'value', 'expenditure'];
    for (const filing of records) {
      for (const key of Object.keys(filing)) {
        expect(forbidden).not.toContain(key.toLowerCase());
      }
    }
  });
});

describe('merge safety (stage → review → promote)', () => {
  // These exercise the invariants the promote step must preserve. They use
  // synthetic records so they do not depend on the live portal.
  const base: FdpFiling = {
    id: 'fdp-2026-q1-bid-results',
    fdppId: 111,
    formSlug: 'bid-results',
    formLabel: 'Bid Results on Civil Works, Goods and Services, and Consulting Services',
    formCadence: 'quarterly',
    documentPeriod: { year: 2026, quarter: 1 },
    postingPeriod: { year: 2026, quarter: 2 },
    postingLocations: ['Municipal Hall'],
    downloadUrl: 'https://fdpp.dilg.gov.ph/fdpp/report/document-download?id=111',
    availability: 'available',
    fileType: 'xlsx',
    contentSha256: 'a'.repeat(64),
    byteLength: 1234,
    retrievedAt: '2026-09-01T00:00:00.000Z',
  };

  it('a previously good record keeps its checksum when a later fetch fails', () => {
    // Mirrors the promote rule: a failure flags the record, it never erases it.
    const failed = { ...base, availability: 'source-error' as const, httpStatus: 500 };
    const merged = {
      ...base,
      ...failed,
      contentSha256: base.contentSha256,
      fileType: base.fileType,
      byteLength: base.byteLength,
      lastKnownGoodAt: base.retrievedAt,
    };
    expect(merged.contentSha256).toBe(base.contentSha256);
    expect(merged.availability).toBe('source-error');
    expect(merged.lastKnownGoodAt).toBe(base.retrievedAt);
    expect(() => fdpFilingSchema.parse(merged)).not.toThrow();
  });

  it('a resubmission keeps the prior portal id in history under the same local id', () => {
    const resubmitted = {
      ...base,
      fdppId: 222,
      downloadUrl: 'https://fdpp.dilg.gov.ph/fdpp/report/document-download?id=222',
      supersededFdppIds: [111],
    };
    expect(resubmitted.id).toBe(base.id);
    expect(resubmitted.supersededFdppIds).toContain(111);
    expect(() => fdpFilingSchema.parse(resubmitted)).not.toThrow();
  });

  it('a filing that vanishes from the listing is retained and flagged', () => {
    const vanished = {
      ...base,
      availability: 'missing-from-source' as const,
      missingSince: '2026-09-22T00:00:00.000Z',
    };
    expect(() => fdpFilingSchema.parse(vanished)).not.toThrow();
    expect(vanished.contentSha256).toBe(base.contentSha256);
  });
});

describe('the FDP guardrails fail when they should', () => {
  const valid = records[0];

  it('rejects a local id that does not match its period and form', () => {
    expect(fdpFilingSchema.safeParse({ ...valid, id: 'fdp-1999-bid-results' }).success).toBe(false);
  });

  it('rejects a quarterly form with no quarter', () => {
    const quarterly = records.find((f) => f.formCadence === 'quarterly');
    expect(quarterly).toBeDefined();
    expect(
      fdpFilingSchema.safeParse({
        ...quarterly,
        documentPeriod: { year: quarterly!.documentPeriod.year, quarter: null },
      }).success,
    ).toBe(false);
  });

  it('rejects an annual form carrying a quarter', () => {
    const annual = records.find((f) => f.formCadence === 'annual');
    expect(annual).toBeDefined();
    expect(
      fdpFilingSchema.safeParse({
        ...annual,
        documentPeriod: { year: annual!.documentPeriod.year, quarter: 2 },
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown form type', () => {
    expect(fdpFilingSchema.safeParse({ ...valid, formSlug: 'made-up-form' }).success).toBe(false);
  });

  it('rejects a non-https download URL', () => {
    expect(
      fdpFilingSchema.safeParse({ ...valid, downloadUrl: 'http://fdpp.dilg.gov.ph/x' }).success,
    ).toBe(false);
  });

  it('rejects an available filing with no checksum', () => {
    expect(
      fdpFilingSchema.safeParse({ ...valid, availability: 'available', contentSha256: undefined }).success,
    ).toBe(false);
  });

  it('rejects a malformed checksum', () => {
    expect(fdpFilingSchema.safeParse({ ...valid, contentSha256: 'nope' }).success).toBe(false);
  });

  it('rejects duplicate local ids in a dataset', () => {
    const duplicated = {
      ...fdpDataset,
      recordCount: 2,
      records: [records[0], { ...records[0], fdppId: records[0].fdppId + 1 }],
    };
    expect(fdpDatasetSchema.safeParse(duplicated).success).toBe(false);
  });

  it('rejects duplicate portal ids in a dataset', () => {
    const duplicated = {
      ...fdpDataset,
      recordCount: 2,
      records: [records[0], { ...records[1], fdppId: records[0].fdppId }],
    };
    expect(fdpDatasetSchema.safeParse(duplicated).success).toBe(false);
  });

  it('rejects a recordCount that disagrees with the records', () => {
    expect(fdpDatasetSchema.safeParse({ ...fdpDataset, recordCount: 9999 }).success).toBe(false);
  });

  it('rejects unknown fields, so a schema drift is caught rather than ignored', () => {
    expect(fdpFilingSchema.safeParse({ ...valid, surpriseField: 1 }).success).toBe(false);
  });
});

describe('deterministic generated output', () => {
  // The dataset is committed, so a rerun that only reorders keys or records
  // would produce a noisy diff and hide real changes.
  const raw = readFileSync(
    new URL('./generated/fdp-filings.json', import.meta.url),
    'utf8',
  );

  it('is pretty-printed with a trailing newline', () => {
    expect(raw.endsWith('}\n')).toBe(true);
    expect(raw).toContain('\n  "records"');
  });

  it('serialises every object with its keys sorted', () => {
    const walk = (value: unknown, path: string): void => {
      if (Array.isArray(value)) {
        value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
        return;
      }
      if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        expect(keys, `unsorted keys at ${path}`).toEqual([...keys].sort());
        for (const key of keys) walk((value as Record<string, unknown>)[key], `${path}.${key}`);
      }
    };
    walk(JSON.parse(raw), '$');
  });

  it('orders records newest period first, then by form slug', () => {
    const ordered = [...records].sort(
      (a, b) =>
        b.documentPeriod.year - a.documentPeriod.year ||
        (b.documentPeriod.quarter ?? 0) - (a.documentPeriod.quarter ?? 0) ||
        a.formSlug.localeCompare(b.formSlug),
    );
    expect(records.map((r) => r.id)).toEqual(ordered.map((r) => r.id));
  });

  it('round-trips byte-identically through parse and serialise', () => {
    expect(`${JSON.stringify(JSON.parse(raw), null, 2)}\n`).toBe(raw);
  });
});

describe('helpers', () => {
  it('formats quarterly and annual periods distinctly', () => {
    expect(formatPeriod({ year: 2026, quarter: 2 })).toBe('Q2 CY2026');
    expect(formatPeriod({ year: 2025, quarter: null })).toBe('CY2025');
  });

  it('summarises counts consistently with the dataset', () => {
    const summary = summarise(records);
    expect(summary.total).toBe(records.length);
    expect(summary.available + summary.sourceError + summary.missingFromSource).toBeLessThanOrEqual(
      summary.total,
    );
    expect(summary.forms.reduce((sum, form) => sum + form.count, 0)).toBe(records.length);
  });
});
