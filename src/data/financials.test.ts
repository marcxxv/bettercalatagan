import { describe, expect, it } from 'vitest';

import {
  annualSeries,
  filingRecord,
  financials,
  financialsSource,
  headline,
  itemOf,
  sectorSpending,
  sreDataset,
  verifiedFilings,
} from './financials.js';
import { sreDatasetSchema, sreFilingSchema } from './schemas/sre.js';
import { dataSourceSchema } from './schemas/provenance.js';
import { isPublishable } from './types/provenance.js';

/** Verified snapshot as measured, not an eternal invariant. */
const SNAPSHOT = { measuredOn: '2026-09-22', quarters: 14 };

describe('dataset integrity', () => {
  it('parses against the schema', () => {
    expect(() => sreDatasetSchema.parse(sreDataset)).not.toThrow();
  });

  it('validates every filing individually', () => {
    for (const filing of sreDataset.filings) {
      expect(() => sreFilingSchema.parse(filing)).not.toThrow();
    }
  });

  it('has unique filing ids', () => {
    const ids = sreDataset.filings.map((f) => f.filingId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('links every extraction to a filing in the document index', () => {
    for (const filing of sreDataset.filings) {
      const record = filingRecord(filing.filingId);
      expect(record, `no FDP record for ${filing.filingId}`).toBeDefined();
      expect(record?.fdppId).toBe(filing.fdppId);
      expect(record?.formSlug).toBe('statement-of-receipts-and-expenditures');
      expect(record?.documentPeriod.year).toBe(filing.documentPeriod.year);
      expect(record?.documentPeriod.quarter).toBe(filing.documentPeriod.quarter);
    }
  });

  it('confirms each sheet names Calatagan and the period it claims', () => {
    for (const filing of sreDataset.filings) {
      expect(filing.header.lgu?.toUpperCase()).toBe('CALATAGAN');
      expect(filing.header.calendarYear).toBe(filing.documentPeriod.year);
      expect(filing.header.quarter).toBe(filing.documentPeriod.quarter);
    }
  });
});

describe('every published figure is traceable', () => {
  it('records a cell reference for every extracted value', () => {
    for (const filing of verifiedFilings) {
      for (const item of filing.items) {
        for (const column of ['budget', 'generalFund', 'sef', 'total'] as const) {
          const cell = item[column];
          if (cell === null) continue;
          expect(cell.cell, `${filing.filingId}/${item.key}/${column}`).toMatch(/^[A-Z]+\d+$/);
          expect(Number.isFinite(cell.value)).toBe(true);
        }
      }
    }
  });

  it('reads each row from the row it says it did', () => {
    for (const filing of verifiedFilings) {
      for (const item of filing.items) {
        for (const column of ['budget', 'generalFund', 'sef', 'total'] as const) {
          const cell = item[column];
          if (cell === null) continue;
          expect(Number(cell.cell.replace(/^[A-Z]+/, ''))).toBe(item.row);
        }
      }
    }
  });

  it('keeps the column letters consistent with the form layout', () => {
    for (const filing of verifiedFilings) {
      expect(filing.columns).toEqual({ budget: 'D', generalFund: 'E', sef: 'F', total: 'G' });
      for (const item of filing.items) {
        if (item.total) expect(item.total.cell.startsWith('G')).toBe(true);
        if (item.generalFund) expect(item.generalFund.cell.startsWith('E')).toBe(true);
        if (item.sef) expect(item.sef.cell.startsWith('F')).toBe(true);
      }
    }
  });
});

describe('reconciliation is a gate, not a note', () => {
  it('publishes only filings whose own arithmetic holds', () => {
    for (const filing of verifiedFilings) {
      expect(filing.verification).toBe('verified');
      expect(filing.reconciliation.failed).toBe(0);
      expect(filing.unmatchedLabels).toHaveLength(0);
    }
  });

  it('never publishes an unverified extraction', () => {
    const unverified = sreDataset.filings.filter((f) => f.verification === 'unverified');
    for (const filing of unverified) {
      expect(verifiedFilings.map((f) => f.filingId)).not.toContain(filing.filingId);
    }
  });

  it('recomputes the fund split independently of the stored check', () => {
    // General Fund + SEF must equal Total, recomputed here rather than trusted.
    for (const filing of verifiedFilings) {
      for (const item of filing.items) {
        if (!item.generalFund || !item.sef || !item.total) continue;
        const sum = item.generalFund.value + item.sef.value;
        expect(
          Math.abs(sum - item.total.value),
          `${filing.filingId}/${item.key}: ${sum} != ${item.total.value}`,
        ).toBeLessThanOrEqual(0.02);
      }
    }
  });

  it('recomputes the income identity independently', () => {
    for (const filing of verifiedFilings) {
      const local = itemOf(filing, 'local-sources')?.total?.value;
      const external = itemOf(filing, 'external-sources')?.total?.value;
      const total = itemOf(filing, 'total-current-operating-income')?.total?.value;
      if (local === undefined || external === undefined || total === undefined) continue;
      expect(Math.abs(local + external - total)).toBeLessThanOrEqual(0.03);
    }
  });

  it('recomputes the sectoral expenditure identity independently', () => {
    for (const filing of verifiedFilings) {
      const sectors = sectorSpending(filing);
      const total = itemOf(filing, 'total-current-operating-expenditures')?.total?.value;
      if (total === undefined || sectors.length !== 8) continue;
      const sum = sectors.reduce((acc, s) => acc + s.value, 0);
      expect(Math.abs(sum - total)).toBeLessThanOrEqual(0.09);
    }
  });

  it('records every check it claims to have run', () => {
    for (const filing of sreDataset.filings) {
      expect(filing.reconciliation.total).toBe(filing.checks.length);
      expect(filing.reconciliation.passed).toBe(filing.checks.filter((c) => c.passed).length);
      expect(filing.reconciliation.failed).toBe(filing.checks.filter((c) => !c.passed).length);
    }
  });
});

describe('figures are plausible', () => {
  it('reports no negative income or expenditure totals', () => {
    for (const filing of verifiedFilings) {
      const figures = headline(filing);
      expect(figures.income ?? 0).toBeGreaterThan(0);
      expect(figures.expenditures ?? 0).toBeGreaterThanOrEqual(0);
    }
  });

  it('never has a part exceeding its own total', () => {
    for (const filing of verifiedFilings) {
      const income = itemOf(filing, 'total-current-operating-income')?.total?.value ?? 0;
      for (const key of ['local-sources', 'external-sources', 'national-tax-allotment']) {
        const part = itemOf(filing, key)?.total?.value ?? 0;
        expect(part, `${filing.filingId}/${key}`).toBeLessThanOrEqual(income + 0.03);
      }
    }
  });

  it('grows cumulatively through each calendar year', () => {
    // SRE figures are year-to-date, so Q1 <= Q2 <= Q3 <= Q4 within a year.
    const byYear = new Map<number, typeof verifiedFilings>();
    for (const filing of verifiedFilings) {
      const list = byYear.get(filing.documentPeriod.year) ?? [];
      list.push(filing);
      byYear.set(filing.documentPeriod.year, list);
    }
    for (const [year, filings] of byYear) {
      const ordered = [...filings].sort((a, b) => a.documentPeriod.quarter - b.documentPeriod.quarter);
      let previous = 0;
      for (const filing of ordered) {
        const income = headline(filing).income ?? 0;
        expect(income, `CY${year} Q${filing.documentPeriod.quarter} income went backwards`).toBeGreaterThanOrEqual(
          previous - 0.03,
        );
        previous = income;
      }
    }
  });

  it('builds an annual series only from fourth-quarter filings', () => {
    for (const row of annualSeries()) {
      expect(row.filing.documentPeriod.quarter).toBe(4);
    }
  });
});

describe('provenance', () => {
  it('carries a schema-valid DataSource', () => {
    expect(() => dataSourceSchema.parse(financialsSource)).not.toThrow();
  });

  it('is tier 2 and says plainly that the figures are unaudited', () => {
    expect(financialsSource.tier).toBe(2);
    expect(isPublishable(financialsSource)).toBe(true);
    expect(financialsSource.caveat).toMatch(/not audited|unaudited/i);
  });

  it('cites the DILG portal as a primary government source', () => {
    expect(financialsSource.sources.some((s) => s.authority === 'primary-government')).toBe(true);
  });

  it('warns that quarterly figures are cumulative', () => {
    expect(financialsSource.note).toMatch(/cumulative/i);
  });

  it('exposes the same filings through the Sourced wrapper', () => {
    expect(financials.data).toBe(verifiedFilings);
  });
});

describe('measured snapshot (not an eternal invariant)', () => {
  it(`covers at least the ${SNAPSHOT.quarters} quarters extracted on ${SNAPSHOT.measuredOn}`, () => {
    expect(sreDataset.filings.length).toBeGreaterThanOrEqual(SNAPSHOT.quarters);
  });

  it('has every extracted quarter fully reconciled', () => {
    expect(sreDataset.verifiedCount).toBe(sreDataset.extractedCount);
  });
});
