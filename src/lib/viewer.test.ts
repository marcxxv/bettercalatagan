import { describe, expect, it } from 'vitest';
import { archivedDocuments } from '../data/documents';
import { fdpDataset } from '../data/fdp';
import { formatPeriod } from '../data/schemas/fdp';
import { formatCell } from '../scripts/office';
import { archiveReadAttrs, fdpReadAttrs, readerSrc } from './viewer';

describe('reader links', () => {
  it('maps a Wayback capture to its raw-bytes path', () => {
    expect(readerSrc('https://web.archive.org/web/20220806072203/http://calatagan.gov.ph/a.pdf')).toBe(
      '/wayback/20220806072203id_/http://calatagan.gov.ph/a.pdf',
    );
    expect(readerSrc('https://example.org/a.pdf')).toBeNull();
  });

  it('offers the reader for every archived PDF and DOCX, and never for legacy .doc', () => {
    for (const doc of archivedDocuments.documents) {
      const attrs = archiveReadAttrs(doc);
      if (doc.fileType === 'doc') expect(attrs).toBeNull();
      else {
        expect(attrs, doc.id).not.toBeNull();
        expect(attrs!['data-read'].startsWith('/wayback/')).toBe(true);
        expect(attrs!['data-original']).toBe(doc.archiveUrl);
      }
    }
  });

  it('offers the reader only for FDP filings the portal actually served', () => {
    for (const filing of fdpDataset.records) {
      const attrs = fdpReadAttrs(filing, formatPeriod(filing.documentPeriod));
      expect(attrs !== null, filing.id).toBe(filing.availability === 'available' && filing.fileType === 'xlsx');
      if (attrs) expect(attrs['data-read']).toBe(`/fdp-file/${filing.fdppId}`);
    }
  });

  it('keeps reader ids unique so ?read= links are unambiguous', () => {
    const ids = [
      ...archivedDocuments.documents.map((d) => d.id),
      ...fdpDataset.records.map((r) => r.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('spreadsheet number formats', () => {
  it('renders peso amounts exactly as the filing formats them', () => {
    expect(formatCell(11834250.5, '#,##0.00')).toBe('11,834,250.50');
    expect(formatCell(-665749.5, '#,##0.00;(#,##0.00)')).toBe('(665,749.50)');
    expect(formatCell(-12, '#,##0')).toBe('-12');
    expect(formatCell(1234567, '#,##0')).toBe('1,234,567');
    expect(formatCell(0.9467, '0.0%')).toBe('94.7%');
    expect(formatCell(1234.5, '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)')).toBe('1,234.50');
  });

  it('keeps General numbers faithful, without float noise', () => {
    expect(formatCell(42, 'General')).toBe('42');
    expect(formatCell(0.1 + 0.2, 'General')).toBe('0.3');
  });

  it('reads Excel date serials', () => {
    expect(formatCell(46000, 'mm-dd-yy')).toBe('Dec 9, 2025');
  });
});
