import { describe, expect, it } from 'vitest';

import { archivedDocuments, documentKinds, documentYears, documentsSource, WAYBACK_CALATAGAN } from './documents.js';
import { archivedDocumentSchema, archivedDocumentsSchema, KIND_LABELS } from './schemas/documents.js';
import { dataSourceSchema } from './schemas/provenance.js';
import { isPublishable } from './types/provenance.js';

/** Verified snapshot, not an eternal invariant: the archive can gain captures. */
const SNAPSHOT = { measuredOn: '2026-09-22', documents: 232 };

const docs = archivedDocuments.documents;

describe('dataset integrity', () => {
  it('parses against the schema', () => {
    expect(() => archivedDocumentsSchema.parse(archivedDocuments)).not.toThrow();
  });

  it('validates every document individually', () => {
    for (const doc of docs) expect(() => archivedDocumentSchema.parse(doc)).not.toThrow();
  });

  it('has unique ids', () => {
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });

  it('indexes at least the documents found on the measurement date', () => {
    expect(docs.length).toBeGreaterThanOrEqual(SNAPSHOT.documents);
  });
});

describe('links', () => {
  it('gives every document a working-shaped archive URL', () => {
    for (const doc of docs) {
      expect(doc.archiveUrl.startsWith('https://web.archive.org/web/')).toBe(true);
      expect(() => new URL(doc.archiveUrl)).not.toThrow();
    }
  });

  it('keeps the original municipal URL alongside the archive copy', () => {
    for (const doc of docs) {
      expect(doc.originalUrl).toContain('calatagan.gov.ph');
      expect(doc.archiveUrl).toContain('calatagan.gov.ph');
    }
  });

  it('records a capture date that is not in the future', () => {
    const now = Date.now() + 24 * 60 * 60 * 1000;
    for (const doc of docs) {
      const captured = Date.parse(`${doc.capturedAt}T00:00:00Z`);
      expect(Number.isNaN(captured)).toBe(false);
      expect(captured).toBeLessThanOrEqual(now);
    }
  });
});

describe('nothing archived is presented as current', () => {
  it('marks every document archived or superseded, never current', () => {
    for (const doc of docs) expect(['archived', 'superseded']).toContain(doc.status);
  });

  it('marks a document whose own period has ended as superseded', () => {
    const expired = docs.filter((d) => /200\d\s*-\s*20(0|1)\d/.test(d.filename));
    for (const doc of expired) expect(doc.status).toBe('superseded');
  });

  it('never claims a published year outside the life of the site', () => {
    for (const doc of docs) {
      if (doc.publishedYear === null) continue;
      expect(doc.publishedYear).toBeGreaterThanOrEqual(2000);
      expect(doc.publishedYear).toBeLessThanOrEqual(new Date().getUTCFullYear());
    }
  });
});

describe('classification is honest', () => {
  it('gives every kind a human label', () => {
    for (const doc of docs) expect(KIND_LABELS[doc.kind]).toBeTruthy();
  });

  it('labels unmatched documents "other" rather than guessing', () => {
    const other = docs.filter((d) => d.kind === 'other');
    // Some documents genuinely cannot be classified from their filename. That
    // is fine; silently assigning them a category would not be.
    expect(other.length).toBeLessThan(docs.length / 2);
    for (const doc of other) expect(KIND_LABELS[doc.kind]).toBe('Other');
  });

  it('counts by kind agree with the documents', () => {
    const tally: Record<string, number> = {};
    for (const doc of docs) tally[doc.kind] = (tally[doc.kind] ?? 0) + 1;
    expect(archivedDocuments.countsByKind).toEqual(tally);
    expect(documentKinds.reduce((sum, k) => sum + k.count, 0)).toBe(docs.length);
  });

  it('lists years newest first and only years that occur', () => {
    const present = new Set(docs.map((d) => d.publishedYear).filter((y) => y !== null));
    for (const year of documentYears) expect(present.has(year)).toBe(true);
    expect([...documentYears]).toEqual([...documentYears].sort((a, b) => b - a));
  });
});

describe('provenance', () => {
  it('carries a schema-valid DataSource', () => {
    expect(() => dataSourceSchema.parse(documentsSource)).not.toThrow();
  });

  it('is tier 2, archived, and says the documents are not current', () => {
    expect(documentsSource.tier).toBe(2);
    expect(documentsSource.status).toBe('archived');
    expect(isPublishable(documentsSource)).toBe(true);
    expect(documentsSource.caveat).toMatch(/not.*current|historical record/i);
  });

  it('cites the archive as an archived-official source, not as primary', () => {
    expect(WAYBACK_CALATAGAN.authority).toBe('archived-official');
  });

  it('records that documents are linked rather than mirrored', () => {
    expect(documentsSource.note).toMatch(/not mirrored|linked/i);
  });
});
