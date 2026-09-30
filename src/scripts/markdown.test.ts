import { describe, expect, it } from 'vitest';
import { plainText, renderMarkdown } from './markdown';

const cite = (n: number) => (n === 1 ? { n: 1, url: '/finances#q', label: 'Finances — Q2' } : undefined);

describe('renderMarkdown', () => {
  it('escapes HTML rather than passing it through', () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
  });

  it('links citations it knows and drops those it does not', () => {
    const html = renderMarkdown('Income was **₱237.9M** [1][7].', cite);
    expect(html).toContain('<strong>₱237.9M</strong>');
    expect(html).toContain('<a class="cite" href="/finances#q"');
    expect(html).not.toContain('[7]');
  });

  it('allows links only to this site or https', () => {
    expect(renderMarkdown('[ok](/history) [ok2](https://psa.gov.ph)')).toContain('href="/history"');
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('href');
    expect(renderMarkdown('[x](//evil.example)')).not.toContain('href');
  });

  it('renders lists and tables', () => {
    expect(renderMarkdown('Lead.\n\n* one\n* two')).toBe('<p>Lead.</p><ul><li>one</li><li>two</li></ul>');
    const table = renderMarkdown('| Year | Population |\n|---|---|\n| 2015 | 56,449 |\n| 2024 | 60,420 |');
    expect(table).toContain('<th scope="col">Year</th>');
    expect(table).toContain('<td>60,420</td>');
  });
});

describe('plainText', () => {
  it('keeps cited markers and lists their pages as footnotes', () => {
    expect(plainText('**Yes** [1][9].', cite, 'https://example.org')).toBe(
      'Yes [1].\n\n[1] Finances — Q2: https://example.org/finances#q',
    );
  });
});
