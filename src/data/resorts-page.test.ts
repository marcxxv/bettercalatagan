import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../pages/resorts.astro', import.meta.url), 'utf8');

describe('resort channel presentation', () => {
  it('uses icon-only channel links with explicit accessible names', () => {
    expect(page).toContain('aria-label={`${resort.name} on ${channel.label}`}');
    expect(page).toContain('src={channelLogos[channel.label]}');
    for (const brand of ['facebook', 'instagram', 'tiktok']) {
      const png = readFileSync(new URL(`../../public/icons/channels/${brand}.png`, import.meta.url));
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    }
    const svg = readFileSync(new URL('../../public/icons/channels/airbnb.svg', import.meta.url), 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/<script|<foreignObject|(?:href|src)=["']https?:/i);
  });

  it('centers the website column label and website actions', () => {
    expect(page).toContain('class="website-heading"');
    expect(page).toContain('.website-heading { text-align: center; }');
    expect(page).toContain('.resort-row > .row-actions { justify-content: center; }');
  });

  it('provides a progressively enhanced resort search with a count and empty state', () => {
    expect(page).toContain('data-filter="resort-list"');
    expect(page).toContain('name="q"');
    expect(page).toContain('data-count-for="resort-list"');
    expect(page).toContain('data-empty-for="resort-list"');
    expect(page).toContain('id="resort-list"');
    expect(page).toContain('data-search={resortSearchText(resort)}');
    expect(page).toContain("import '../scripts/filter.ts'");
  });
});
